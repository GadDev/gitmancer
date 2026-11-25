import "server-only";
import { z } from "zod";

export class GithubError extends Error {
  constructor(
    public code:
      | "invalid"
      | "notfound"
      | "config"
      | "ratelimit"
      | "forbidden"
      | "upstream"
      | "resource"
      | "budget",
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
  get status() {
    return {
      invalid: 400,
      notfound: 404,
      config: 503,
      ratelimit: 429,
      forbidden: 502,
      upstream: 502,
      resource: 502,
      budget: 503,
    }[this.code];
  }
}
export function normalizeLogin(input: string): string {
  const login = input.trim().replace(/^@/, "").toLowerCase();
  if (!/^(?=.*[a-z0-9])[a-z0-9-]{1,39}$/.test(login))
    throw new GithubError(
      "invalid",
      "Enter a GitHub username using letters, numbers and hyphens (up to 39 characters).",
    );
  return login;
}
const Envelope = z.object({
  data: z.record(z.string(), z.unknown()).nullish(),
  errors: z.array(z.object({ type: z.string().optional() })).optional(),
});
export type Fetcher = typeof fetch;
export class GithubClient {
  private attempts = 0;
  private points = 0;
  private deadline: number;
  private blockedUntil = 0;
  constructor(
    private token: string,
    private fetcher: Fetcher = fetch,
    private clock: () => number = Date.now,
    private limits = { attempts: 50, points: 200, milliseconds: 60_000 },
  ) {
    if (!token.trim())
      throw new GithubError(
        "config",
        "Live cards need a GitHub token on the server. You can explore the fictional samples below.",
      );
    this.deadline = clock() + limits.milliseconds;
  }
  private async request(url: string, body?: object): Promise<unknown> {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (this.blockedUntil > this.clock())
        throw new GithubError(
          "ratelimit",
          "GitHub is cooling down. Try again later.",
          Math.ceil((this.blockedUntil - this.clock()) / 1000),
        );
      if (
        this.attempts >= this.limits.attempts ||
        this.points >= this.limits.points ||
        this.clock() >= this.deadline
      )
        throw new GithubError(
          "budget",
          "This profile needs more data than this generation can safely fetch.",
        );
      this.attempts++;
      let response: Response;
      try {
        response = await this.fetcher(url, {
          method: body ? "POST" : "GET",
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(
            Math.max(1, Math.min(8000, this.deadline - this.clock())),
          ),
        });
      } catch {
        if (attempt === 0) continue;
        throw new GithubError(
          "upstream",
          "GitHub could not be reached. Please try again.",
        );
      }
      if (response.status === 401)
        throw new GithubError(
          "config",
          "The server’s GitHub token needs attention. Please try the sample cards.",
        );
      if (response.status === 404)
        throw new GithubError(
          "notfound",
          "No GitHub account was found with that username.",
        );
      if (
        response.status === 429 ||
        (response.status === 403 &&
          (response.headers.get("x-ratelimit-remaining") === "0" ||
            response.headers.has("retry-after")))
      ) {
        const raw = response.headers.get("retry-after");
        const seconds =
          raw && /^\d+$/.test(raw)
            ? Number(raw)
            : raw
              ? Math.ceil((Date.parse(raw) - this.clock()) / 1000)
              : 0;
        const reset =
          Number(response.headers.get("x-ratelimit-reset") ?? 0) * 1000;
        const wait = Math.min(
          86400,
          Math.max(
            60,
            Number.isFinite(seconds) ? seconds : 0,
            Math.ceil((reset - this.clock()) / 1000),
          ),
        );
        this.blockedUntil = this.clock() + wait * 1000;
        throw new GithubError(
          "ratelimit",
          "GitHub’s request limit was reached. Your saved cards remain available.",
          wait,
        );
      }
      if (response.status === 403)
        throw new GithubError(
          "forbidden",
          "GitHub did not allow this request. Check the server credential permissions.",
        );
      if (response.status >= 500 && attempt === 0) continue;
      if (!response.ok)
        throw new GithubError(
          "upstream",
          "GitHub returned an unexpected response.",
        );
      try {
        return await response.json();
      } catch {
        if (attempt === 0) continue;
        throw new GithubError(
          "upstream",
          "GitHub returned an unreadable response.",
        );
      }
    }
    throw new GithubError("upstream", "GitHub could not complete the request.");
  }
  async profile(login: string) {
    const raw = await this.request(
      `https://api.github.com/users/${encodeURIComponent(login)}`,
    );
    const parsed = z
      .object({
        node_id: z.string(),
        login: z.string().max(60),
        name: z.string().nullable(),
        type: z.enum(["User", "Bot", "Organization"]),
        created_at: z.iso.datetime(),
      })
      .safeParse(raw);
    if (!parsed.success)
      throw new GithubError(
        "upstream",
        "GitHub returned an incomplete account profile.",
      );
    if (parsed.data.type === "Organization")
      throw new GithubError(
        "invalid",
        "Enter a person’s GitHub username rather than an organization.",
      );
    return {
      githubUserId: parsed.data.node_id,
      login: parsed.data.login,
      displayName: (parsed.data.name?.trim() || parsed.data.login).slice(0, 60),
      accountType: parsed.data.type as "User" | "Bot",
      createdAt: parsed.data.created_at,
    };
  }
  async query(
    query: string,
    variables: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    // Cost headroom is reserved before dispatch. Observed cost updates the per-generation budget.
    if (this.points + 1 > this.limits.points)
      throw new GithubError(
        "budget",
        "The generation’s GitHub budget was reached.",
      );
    const raw = await this.request("https://api.github.com/graphql", {
      query,
      variables,
    });
    const result = Envelope.safeParse(raw);
    if (!result.success)
      throw new GithubError(
        "upstream",
        "GitHub returned an incomplete contribution response.",
      );
    const cost = z
      .object({ cost: z.number().int().nonnegative() })
      .safeParse(result.data.data?.rateLimit);
    this.points += cost.success ? Math.max(1, cost.data.cost) : 1;
    const errors = result.data.errors;
    if (errors?.length) {
      if (errors.some((e) => /RATE_LIMIT/.test(e.type ?? ""))) {
        this.blockedUntil = this.clock() + 60_000;
        throw new GithubError(
          "ratelimit",
          "GitHub’s request limit was reached. Try again shortly.",
          60,
        );
      }
      if (errors.some((e) => e.type === "RESOURCE_LIMITS_EXCEEDED"))
        throw new GithubError(
          "resource",
          "GitHub needs a smaller contribution window.",
        );
      // A usable user node with field errors is still incomplete, never a complete zero.
      throw new GithubError(
        "upstream",
        "GitHub could not return all requested contribution fields.",
      );
    }
    if (!result.data.data)
      throw new GithubError(
        "upstream",
        "GitHub returned no contribution data.",
      );
    return result.data.data;
  }
}
