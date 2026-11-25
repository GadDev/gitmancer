import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { SnapshotSchema, type Card, type Snapshot } from "./cards/schema";
import { validateCard } from "./cards/build";

export class CardStore {
  private db: DatabaseSync;
  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS cards (id TEXT PRIMARY KEY, body TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS latest (login TEXT PRIMARY KEY, user_id TEXT NOT NULL, card_id TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS evidence (login TEXT PRIMARY KEY, body TEXT NOT NULL, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS quotas (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);`);
  }
  close() {
    this.db.close();
  }
  get(id: string): Card | null {
    if (!/^[a-f0-9]{64}$/.test(id)) return null;
    const row = this.db.prepare("SELECT body FROM cards WHERE id=?").get(id) as
      { body: string } | undefined;
    return row ? validateCard(JSON.parse(row.body)) : null;
  }
  latest(login: string): Card | null {
    const row = this.db
      .prepare("SELECT card_id FROM latest WHERE login=?")
      .get(login.toLowerCase()) as { card_id: string } | undefined;
    return row ? this.get(row.card_id) : null;
  }
  cached(login: string, now = Date.now()): Snapshot | null {
    const row = this.db
      .prepare("SELECT body FROM evidence WHERE login=? AND expires>?")
      .get(login.toLowerCase(), now) as { body: string } | undefined;
    if (!row) return null;
    try {
      return SnapshotSchema.parse(JSON.parse(row.body));
    } catch {
      return null;
    }
  }
  save(card: Card, requestedLogin = card.evidence.identity.login) {
    validateCard(card);
    const login = card.evidence.identity.login.toLowerCase();
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db
        .prepare("INSERT OR IGNORE INTO cards(id,body) VALUES(?,?)")
        .run(card.cardId, JSON.stringify(card));
      if (card.derived) {
        const upsert = this.db.prepare(
          "INSERT INTO latest(login,user_id,card_id) VALUES(?,?,?) ON CONFLICT(login) DO UPDATE SET user_id=excluded.user_id,card_id=excluded.card_id",
        );
        for (const alias of new Set([login, requestedLogin.toLowerCase()]))
          upsert.run(alias, card.evidence.identity.githubUserId, card.cardId);
        this.db
          .prepare(
            "INSERT INTO evidence(login,body,expires) VALUES(?,?,?) ON CONFLICT(login) DO UPDATE SET body=excluded.body,expires=excluded.expires",
          )
          .run(
            requestedLogin.toLowerCase(),
            JSON.stringify(card.evidence),
            Date.parse(card.evidence.fetchedAt) + 2 * 60 * 60 * 1000,
          );
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  takeQuota(
    key: string,
    limit: number,
    windowMs: number,
    now = Date.now(),
  ): boolean {
    const bucket = `${key}:${Math.floor(now / windowMs)}`;
    this.db.prepare("DELETE FROM quotas WHERE expires<?").run(now);
    const row = this.db
      .prepare(
        "INSERT INTO quotas(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<? RETURNING count",
      )
      .get(bucket, now + windowMs, limit);
    return !!row;
  }
}
let store: CardStore | undefined;
export function getStore() {
  if (!store) {
    const dir = resolve(
      /* turbopackIgnore: true */ process.env.GITMANCER_DATA_DIR || "./data",
    );
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    store = new CardStore(join(dir, "gitmancer.sqlite"));
  }
  return store;
}
