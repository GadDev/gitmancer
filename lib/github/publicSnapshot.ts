import "server-only";
import { z } from "zod";
import {
  GithubClient,
  GithubError,
  normalizeLogin,
  type Fetcher,
} from "./client";
import {
  complete,
  SnapshotSchema,
  type Evidence,
  type Snapshot,
} from "@/lib/cards/schema";

const DAY = 86_400_000;
const repo = z.object({ id: z.string(), isPrivate: z.boolean() });
const date = z.iso.datetime();
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const pageInfo = z.object({
  hasNextPage: z.boolean(),
  endCursor: z.string().nullable(),
});
const CommitNode = z.object({
  occurredAt: date,
  commitCount: count,
  isRestricted: z.boolean(),
});
const CommitCollection = z.object({
  totalRepositoriesWithContributedCommits: count,
  commitContributionsByRepository: z.array(
    z.object({
      repository: repo,
      contributions: z.object({
        nodes: z.array(CommitNode.nullable()),
        pageInfo,
      }),
    }),
  ),
});
const Event = z.object({
  occurredAt: date,
  isRestricted: z.boolean(),
  pullRequest: z.object({ id: z.string(), repository: repo }).optional(),
  issue: z.object({ id: z.string(), repository: repo }).optional(),
  repository: repo.optional(),
  pullRequestReview: z.object({ id: z.string() }).optional(),
});
const EventConnection = z.object({
  nodes: z.array(Event.nullable()),
  pageInfo,
});
type EventNode = z.infer<typeof Event>;
type CommitRecord = { repositoryId: string; day: string; count: number };
const dayOf = (s: string) => new Date(s).toISOString().slice(0, 10);
const partial = (value: number, reason: string): Evidence => ({
  status: "partial",
  value,
  reason,
});
const metric = (value: number, ok: boolean): Evidence =>
  ok
    ? complete(value)
    : partial(
        value,
        "Some public contribution records could not be fetched within the generation limits.",
      );
function collection(data: Record<string, unknown>): unknown {
  return z.object({ contributionsCollection: z.unknown() }).parse(data.user)
    .contributionsCollection;
}
function terminal(error: unknown): boolean {
  return (
    error instanceof GithubError &&
    ["ratelimit", "config", "forbidden"].includes(error.code)
  );
}
export function aggregate(
  commits: CommitRecord[],
  prs: EventNode[],
  reviews: EventNode[],
  issues: EventNode[],
  userId: string,
) {
  const days = new Set<string>();
  const seenCommits = new Map<string, CommitRecord>();
  for (const c of commits) seenCommits.set(`${c.repositoryId}:${c.day}`, c);
  const byDay = new Map<string, number>();
  for (const c of seenCommits.values()) {
    byDay.set(c.day, (byDay.get(c.day) ?? 0) + c.count);
    if (c.count > 0) days.add(c.day);
  }
  const unique = (events: EventNode[], kind: "prs" | "reviews" | "issues") => {
    const seen = new Set<string>();
    for (const e of events) {
      const target = kind === "issues" ? e.issue : e.pullRequest;
      const repository = target?.repository ?? e.repository;
      if (e.isRestricted || !target || !repository || repository.isPrivate)
        continue;
      const key =
        kind === "reviews"
          ? `${target.id}:${userId}:${dayOf(e.occurredAt)}`
          : target.id;
      if (!seen.has(key)) {
        seen.add(key);
        days.add(dayOf(e.occurredAt));
      }
    }
    return seen.size;
  };
  const p = unique(prs, "prs"),
    r = unique(reviews, "reviews"),
    i = unique(issues, "issues");
  return {
    rawCommits: [...byDay.values()].reduce((a, b) => a + b, 0),
    commits: [...byDay.values()].reduce((a, b) => a + Math.min(10, b), 0),
    prs: p,
    reviews: r,
    issuesOpened: i,
    activeDays: days.size,
  };
}

