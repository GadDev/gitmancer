import { describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CardStore } from "@/lib/store";
import { buildCard } from "@/lib/cards/build";
import { sampleSnapshot } from "@/lib/cards/samples";
describe("durable immutable cards", () => {
  it("survives restart, preserves old links and never replaces complete latest with partial", () => {
    const dir = mkdtempSync(join(tmpdir(), "gitmancer-test-")),
      path = join(dir, "cards.db");
    try {
      const s = sampleSnapshot(1),
        first = buildCard(s);
      let store = new CardStore(path);
      store.save(first);
      expect(
        store.cached(s.identity.login, Date.parse(s.fetchedAt) + 1000),
      ).toEqual(s);
      expect(
        store.cached(
          s.identity.login,
          Date.parse(s.fetchedAt) + 2 * 3600000 + 1,
        ),
      ).toBeNull();
      s.metrics.reviews = { status: "partial", value: 0, reason: "missing" };
      const partial = buildCard(s);
      store.save(partial);
      store.close();
      store = new CardStore(path);
      expect(store.get(first.cardId)).toEqual(first);
      expect(store.get(partial.cardId)).toEqual(partial);
      expect(store.latest(s.identity.login)?.cardId).toBe(first.cardId);
      s.metrics.reviews = { status: "complete", value: 40 };
      s.fetchedAt = "2026-11-26T00:00:00.000Z";
      const second = buildCard(s);
      store.save(second);
      expect(store.latest(s.identity.login)?.cardId).toBe(second.cardId);
      expect(store.get(first.cardId)).toEqual(first);
      store.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it("shares rate limits across store connections and resets by window", () => {
    const dir = mkdtempSync(join(tmpdir(), "gitmancer-rate-")),
      path = join(dir, "cards.db");
    const a = new CardStore(path),
      b = new CardStore(path);
    try {
      expect(a.takeQuota("ip", 2, 60000, 1)).toBe(true);
      expect(b.takeQuota("ip", 2, 60000, 2)).toBe(true);
      expect(a.takeQuota("ip", 2, 60000, 3)).toBe(false);
      expect(b.takeQuota("ip", 2, 60000, 60001)).toBe(true);
    } finally {
      a.close();
      b.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
