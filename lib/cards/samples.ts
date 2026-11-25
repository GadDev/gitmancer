import { buildCard } from "./build";
import { complete, type Snapshot } from "./schema";
export function sampleSnapshot(index: number): Snapshot {
  const rows = [
    ["Mira", "FICTIONAL_001", 3, 3, 1, 0, 0, 3],
    ["Rowan", "FICTIONAL_002", 63, 63, 31, 63, 15, 127],
    ["Ivo", "FICTIONAL_003", 4095, 630, 7, 0, 1, 63],
  ] as const;
  const [name, id, raw, c, p, r, i, d] = rows[index];
  return {
    identity: {
      githubUserId: id,
      login: `fictional-${name.toLowerCase()}`,
      displayName: name,
      accountType: "User",
      createdAt: "2025-11-01T00:00:00.000Z",
    },
    window: {
      from: "2025-11-25T00:00:00.000Z",
      to: "2026-11-25T00:00:00.000Z",
    },
    fetchedAt: "2026-11-25T00:00:00.000Z",
    visibility: "public",
    source: "fictional",
    rawCommits: complete(raw),
    metrics: {
      commits: complete(c),
      prs: complete(p),
      reviews: complete(r),
      issuesOpened: complete(i),
      activeDays: complete(d),
    },
    warnings: ["Fictional sample. No GitHub profile was fetched."],
  };
}
export const SAMPLE_CARDS = [0, 1, 2].map((i) => buildCard(sampleSnapshot(i)));
