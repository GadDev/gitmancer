import { describe, it, expect, vi } from "vitest";
import { GithubClient, normalizeLogin } from "@/lib/github/client";
import { aggregate, fetchPublicSnapshot } from "@/lib/github/publicSnapshot";
const NOW = new Date("2026-11-25T00:00:00.000Z");
const repo = { id: "repo-1", isPrivate: false };
const event = (id: string, day = "2026-11-01", isPrivate = false) => ({
  occurredAt: day + "T12:00:00.000Z",
  isRestricted: false,
  pullRequest: { id, repository: { ...repo, isPrivate } },
  issue: { id, repository: { ...repo, isPrivate } },
});
const page = (nodes: unknown[], next: string | null = null) => ({
  nodes,
  pageInfo: { hasNextPage: !!next, endCursor: next },
});
const gql = (c: unknown) =>
  Response.json({
    data: { user: { contributionsCollection: c }, rateLimit: { cost: 1 } },
  });
function scripted(
  options: { broken?: boolean; private?: boolean; missingPage?: boolean } = {},
) {
  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    if (String(url).includes("/users/"))
      return Response.json({
        node_id: "USER_1",
        login: "tester",
        name: "Test",
        type: "User",
        created_at: "2020-01-01T00:00:00Z",
      });
    const { query, variables } = JSON.parse(String(init?.body));
    if (query.includes("CommitWindow")) {
      if (options.broken)
        return Response.json({
          errors: [{ type: "RESOURCE_LIMITS_EXCEEDED" }],
        });
      const occurredAt = variables.from;
      return gql({
        totalRepositoriesWithContributedCommits: 1,
        commitContributionsByRepository: [
          {
            repository: { ...repo, isPrivate: !!options.private },
            contributions: page([
              { occurredAt, commitCount: 1000, isRestricted: false },
            ]),
          },
        ],
      });
    }
    const field = query.includes("pullRequestReviewContributions")
      ? "pullRequestReviewContributions"
      : query.includes("issueContributions")
        ? "issueContributions"
        : "pullRequestContributions";
    if (options.missingPage && variables.after)
      return new Response("outage", { status: 500 });
    return gql({
      [field]: variables.after
        ? page([event("second"), event("first")])
        : page(
            [event("first"), event("hidden", "2026-11-02", true)],
            "next-page",
          ),
    });
  });
}
describe("public contribution adapter", () => {
  it("paginates, filters private data, deduplicates and uses real commit counts", async () => {
    const fetcher = scripted();
    const s = await fetchPublicSnapshot(" @TESTER ", {
      token: "secret-canary",
      now: NOW,
      fetcher,
    });
    expect(s.metrics.prs).toEqual({ status: "complete", value: 2 });
    expect(s.rawCommits.value).toBe(5000);
    expect(s.metrics.commits.value).toBe(50);
    expect(s.metrics.reviews.value).toBe(2);
    expect(s.metrics.issuesOpened.value).toBe(2);
    expect(JSON.stringify(s)).not.toContain("secret-canary");
    expect(JSON.stringify(s)).not.toContain("hidden");
    expect(
      fetcher.mock.calls.filter((c) => String(c[0]).includes("graphql")).length,
    ).toBe(11);
  });
  it("never converts failed windows or missing pages into complete zero activity", async () => {
    const broken = await fetchPublicSnapshot("tester", {
      token: "t",
      now: NOW,
      fetcher: scripted({ broken: true }),
    });
    expect(broken.metrics.commits.status).toBe("partial");
    expect(broken.metrics.activeDays.status).toBe("partial");
    const missing = await fetchPublicSnapshot("tester", {
      token: "t",
      now: NOW,
      fetcher: scripted({ missingPage: true }),
    });
    expect(missing.metrics.prs.status).toBe("partial");
  });
  it("respects the overall request budget and detects cursor loops", async () => {
    const s = await fetchPublicSnapshot("tester", {
      token: "t",
      now: NOW,
      fetcher: scripted(),
      limits: { attempts: 2, points: 200, milliseconds: 60000 },
    });
    expect(s.metrics.prs.status).toBe("partial");
    expect(s.metrics.activeDays.status).toBe("partial");
  });
  it("caps commits across repositories per UTC day and ignores duplicate review records", () => {
    const s = aggregate(
      [
        { repositoryId: "a", day: "2026-01-01", count: 1000 },
        { repositoryId: "a", day: "2026-01-01", count: 1000 },
        { repositoryId: "b", day: "2026-01-01", count: 15 },
      ],
      [],
      [event("pr"), event("pr"), event("hidden", "2026-11-02", true)],
      [],
      "user",
    );
    expect(s.rawCommits).toBe(1015);
    expect(s.commits).toBe(10);
    expect(s.reviews).toBe(1);
    expect(s.activeDays).toBe(2);
  });
});
describe("transport and validation", () => {
  it("normalizes usernames without accepting URLs", () => {
    expect(normalizeLogin("@Ada")).toBe("ada");
    expect(() => normalizeLogin("https://github.com/a")).toThrow();
  });
  it("has a safe tokenless error", async () => {
    await expect(
      fetchPublicSnapshot("ada", { token: "" }),
    ).rejects.toMatchObject({ code: "config" });
  });
  it.each([
    [401, "config"],
    [404, "notfound"],
    [403, "forbidden"],
    [429, "ratelimit"],
  ] as const)("classifies HTTP %i", async (status, code) => {
    const f = vi.fn(async () => new Response("", { status }));
    const c = new GithubClient("canary", f);
    await expect(c.profile("ada")).rejects.toMatchObject({ code });
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("does not retry a primary rate limit and returns reset timing", async () => {
    const f = vi.fn(
      async () =>
        new Response("", {
          status: 403,
          headers: { "x-ratelimit-remaining": "0", "retry-after": "120" },
        }),
    );
    await expect(
      new GithubClient("token", f).profile("ada"),
    ).rejects.toMatchObject({ code: "ratelimit", retryAfter: 120 });
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("retries a transient failure once, never forwards upstream error details", async () => {
    const f = vi.fn(async () => new Response("secret-canary", { status: 500 }));
    await expect(
      new GithubClient("secret-canary", f).profile("ada"),
    ).rejects.toMatchObject({
      message: "GitHub returned an unexpected response.",
    });
    expect(f).toHaveBeenCalledTimes(2);
  });
  it("rejects partial GraphQL success rather than silently trusting it", async () => {
    const c = new GithubClient("t", async () =>
      Response.json({
        data: { user: {}, rateLimit: { cost: 1 } },
        errors: [{ type: "FORBIDDEN" }],
      }),
    );
    await expect(c.query("q", {})).rejects.toMatchObject({ code: "upstream" });
  });
});
