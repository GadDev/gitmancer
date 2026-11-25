import { describe, it, expect } from "vitest";
import {
  buildCard,
  normalize,
  validateCard,
  canonical,
  rarityFor,
} from "@/lib/cards/build";
import { SAMPLE_CARDS, sampleSnapshot } from "@/lib/cards/samples";
import { complete } from "@/lib/cards/schema";
import { ABILITIES } from "@/lib/cards/catalog";

describe("versioned card rules", () => {
  it.each([
    [0, [25, 17, 0, 0, 29], 1, 1, 2, ["spark"], "Common"],
    [1, [75, 83, 100, 80, 100], 4, 4, 6, ["aegis", "relay"], "Uncommon"],
    [2, [100, 50, 0, 20, 86], 4, 2, 4, ["forge", "relay"], "Uncommon"],
  ] as const)(
    "reproduces the independent fixture %i",
    (index, scores, p, t, cost, abilities, rarity) => {
      const card = SAMPLE_CARDS[index];
      expect(Object.values(card.derived!.scores)).toEqual(scores);
      expect(card.derived).toMatchObject({
        power: p,
        toughness: t,
        resourceCost: cost,
        abilities: [...abilities],
        rarity,
      });
      expect(validateCard(card)).toEqual(card);
    },
  );
  it("distinguishes a complete zero profile from a missing metric", () => {
    const s = sampleSnapshot(0);
    for (const key of Object.keys(s.metrics) as (keyof typeof s.metrics)[])
      s.metrics[key] = complete(0);
    expect(buildCard(s).derived).toMatchObject({
      power: 1,
      toughness: 1,
      resourceCost: 2,
      abilities: ["spark"],
    });
    s.metrics.reviews = {
      status: "unavailable",
      value: null,
      reason: "Missing page",
    };
    expect(buildCard(s).derived).toBeNull();
  });
  it("withholds human mechanics for a verified bot", () => {
    const s = sampleSnapshot(1);
    s.identity.accountType = "Bot";
    expect(buildCard(s).derived).toBeNull();
  });
  it("preserves tie order, deterministic hashes and rejects tampering", () => {
    const s = sampleSnapshot(1);
    for (const key of [
      "commits",
      "prs",
      "reviews",
      "issuesOpened",
      "activeDays",
    ] as const)
      s.metrics[key] = complete(10000);
    const card = buildCard(s);
    expect(card.derived!.abilities).toEqual(["aegis", "relay"]);
    expect(card.derived!.faction).toBe("Bastion");
    expect(() =>
      validateCard({ ...card, derived: { ...card.derived!, power: 1 } }),
    ).toThrow();
    expect(canonical({ b: 1, a: { z: 2, y: 3 } })).toBe(
      canonical({ a: { y: 3, z: 2 }, b: 1 }),
    );
    const name = s.identity.login;
    s.identity.login = name + "-renamed";
    expect(rarityFor(s.identity.githubUserId)).toBe(card.derived!.rarity);
  });
  it("keeps attributes and resource cost bounded across the score space", () => {
    for (let c = 0; c <= 300; c += 25)
      for (let r = 0; r <= 80; r += 10) {
        const s = sampleSnapshot(1);
        s.metrics.commits = complete(c);
        s.metrics.reviews = complete(r);
        const d = buildCard(s).derived!;
        expect(d.power).toBeGreaterThanOrEqual(1);
        expect(d.power).toBeLessThanOrEqual(5);
        expect(d.toughness).toBeLessThanOrEqual(5);
        expect(d.resourceCost).toBeLessThanOrEqual(7);
        expect(d.resourceCost).toBe(
          Math.ceil(
            (d.power +
              d.toughness +
              d.abilities.reduce((a, id) => a + ABILITIES[id].points, 0)) /
              2,
          ),
        );
      }
  });
  it("validates counts and saturates only after the cap", () => {
    expect(normalize(0, 255)).toBe(0);
    expect(normalize(255, 255)).toBe(100);
    expect(normalize(99999, 255)).toBe(100);
    for (const n of [-1, NaN, Infinity, 1.5])
      expect(() => normalize(n, 255)).toThrow();
  });
});
