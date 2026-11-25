import "server-only";
import { createHash } from "node:crypto";
import { buildCard } from "./cards/build";
import type { Card } from "./cards/schema";
import { GithubError, normalizeLogin } from "./github/client";
import { fetchPublicSnapshot } from "./github/publicSnapshot";
import { getStore } from "./store";

const inflight = new Map<string, Promise<{ card: Card; stale: boolean }>>();
export async function summon(username: string, clientId = "shared") {
  const login = normalizeLogin(username);
  const store = getStore();
  const cached = store.cached(login);
  if (cached) {
    const card = buildCard(cached);
    store.save(card, login);
    return { card, stale: false };
  }
  const existing = inflight.get(login);
  if (existing) return existing;
  const latest = store.latest(login);
  if (inflight.size >= 2) {
    if (latest) return { card: latest, stale: true };
    throw new GithubError(
      "ratelimit",
      "The forge is busy. Please try again shortly.",
      30,
    );
  }
  const key = createHash("sha256").update(clientId).digest("hex");
  if (
    !store.takeQuota(`client:${key}`, 5, 60_000) ||
    !store.takeQuota("global", 20, 60_000)
  ) {
    if (latest) return { card: latest, stale: true };
    throw new GithubError(
      "ratelimit",
      "The forge needs a short rest. Please try again in a minute.",
      60,
    );
  }
  const pending = (async () => {
    try {
      const card = buildCard(await fetchPublicSnapshot(login));
      store.save(card, login);
      return !card.derived && latest
        ? { card: latest, stale: true }
        : { card, stale: false };
    } catch (error) {
      if (
        latest &&
        error instanceof GithubError &&
        !["notfound", "invalid"].includes(error.code)
      )
        return { card: latest, stale: true };
      throw error;
    }
  })().finally(() => inflight.delete(login));
  inflight.set(login, pending);
  return pending;
}
