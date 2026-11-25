import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import CardActions from "@/components/CardActions";
import { findCard } from "@/lib/cardLookup";
import { ABILITIES, GUILDS } from "@/lib/cards/catalog";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ cardId: string }>;
}): Promise<Metadata> {
  const { cardId } = await params;
  const card = findCard(cardId);
  if (!card) return { title: "Card not found", robots: { index: false } };
  const origin = process.env.APP_ORIGIN || "http://localhost:3000";
  const image = new URL(`/cards/${cardId}/image?social=1`, origin).toString();
  return {
    title: card.creative.name,
    description: "Your contributions. Your character.",
    openGraph: {
      title: card.creative.name,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", images: [image] },
    robots: card.evidence.source === "fictional" ? { index: false } : undefined,
  };
}
export default async function CardPage({
  params,
  searchParams,
}: {
  params: Promise<{ cardId: string }>;
  searchParams: Promise<{ stale?: string }>;
}) {
  const { cardId } = await params;
  const card = findCard(cardId);
  if (!card) notFound();
  const { stale } = await searchParams;
  const d = card.derived,
    guild = GUILDS[d?.faction ?? "Horizon"];
  const evidence = card.evidence;
  const labels = {
    commits: "Effective commits",
    prs: "Pull request contributions",
    reviews: "Review contributions",
    issuesOpened: "Issues opened",
    activeDays: "Public record days",
  };
  return (
    <>
      <Header />
      <main id="main" className="card-page">
        <Link className="back-link" href="/">
          ‹ Back to the grimoire
        </Link>
        {stale === "1" && (
          <p className="notice" role="status">
            The latest fetch could not complete. This is your last complete
            saved card, dated {evidence.fetchedAt.slice(0, 10)}.
          </p>
        )}
        {evidence.source === "fictional" && (
          <p className="notice">
            Fictional sample · This character demonstrates the rules. No real
            GitHub profile was fetched.
          </p>
        )}
        <div className="card-detail-grid">
          <div className="detail-image">
            <img
              src={`/cards/${cardId}/image`}
              alt={`${card.creative.name}. ${d ? `${d.archetype}, ${d.power} power, ${d.toughness} toughness, ${d.resourceCost} Charge.` : "Provisional card. Mechanics pending."}`}
              width={500}
              height={700}
            />
          </div>
          <article className="detail-copy">
            <p className="eyebrow" style={{ color: guild.accent }}>
              {d?.faction ?? "A LEGEND IN THE MAKING"} /{" "}
              {d?.archetype ?? "PROVISIONAL"}
            </p>
            <h1>{card.creative.name}</h1>
            <p className="detail-flavor">“{card.creative.flavorText}”</p>
            <p className="muted">
              {evidence.source === "fictional" ? (
                "Fictional contributor"
              ) : (
                <a
                  href={`https://github.com/${evidence.identity.login}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  @{evidence.identity.login} ›
                </a>
              )}{" "}
              · {evidence.identity.displayName}
            </p>
            {d ? (
              <>
                <dl className="stat-strip">
                  <div>
                    <dt>Power</dt>
                    <dd>{d.power}</dd>
                  </div>
                  <div>
                    <dt>Toughness</dt>
                    <dd>{d.toughness}</dd>
                  </div>
                  <div>
                    <dt>Charge</dt>
                    <dd>{d.resourceCost}</dd>
                  </div>
                  <div>
                    <dt>Finish</dt>
                    <dd className="finish-value">{d.rarity}</dd>
                  </div>
                </dl>
                <div className="ability-list">
                  {d.abilities.map((id) => (
                    <div key={id}>
                      <h3>{ABILITIES[id].name}</h3>
                      <p>{ABILITIES[id].text}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="notice">
                {evidence.identity.accountType === "Bot"
                  ? "Clockwork companion: mechanics are not assigned to automaton accounts."
                  : "Partial public data — mechanics pending. Missing data is not counted as inactivity."}
              </p>
            )}
            <CardActions cardId={cardId} name={card.creative.name} />
            <p className="form-help">
              A collectible character sheet. Abilities are a prototype; a
              playable game is a future chapter. Cosmetic rarity is not a
              developer rank.
            </p>
          </article>
        </div>
        <section className="evidence-panel">
          <p className="eyebrow">NO HIDDEN SPELLS</p>
          <h2>Why this card?</h2>
          <p className="muted">
            Public records from {evidence.window.from.slice(0, 10)} to{" "}
            {evidence.window.to.slice(0, 10)} · fetched{" "}
            {evidence.fetchedAt.slice(0, 10)} · rules {card.rules.scoring}
          </p>
          <div className="evidence-grid">
            {Object.entries(evidence.metrics).map(([key, value]) => (
              <div className="evidence-item" key={key}>
                <span>{labels[key as keyof typeof labels]}</span>
                <strong>
                  {value.status === "complete" ? value.value : "Pending"}
                </strong>
                {value.status !== "complete" && <small>{value.reason}</small>}
              </div>
            ))}
          </div>
          <details>
            <summary>See the arithmetic and data limits</summary>
            <p>
              Scores use logarithmic scaling, capped at 255 effective commits,
              63 PR contributions, 63 review contributions, 31 opened issues,
              and 127 public record days. Commits count at most ten per day. Raw
              public commits: {evidence.rawCommits.value ?? "unknown"}
              {evidence.rawCommits.status !== "complete" ? " (incomplete)" : ""}
              .
            </p>
            {d && (
              <>
                <p>
                  Normalized scores: C {d.scores.C}, P {d.scores.P}, R{" "}
                  {d.scores.R}, I {d.scores.I}, D {d.scores.D}.
                </p>
                <p>
                  Power = 1 + floor((3C + P) / 100). Toughness = 1 + floor((2R +
                  I + D) / 100). Charge = ceil((power + toughness + ability
                  points) / 2).
                </p>
              </>
            )}
            <p>
              Stars, followers and account age add no mechanical power. Rarity
              is a stable cosmetic treatment, independent of contribution
              counts. Public visibility does not measure engineering ability.
            </p>
            {evidence.warnings.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
            <a href={`/api/cards/${cardId}`}>View this card’s JSON ›</a>
          </details>
          {evidence.source === "github" && (
            <Link className="text-link" href={`/u/${evidence.identity.login}`}>
              Return to this developer’s latest card ›
            </Link>
          )}
        </section>
      </main>
    </>
  );
}
