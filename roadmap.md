# Gitmancer — Roadmap

> Implementation update — 25 November 2026: the user authorized the template-first MVP and direct pushes to `main`. Next.js/React/TypeScript, Zod, Node SQLite, immutable snapshots and server PNG export are now implemented. Optional paid AI, deployment, gallery and batch generation remain future work. The original proposal/status labels below preserve the planning baseline; see README.md for the current implementation and limitations.

Project: **Gitmancer**. Destination repository: [GadDev/gitmancer](https://github.com/GadDev/gitmancer). These choices were confirmed by the user after the original planning draft.

Status: template-first phases 1–3 implemented; optional AI, community extensions and deployment remain future work. 25 November 2026.

## Source and status

The user requires a single-username MVP, with gallery/batch extensions later, and a read-only investigation now. The phase assignments and implementation dependencies below are recommendations `[ASSUMPTION — confirm: A7]`. Other A# IDs match `constitution.md`, `techstack.md`, and the detailed `blueprint.md`. The later implementation authorization is recorded above.

## Phase 0 — Evidence and decisions

[STATED] Deliver a pinned GitFut review, alternatives comparison, card mapping, examples, architecture, and build plan. **Completed in this planning task.** Source reviewed: `master` at `e1a3d80e207db727a2f664c82117ab5d2b771d59`; no repository edits or live API integration tests.

[ASSUMPTION — confirm: A7] Before implementation, record which proposals are adopted. Resolve hosting and persistence before deployment; an AI-provider choice need not block the deterministic path.

## Phase 1 — Trustworthy public snapshots

[ASSUMPTION — confirm: A7, A3, A9, A10] Establish reliable inputs before writing game mechanics.

- Adapt `lib/github/client.ts`; add `lib/github/publicSnapshot.ts`, `lib/github/pagination.ts`, and `lib/github/types.ts`.
- Collect an explicit 365-day UTC window, filter public records, paginate connections, sum actual `commitCount` values, deduplicate review/PR/issue records, and preserve completeness.
- Apply bounded concurrency and request/query limits. Reject missing configuration cleanly and respect rate-limit recovery times.
- Gate: a two-page fixture, restricted/private records, duplicate events, missing pages, and resource-limit failures yield the documented counts/statuses. No secret appears in public payloads.

## Phase 2 — Deterministic character engine

[ASSUMPTION — confirm: A7, A3, A4, A5, A9] Work from fixed fixtures so mechanics do not depend on API availability.

- Replace the football scoring layer with proposed `lib/cards/normalize.ts`, `rules.ts`, `catalog.ts`, `identity.ts`, `schema.ts`, and `build.ts`.
- Implement the blueprint formulas, tie-breaks, daily caps, rarity seed, incomplete-data branch, and scoring version.
- Gate: all three fictional examples reproduce exactly; cap saturation and cost invariants hold. Stars, followers, and an AI response cannot change mechanics.

## Phase 3 — Single-user card, export, and sharing

[ASSUMPTION — confirm: A7, A2, A6, A8] A complete deterministic experience provides a usable fallback for AI enrichment.

- Adapt `components/ScoutForm.tsx`, `components/CardActions.tsx`, `lib/share.ts`, `lib/scout.ts`, and `hooks/useScout.ts`.
- Replace football visuals with `components/FantasyCard.tsx`, `CardEvidence.tsx`, `CardFrame.tsx`, and `lib/render/cardTree.tsx` using original assets and licensed fonts.
- Add immutable `/cards/[cardId]`, `/cards/[cardId].png`, and a username-to-latest route. Persist snapshots before returning share links.
- Gate: valid username → card → explanation → downloadable PNG → same immutable shared card, including mobile/keyboard access and long-name rendering.

## Phase 4 — Optional AI presentation

[ASSUMPTION — confirm: A7, A1, A10] Add creative variety only after reproducible mechanics and export work.

- Add proposed `lib/creative/provider.ts`, `templates.ts`, `validate.ts`, and a bounded enrichment job.
- Accept only name/flavor/art-direction fields. Use a server-owned image provider adapter; retain the original template card on failure.
- Save generated outputs and provenance; generate a new immutable card variant. Never regenerate artwork on each view.
- Gate: invalid JSON, forbidden fields, unavailable provider, timeout, and exhausted budget all retain the same mechanics and usable template card.

## Phase 5 — Pilot and deployment

[ASSUMPTION — confirm: A7, A2, A10] Validate operational behavior with a small community pilot before expanding traffic.

- Choose and provision the proposed stack only after selections are recorded. Confirm font/image provenance and retain upstream notices for copied code.
- Measure cold/cached latency, GraphQL point cost, export failures, generated-asset spend, and data coverage. Set operating limits from measurements; no performance claims are established yet.
- Gate: restore a snapshot from backup, recover from GitHub failure with a clear status, and demonstrate no view-triggered AI spend.

## Later extensions

[STATED] Community gallery and batch generation follow the single-username MVP. Their relative order remains [OPEN].

[ASSUMPTION — confirm: A7] Before gallery publication, define roster sourcing and member publication/removal preferences. Before batch generation, define job pacing, per-run limits, progress, retries, and budget. Neither extension implies a leaderboard or competitive ranking.

## Open decisions

- [OPEN] Community and delivery schedule. Project name Gitmancer and repository GadDev/gitmancer are confirmed.
- [OPEN] Adoption of the proposed phases, caps, mechanics, and acceptance gates.
- [OPEN] Hosting/storage, retention/deletion policy, AI provider/model/budget and authorized enrichment users.
- [OPEN] Collectibles or playable game; gallery versus batch ordering and membership/publication rules.

## Assumptions to confirm

- A7: phase ordering, prerequisites, module assignments, pilot, and gates.
- A1: optional AI presentation after a working template path.
- A2: adapted Next.js/TypeScript stack, storage and rendering choices.
- A3: public-only 365-day extraction and normalization.
- A4: contribution identity and cosmetic rarity.
- A5: catalog mechanics and provisional resource-cost budget.
- A6: immutable snapshots and refresh/cache behavior.
- A8: proposed original art direction.
- A9: provisional cards when inputs are incomplete.
- A10: operational limits, no view-triggered AI spend, and cost measurements.