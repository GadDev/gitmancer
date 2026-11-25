# Gitmancer — Techstack

Project: **Gitmancer**. Destination repository: [GadDev/gitmancer](https://github.com/GadDev/gitmancer). These choices were confirmed by the user after the original planning draft.

Status: options and recommendations; the user has not selected a product stack. 25 November 2026.

## Evidence

GitFut declares Next.js 16.2.9, React 19.2.4, TypeScript 5, Tailwind 4, ioredis, html-to-image, sharp, Sentry and Vitest in [package.json](https://github.com/Younesfdj/gitfut/blob/e1a3d80e207db727a2f664c82117ab5d2b771d59/package.json#L13-L35). Its [Dockerfile](https://github.com/Younesfdj/gitfut/blob/e1a3d80e207db727a2f664c82117ab5d2b771d59/Dockerfile#L1-L38) runs a Node 22 standalone image. These are observed upstream choices, not user selections or an endorsement that the pinned versions should be deployed unchanged.

## Proposed choices and the requirement each serves

| Technology / mechanism | Requirement served | Status and rationale |
|---|---|---|
| Next.js App Router + React + TypeScript | Username form, server API, share page, typed boundaries | [ASSUMPTION — confirm: A2] Adapt existing upstream structure; verify supported versions/dependency health during implementation. Relative migration effort is unmeasured. |
| GitHub GraphQL, server-side | Public contribution data and exact windows | [ASSUMPTION — confirm: A2, A3] Adapt upstream query/error code but replace ambiguous signal names and incomplete-data handling. Official [contribution schema](https://docs.github.com/en/graphql/reference/users#contributionscollection) and [commit aggregation](https://docs.github.com/en/graphql/reference/commits#commitcontributionsbyrepository) checked. |
| One server-held GitHub credential | Authenticate API calls without member sign-in | [ASSUMPTION — confirm: A2, A10] Start with one least-privilege credential; public filtering is explicit even if credentials change. User OAuth/GitHub App is [OPEN] for later needs. No token pooling is required. |
| Pure TypeScript rules and versioned ability catalog | Reproducible scores, resource cost, abilities | [ASSUMPTION — confirm: A1, A3, A4, A5] No framework or model is required for arithmetic. |
| TypeScript types + runtime schema validation | Reject malformed API/model/cache data | [ASSUMPTION — confirm: A2] Zod is a proposed candidate, not an upstream dependency or selected library. A hand-written validator remains an option. No comparative performance claim is made. |
| Tailwind + original frames/illustrations + licensed fonts | Mobile card layout and original identity | [ASSUMPTION — confirm: A2, A8] Reuse styling infrastructure, replace football imagery and fonts without established provenance. |
| `next/og` ImageResponse, optional sharp preprocessing | Canonical PNG and social image | [ASSUMPTION — confirm: A2] Existing server renderer demonstrates this path. Official [ImageResponse documentation](https://nextjs.org/docs/app/api-reference/functions/image-response) confirms JSX/CSS-to-PNG with a CSS subset. Prototype text overflow and asset size before committing. |
| Vitest + Playwright | Formula/adapter validation and browser export/accessibility checks | [ASSUMPTION — confirm: A2, A7] Reuse upstream test tooling; adapt tests to new behavior rather than retaining football expectations. |
| SQLite + durable asset directory on one persistent Node host | Immutable snapshot JSON, latest pointer, generated assets | [ASSUMPTION — confirm: A2, A6] Concrete low-complexity candidate for a single-instance pilot; operational simplicity is a recommendation, not a measured comparison. Use a backed-up persistent volume, not ephemeral serverless disk. SQLite driver [OPEN]. |
| Redis | Shared cache, deduplication locks, request throttles | [ASSUMPTION — confirm: A2, A6, A10] Optional for a single-instance pilot; use SQLite/in-process cache initially if chosen. Adapt upstream Redis code only after restoring TLS certificate validation. |
| Existing Node-capable host running Docker | Deploy single-user MVP with persistent storage | [ASSUMPTION — confirm: A2] Recommended low-cost route if the user already has capacity. A rented host has recurring cost; no current price or free-tier guarantee is asserted. |
| Serverless host + external database/object storage | Alternative deployment when persistent local disk is unsuitable | [OPEN] Changes the persistence adapters. Provider, plan eligibility and price must be checked when selected. |
| AI text + image provider adapters | Optional generated name/flavor/artwork | [OPEN] Provider/model unselected. [ASSUMPTION — confirm: A1, A10] Isolate providers behind restricted schemas and spending limits; templates require no paid AI service. |
| Bounded DB-backed enrichment jobs | Keep optional art generation out of page rendering | [ASSUMPTION — confirm: A2, A10] Candidate single-host mechanism; a separate queue service is not required by the brief. |

## Boundaries

[ASSUMPTION — confirm: A2, A6] Raw GitHub responses are transient. Persist minimal normalized evidence, versioned card records and approved generated assets. Preserve input/output hashes, timestamps, rule versions and creative provenance. The default acquisition cache TTL proposal is 2 hours; snapshot retention duration is [OPEN].

[ASSUMPTION — confirm: A1, A10] Allow models to return creative text/art direction only. Never execute returned HTML, SVG, JavaScript, URLs, or prompts as application instructions. Renderer text remains application-owned. Bound provider retries, image bytes, processing duration and enrichment requests.

[STATED] No technology choices in this draft authorize implementation.

## Open decisions

- [OPEN] Adopt the suggested stack or choose another platform; no user-selected framework exists yet.
- [OPEN] Host, database driver or managed persistence provider, backup/retention/deletion policy, budget and plan eligibility.
- [OPEN] Runtime validator, AI providers/models, entitlement for enrichment, job execution mechanism, and future authentication.
- [OPEN] Final font and illustration licenses. Project name Gitmancer and destination repository GadDev/gitmancer are confirmed.

## Assumptions to confirm

- A2: reuse Next.js/TypeScript/tooling; proposed Node/Docker/SQLite/rendering/validation/job architecture.
- A1: deterministic mechanics plus optional AI creative fields.
- A3: explicit public 365-day data contract.
- A4: deterministic contribution identity and cosmetic rarity.
- A5: bounded catalog and provisional cost budget.
- A6: immutable snapshots, persistence boundaries, 2-hour acquisition cache.
- A7: proposed tests, prototype gates, and pilot ordering.
- A8: original art direction and font replacement.
- A10: least-privilege token, bounded API/AI work, no AI spend from views.