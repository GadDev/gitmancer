# Gitmancer

**Your contributions. Your character.**

Generate an original fantasy trading card from a public GitHub username. A deterministic engine assigns the guild, attributes and abilities; original geometric artwork finishes the card. No AI service or paid model is called.

## Run locally

Requires **Node.js 22.13+** (Node 24 LTS recommended), npm and a writable persistent directory.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Visit `http://localhost:3000`. The three explicitly fictional examples work without credentials. For live profiles, set `GITHUB_TOKEN` in `.env.local` to a GitHub token able to query public GraphQL data. A classic PAT without scopes can read public data; the adapter explicitly filters private repositories even if the credential can access them. Never use a `NEXT_PUBLIC_` token. Rotate an exposed credential.

Set `APP_ORIGIN` to the exact site origin. `GITMANCER_DATA_DIR` defaults to `./data`; this directory contains SQLite snapshots and must survive restarts. A missing/expired token gives a friendly error rather than a made-up card. Existing saved cards continue to work.

## What works

- Single-username generation; original guild artwork with no external image requests.
- Explicit trailing 365-day UTC contribution window, public-only records, pagination and bounded fetch work.
- Deterministic class, abilities, stats, Charge cost and cosmetic rarity; the three blueprint fixtures reproduce exactly.
- Immutable, content-addressed JSON snapshots; complete snapshots cached for two hours; incomplete refreshes cannot replace the latest complete card.
- 1000×1400 PNG downloads, 1200×630 social previews, copy link and native URL sharing when supported.
- Mobile layouts, keyboard controls, reduced motion, loading/error announcements and HTML equivalents for the card's text.
- Persisted request quotas; at most two concurrent acquisitions per process. No AI spend on generation or views.

## Routes

| Route | Behavior |
|---|---|
| `/` | Username form and fictional samples |
| `POST /api/cards` | JSON `{ "username": "GadDev" }`; returns saved card URL and stale flag |
| `/cards/<cardId>` | Immutable card page |
| `/cards/<cardId>/image` | Canonical PNG; `?download=1` downloads, `?social=1` renders the social preview |
| `/cards/<cardId>.png` | Rewrite to canonical image |
| `/api/cards/<cardId>` | Saved public card JSON |
| `/u/<username>` | Latest complete card and explicit refresh form; GET does not fetch GitHub |

## Data definitions and limits

“Complete” means the requested GitHub contribution-record connections were fully fetched, **not** that all software work is visible. GitHub excludes some activity from its contribution model; private work and non-GitHub work do not enter mechanics.

- Commit contribution-day nodes supply `commitCount`. Counts are summed across repositories per UTC date, capped at ten per day, and normalized with a 255 cap. Raw counts are shown separately. Fork ownership and inherited stars do not grant power; attributed public fork/upstream work can count.
- PRs and opened issues deduplicate by stable ID. Review contributions deduplicate by PR/reviewer/UTC day. **GitHub's review contribution connection returns the most recent review for each PR in the queried window**, not every review ever submitted. “Public record days” counts dates of the returned public records, not a complete work calendar. These semantics are shown on card pages.
- Commit records use chunks of at most 90 days so per-repository daily connections fit the 100-node page. Repository-list truncation or any remaining page marks coverage partial. Resource-limit windows split twice at UTC midnight; exhausted budgets remain partial.
- Each generation has at most 50 HTTP attempts, 200 observed GraphQL points and 60 seconds acquisition time; per-attempt timeout is eight seconds, with one transient retry. Point cost is known after a response: the budget prevents subsequent queries, not an absolute pre-billed cap on a single query. Rate limits are surfaced with Retry-After, not immediately retried. Fetching is sequential (within the two-request design ceiling).
- Missing core data produces a provisional card with mechanics withheld, or a labelled last-complete snapshot. Confirmed bots receive a clockwork identity without human mechanics; organizations are rejected.
- Star/follower counts, account age and language diversity do not affect power. Rarity hashes stable account ID plus collection salt and is only a finish, not a developer rank or guaranteed scarcity.

Card rules are in `lib/cards/build.ts`, the ability/guild catalog in `lib/cards/catalog.ts`. Normalization: `round(100*log2(1+min(count,cap))/log2(1+cap))`; caps C/P/R/I/D = 255/63/63/31/127. Power = `1+floor((3C+P)/100)`; toughness = `1+floor((2R+I+D)/100)`; Charge = `ceil((power+toughness+abilityPoints)/2)`.

Collectible character sheets are the current product. Ability text is a game-design prototype; no combat, decks, economy or competitive balance is claimed. AI enrichment, community gallery and batch generation are later work. Latin/Latin-1 names are supported in PNG titles; other scripts use the login in the PNG while preserving the full display name in HTML/JSON. No inference of a developer's identity or abilities is made from an avatar.

## Production / Docker

```sh
docker compose up --build -d
```

Put `GITHUB_TOKEN` and the public `APP_ORIGIN` in `.env` for Compose, or set them in your runtime's secret/environment settings. Docker mounts the named `gitmancer-data` volume at `/app/data`. Use TLS on your reverse proxy. This single-host SQLite architecture requires persistent disk: **do not deploy unchanged to ephemeral serverless storage**.

Start with one instance. Acquisitions are coalesced within a process; horizontal scaling requires shared acquisition locks. Quotas are durable in SQLite: five new acquisitions/minute per client bucket and twenty globally. Without `TRUST_PROXY=1`, callers share one bucket. Enable it only when a trusted proxy overwrites `X-Forwarded-For`, otherwise client IP headers can be spoofed. No token/IP is saved in card JSON; quota keys hash client identifiers and expire.

Back up with `sqlite3 data/gitmancer.sqlite '.backup data/backup.sqlite'` using SQLite's online backup, or stop the application before copying the database and WAL files. Restore into the persistent data directory with the application stopped. Save backups outside the live volume. Snapshots are retained until an operator deletes the data directory; automated retention/removal is not implemented yet. Never remove live database/WAL files from a running process. The app does not provision hosting, purchase a domain or enable paid APIs.

## Checks

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit tests cover formula fixtures/invariants, caps, privacy, pagination, partial data, transport classification, snapshot integrity, restart durability, quotas, request bounds and safe error responses. Browser tests cover the fictional card path, immutable JSON, PNG headers/dimensions, downloads, social image, invalid-input feedback and a 320px layout. Live GitHub integration requires your server credential and is not replaced by mocked tests.

## Provenance

GitFut's read-only investigation inspired the architecture; links and the pinned revision are in [blueprint.md](blueprint.md). This MVP's application code and geometric illustrations were written for Gitmancer; no upstream code/assets/fonts were copied. Fontsource distributes Cormorant Garamond and DM Sans under the SIL Open Font License; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Framework/dependency notices remain with installed packages.

Planning: [constitution](constitution.md) · [roadmap](roadmap.md) · [techstack](techstack.md).
