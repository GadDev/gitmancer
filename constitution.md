# Gitmancer — Constitution

Project: **Gitmancer**. Destination repository: [GadDev/gitmancer](https://github.com/GadDev/gitmancer). These choices were confirmed by the user after the original planning draft.

Status: planning draft, 25 November 2026. No implementation is authorized by this document.

## Source and status

The user's brief is the requirements source. The read-only GitFut investigation is pinned to `master`, commit `e1a3d80e207db727a2f664c82117ab5d2b771d59`. Detailed evidence, formulas, examples, and acceptance criteria are in `blueprint.md`.

`[STATED]` means explicitly requested. `[OPEN]` means not selected. `[ASSUMPTION — confirm: A#]` means a concrete proposal, not an approved requirement. These meanings apply across all four documents.

## Required principles

1. [STATED] Generate a distinctive fantasy trading card from a developer community member's GitHub activity. Use original names, artwork, card frames, and visual identity, with Magic: The Gathering as inspiration.
2. [STATED] Start with one public GitHub username. A community gallery and batch generation are later extensions.
3. [STATED] Keep numerical scoring and game balance reproducible. Separate measured facts, derived attributes, and creative content.
4. [STATED] Explain mappings with explicit formulas, thresholds, caps, and worked examples; these are playful design choices, not judgments of engineering ability.
5. [STATED] Handle sparse profiles, new accounts, unavailable private activity, bots, forks, and unusual activity. Avoid rewarding commit spam or equating visibility with ability.
6. [STATED] Design secure server-side token handling, refresh/caching, scoring versions, PNG download, shareable URLs, and mobile accessibility.
7. [STATED] Investigate GitFut read-only. Do not modify its repository or start implementing the proposed product during this task.
8. [STATED] Ground repository claims in source references, distinguish assumptions from facts, and check license/attribution before recommending reuse.

## Proposed operating rules

- [ASSUMPTION — confirm: A1] Use deterministic card mechanics with optional AI presentation. The model cannot supply or override power, toughness, resource cost, rarity, faction, or ability IDs. Templates produce a complete card when AI is disabled or fails.
- [ASSUMPTION — confirm: A3] Use an explicit 365-day UTC window and public contribution records; ignore private/restricted totals for mechanics. Use the exact normalization, daily caps, deduplication, and tie rules in the blueprint, versioned together.
- [ASSUMPTION — confirm: A4] Derive archetypes from contribution patterns, not inferred personal traits. Rarity is a stable cosmetic treatment independent of activity, popularity, payment, and mechanical strength.
- [ASSUMPTION — confirm: A5] Use a bounded ability catalog and a provisional cost budget. Treat cards as collectible character sheets; a playable game and demonstrated competitive balance remain open choices.
- [ASSUMPTION — confirm: A6] Store immutable card snapshots. A refresh creates a new version; old shared links do not silently change. Use a 2-hour acquisition cache, with a visible data timestamp and a last-known-card fallback.
- [ASSUMPTION — confirm: A8] Use an original illustrated guild identity: ink, parchment, muted jewel colors, serif character names, geometric faction emblems. Never ask an image model to draw the card's text.
- [ASSUMPTION — confirm: A9] Incomplete scoring inputs produce an explicitly provisional identity card with mechanics withheld, or the last complete snapshot. Unknown activity is never silently converted to zero.
- [ASSUMPTION — confirm: A10] Bound query work and generation spend. A public page view or embed cannot trigger a paid AI generation. A token cannot be sent to the browser, logs, card JSON, or image output.

## Open decisions

- [OPEN] Intended community and deployment destination. Project name Gitmancer and repository GadDev/gitmancer are confirmed.
- [OPEN] Collectibles only or a future playable game; battle/deck rules and playtesting standard.
- [OPEN] AI text/image provider, model, budget, and who can request AI enrichment.
- [OPEN] Hosting, storage service, snapshot retention/deletion policy, and member publication preferences before the gallery extension.
- [OPEN] Whether optional private-count display should ever be supported. It is not needed for the proposed public MVP.

## Assumptions to confirm

- A1: deterministic mechanics plus optional AI presentation and complete template fallback.
- A3: explicit public-only 365-day window and proposed caps/deduplication.
- A4: contribution-based identity and cosmetic deterministic rarity.
- A5: catalog mechanics/cost formula; collectible sheets until game scope is chosen.
- A6: immutable snapshots, 2-hour cache, versioned refresh, last-known fallback.
- A8: original guild art direction and rendered text.
- A9: incomplete-data behavior with mechanics withheld.
- A10: bounded fetching/spend and no paid AI from views/embeds.