export async function fetchPublicSnapshot(
  input: string,
  options: {
    token?: string;
    now?: Date;
    fetcher?: Fetcher;
    limits?: { attempts: number; points: number; milliseconds: number };
  } = {},
): Promise<Snapshot> {
  const login = normalizeLogin(input);
  const now = options.now ?? new Date();
  const from = new Date(now.getTime() - 365 * DAY);
  const client = new GithubClient(
    options.token ?? process.env.GITHUB_TOKEN ?? "",
    options.fetcher,
    Date.now,
    options.limits,
  );
  const identity = await client.profile(login);
  const warnings: string[] = [];
  const records: CommitRecord[] = [];
  let commitsComplete = true;
  const commitWindow = async (
    start: Date,
    end: Date,
    depth = 0,
  ): Promise<void> => {
    try {
      const data = await client.query(
        `query CommitWindow($login:String!,$from:DateTime!,$to:DateTime!){rateLimit{cost} user(login:$login){contributionsCollection(from:$from,to:$to){totalRepositoriesWithContributedCommits commitContributionsByRepository(maxRepositories:100){repository{id isPrivate} contributions(first:100){nodes{occurredAt commitCount isRestricted} pageInfo{hasNextPage endCursor}}}}}}`,
        { login, from: start.toISOString(), to: end.toISOString() },
      );
      const c = CommitCollection.parse(collection(data));
      if (
        c.totalRepositoriesWithContributedCommits >
        c.commitContributionsByRepository.length
      )
        commitsComplete = false;
      for (const group of c.commitContributionsByRepository) {
        if (
          group.contributions.pageInfo.hasNextPage ||
          group.contributions.nodes.some((n) => n === null)
        )
          commitsComplete = false;
        if (group.repository.isPrivate) continue;
        for (const n of group.contributions.nodes) {
          if (!n || n.isRestricted) continue;
          // Ninety-day chunks keep each per-repository daily connection under 100 nodes.
          // occurredAt represents a daily aggregate, so its midnight can precede the
          // requested first-day time. GitHub applies the time window to commitCount.
          if (
            dayOf(n.occurredAt) < dayOf(start.toISOString()) ||
            dayOf(n.occurredAt) > dayOf(end.toISOString())
          )
            continue;
          records.push({
            repositoryId: group.repository.id,
            day: dayOf(n.occurredAt),
            count: n.commitCount,
          });
        }
      }
    } catch (error) {
      if (terminal(error)) throw error;
      if (
        error instanceof GithubError &&
        error.code === "resource" &&
        depth < 2 &&
        end.getTime() - start.getTime() > DAY
      ) {
        // Split at UTC midnight to avoid splitting a daily aggregate in half.
        const mid = new Date(
          Math.floor((start.getTime() + end.getTime()) / 2 / DAY) * DAY,
        );
        await commitWindow(start, new Date(mid.getTime() - 1), depth + 1);
        await commitWindow(mid, end, depth + 1);
      } else commitsComplete = false;
    }
  };
  // Fixed UTC day boundaries avoid overlapping per-day aggregate records.
  let cursor = from;
  while (cursor < now) {
    const boundary = new Date(
      Math.floor((cursor.getTime() + 90 * DAY) / DAY) * DAY,
    );
    const end = boundary < now ? new Date(boundary.getTime() - 1) : now;
    await commitWindow(cursor, end);
    cursor = new Date(end.getTime() + 1);
  }
  const events = async (
    field:
      | "pullRequestContributions"
      | "pullRequestReviewContributions"
      | "issueContributions",
  ) => {
    const nodes: EventNode[] = [];
    let after: string | null = null;
    const seen = new Set<string>();
    try {
      for (;;) {
        const detail =
          field === "issueContributions"
            ? "issue{id repository{id isPrivate}}"
            : field === "pullRequestReviewContributions"
              ? "pullRequest{id repository{id isPrivate}} repository{id isPrivate} pullRequestReview{id}"
              : "pullRequest{id repository{id isPrivate}}";
        const data = await client.query(
          `query Events($login:String!,$from:DateTime!,$to:DateTime!,$after:String){rateLimit{cost} user(login:$login){contributionsCollection(from:$from,to:$to){${field}(first:100,after:$after){nodes{occurredAt isRestricted ${detail}} pageInfo{hasNextPage endCursor}}}}}`,
          { login, from: from.toISOString(), to: now.toISOString(), after },
        );
        const c = z.record(z.string(), z.unknown()).parse(collection(data));
        const page = EventConnection.parse(c[field]);
        if (page.nodes.some((n) => n === null)) return { nodes, ok: false };
        nodes.push(
          ...page.nodes
            .filter((n): n is EventNode => !!n)
            .filter((n) => {
              const t = Date.parse(n.occurredAt);
              return t >= from.getTime() && t <= now.getTime();
            }),
        );
        if (!page.pageInfo.hasNextPage) return { nodes, ok: true };
        const next = page.pageInfo.endCursor;
        if (!next || seen.has(next)) return { nodes, ok: false };
        seen.add(next);
        after = next;
      }
    } catch (error) {
      if (terminal(error)) throw error;
      return { nodes, ok: false };
    }
  };
  if (identity.accountType === "Bot")
    warnings.push(
      "Automaton account. Human-community mechanics are not assigned.",
    );
  const prs = await events("pullRequestContributions");
  const reviews = await events("pullRequestReviewContributions");
  const issues = await events("issueContributions");
  const values = aggregate(
    records,
    prs.nodes,
    reviews.nodes,
    issues.nodes,
    identity.githubUserId,
  );
  const all = commitsComplete && prs.ok && reviews.ok && issues.ok;
  if (!all)
    warnings.push(
      "Partial public data — mechanics pending. A failed or truncated fetch is not zero activity.",
    );
  // GitHub exposes the latest review contribution per PR, not every individual review.
  warnings.push(
    "Public contribution records only. GitHub review contributions represent the latest review per PR; active days reflect the returned public records.",
  );
  return SnapshotSchema.parse({
    identity,
    window: { from: from.toISOString(), to: now.toISOString() },
    fetchedAt: now.toISOString(),
    visibility: "public",
    source: "github",
    rawCommits: metric(values.rawCommits, commitsComplete),
    metrics: {
      commits: metric(values.commits, commitsComplete),
      prs: metric(values.prs, prs.ok),
      reviews: metric(values.reviews, reviews.ok),
      issuesOpened: metric(values.issuesOpened, issues.ok),
      activeDays: metric(values.activeDays, all),
    },
    warnings,
  });
}
