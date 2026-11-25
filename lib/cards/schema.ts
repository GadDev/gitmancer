import { z } from "zod";

export const ABILITY_IDS = [
  "aegis",
  "relay",
  "forge",
  "survey",
  "spark",
] as const;
export const FACTIONS = [
  "Bastion",
  "Confluence",
  "Kiln",
  "Lantern",
  "Horizon",
] as const;
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const EvidenceSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("complete"), value: count }).strict(),
  z
    .object({
      status: z.enum(["partial", "unavailable"]),
      value: count.nullable(),
      reason: z.string().max(300),
    })
    .strict(),
]);
export const SnapshotSchema = z
  .object({
    identity: z
      .object({
        githubUserId: z.string().min(1).max(100),
        login: z.string().min(1).max(60),
        displayName: z.string().min(1).max(60),
        accountType: z.enum(["User", "Bot"]),
        createdAt: z.iso.datetime(),
      })
      .strict(),
    window: z.object({ from: z.iso.datetime(), to: z.iso.datetime() }).strict(),
    fetchedAt: z.iso.datetime(),
    visibility: z.literal("public"),
    source: z.enum(["github", "fictional"]),
    rawCommits: EvidenceSchema,
    metrics: z
      .object({
        commits: EvidenceSchema,
        prs: EvidenceSchema,
        reviews: EvidenceSchema,
        issuesOpened: EvidenceSchema,
        activeDays: EvidenceSchema,
      })
      .strict(),
    warnings: z.array(z.string().max(300)).max(30),
  })
  .strict();
export const DerivedSchema = z
  .object({
    scores: z
      .object({
        C: count.max(100),
        P: count.max(100),
        R: count.max(100),
        I: count.max(100),
        D: count.max(100),
      })
      .strict(),
    archetype: z.enum([
      "Guardian",
      "Weaver",
      "Artificer",
      "Pathfinder",
      "Wayfarer",
    ]),
    faction: z.enum(FACTIONS),
    power: count.min(1).max(5),
    toughness: count.min(1).max(5),
    resourceCost: count.min(2).max(7),
    abilities: z
      .array(z.enum(ABILITY_IDS))
      .min(1)
      .max(2)
      .refine((a) => new Set(a).size === a.length),
    rarity: z.enum(["Common", "Uncommon", "Rare", "Astral"]),
  })
  .strict();
export const CardSchema = z
  .object({
    schemaVersion: z.literal("card-1"),
    cardId: z.string().regex(/^[a-f0-9]{64}$/),
    rules: z
      .object({
        scoring: z.literal("guild-1"),
        catalog: z.literal("abilities-1"),
        collection: z.literal("community-v1"),
      })
      .strict(),
    evidence: SnapshotSchema,
    derived: DerivedSchema.nullable(),
    creative: z
      .object({
        source: z.literal("template"),
        name: z.string().min(1).max(80),
        flavorText: z.string().max(180),
        templateVersion: z.literal("guild-art-1"),
      })
      .strict(),
    renderVersion: z.literal("frame-1"),
  })
  .strict();
export type Evidence = z.infer<typeof EvidenceSchema>;
export type Snapshot = z.infer<typeof SnapshotSchema>;
export type Derived = z.infer<typeof DerivedSchema>;
export type Card = z.infer<typeof CardSchema>;
export type Faction = (typeof FACTIONS)[number];
export type AbilityId = (typeof ABILITY_IDS)[number];
export const complete = (value: number): Evidence => ({
  status: "complete",
  value,
});
