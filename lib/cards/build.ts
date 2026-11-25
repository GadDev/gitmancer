import { createHash } from "node:crypto";
import { ABILITIES, GUILDS } from "./catalog";
import {
  CardSchema,
  SnapshotSchema,
  type AbilityId,
  type Card,
  type Derived,
  type Snapshot,
} from "./schema";

// Recursive key ordering makes snapshots stable across insertion order and process restarts.
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value !== null && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => JSON.stringify(k) + ":" + canonical(v))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
export const digest = (v: unknown) =>
  createHash("sha256").update(canonical(v)).digest("hex");
export function normalize(value: number, cap: number): number {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    !Number.isSafeInteger(cap) ||
    cap < 1
  )
    throw new Error("Invalid scoring count");
  return Math.round(
    (100 * Math.log2(1 + Math.min(value, cap))) / Math.log2(1 + cap),
  );
}
export function rarityFor(id: string): Derived["rarity"] {
  const bucket = Number(
    createHash("sha256")
      .update("community-v1:" + id)
      .digest()
      .readBigUInt64BE() % 100n,
  );
  return bucket < 60
    ? "Common"
    : bucket < 85
      ? "Uncommon"
      : bucket < 97
        ? "Rare"
        : "Astral";
}
export function derive(snapshot: Snapshot): Derived | null {
  if (
    snapshot.identity.accountType === "Bot" ||
    Object.values(snapshot.metrics).some((m) => m.status !== "complete")
  )
    return null;
  const get = (key: keyof Snapshot["metrics"]) => snapshot.metrics[key].value!;
  const scores = {
    C: normalize(get("commits"), 255),
    P: normalize(get("prs"), 63),
    R: normalize(get("reviews"), 63),
    I: normalize(get("issuesOpened"), 31),
    D: normalize(get("activeDays"), 127),
  };
  const ranked = [
    {
      axis: "R",
      score: scores.R,
      ability: "aegis",
      archetype: "Guardian",
      faction: "Bastion",
    },
    {
      axis: "P",
      score: scores.P,
      ability: "relay",
      archetype: "Weaver",
      faction: "Confluence",
    },
    {
      axis: "C",
      score: scores.C,
      ability: "forge",
      archetype: "Artificer",
      faction: "Kiln",
    },
    {
      axis: "I",
      score: scores.I,
      ability: "survey",
      archetype: "Pathfinder",
      faction: "Lantern",
    },
  ] as const;
  const eligible = ranked
    .map((r, index) => ({ ...r, index }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .filter((r) => r.score >= 40);
  const abilities: AbilityId[] = eligible.length
    ? eligible.slice(0, 2).map((r) => r.ability)
    : ["spark"];
  const power = 1 + Math.floor((3 * scores.C + scores.P) / 100);
  const toughness = 1 + Math.floor((2 * scores.R + scores.I + scores.D) / 100);
  return {
    scores,
    archetype: eligible[0]?.archetype ?? "Wayfarer",
    faction: eligible[0]?.faction ?? "Horizon",
    power,
    toughness,
    abilities,
    resourceCost: Math.ceil(
      (power +
        toughness +
        abilities.reduce((sum, a) => sum + ABILITIES[a].points, 0)) /
        2,
    ),
    rarity: rarityFor(snapshot.identity.githubUserId),
  };
}
export function buildCard(input: Snapshot): Card {
  const evidence = SnapshotSchema.parse(input);
  const derived = derive(evidence);
  const guild = GUILDS[derived?.faction ?? "Horizon"];
  const body = {
    schemaVersion: "card-1" as const,
    rules: {
      scoring: "guild-1" as const,
      catalog: "abilities-1" as const,
      collection: "community-v1" as const,
    },
    evidence,
    derived,
    creative: {
      source: "template" as const,
      name: `${evidence.identity.displayName}, ${derived ? guild.title : evidence.identity.accountType === "Bot" ? "Clockwork Companion" : "Unwritten Legend"}`.slice(
        0,
        80,
      ),
      flavorText: guild.flavor,
      templateVersion: "guild-art-1" as const,
    },
    renderVersion: "frame-1" as const,
  };
  return CardSchema.parse({ cardId: digest(body), ...body });
}
export function validateCard(input: unknown): Card {
  const card = CardSchema.parse(input);
  const { cardId, ...body } = card;
  if (
    digest(body) !== cardId ||
    canonical(derive(card.evidence)) !== canonical(card.derived)
  )
    throw new Error("Invalid card integrity");
  return card;
}
