import Link from "next/link";
import Header from "@/components/Header";
import SummonForm from "@/components/SummonForm";
import { SAMPLE_CARDS } from "@/lib/cards/samples";
export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" /> THE DEVELOPER’S GRIMOIRE
            </p>
            <h1>
              Every contributor
              <br />
              has a <em>legend.</em>
            </h1>
            <p className="hero-description">
              The things you build. The people you help. The ideas you send into
              the world. Turn your GitHub contributions into a fantasy card
              that’s entirely yours.
            </p>
            <SummonForm />
            <div className="hero-note">
              <span aria-hidden="true">◇</span>
              <p>
                A collectible character, never a developer ranking.
                <br />
                <span className="muted">
                  No AI subscription needed. No sign-in required.
                </span>
              </p>
            </div>
          </div>
          <div className="hero-cards" aria-label="Fictional example card">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="floating-label label-top">
              BASTION GUILD / GUARDIAN
            </span>
            <Link
              href={`/cards/${SAMPLE_CARDS[1].cardId}`}
              className="hero-card-link"
            >
              <img
                className="hero-card"
                src={`/cards/${SAMPLE_CARDS[1].cardId}/image`}
                alt="Fictional sample: Rowan, Aegis Keeper. Guardian, 4 power, 4 toughness, 6 Charge."
                width={380}
                height={532}
              />
            </Link>
            <span className="floating-label label-bottom">
              FORGED FROM CONTRIBUTIONS. FINISHED WITH IMAGINATION.
            </span>
          </div>
        </section>
        <section className="collection-section" id="collection">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A FEW FAMILIAR ARCHETYPES</p>
              <h2>Different paths. Distinct powers.</h2>
            </div>
            <p>
              Three fictional adventurers.
              <br />
              One transparent set of rules.
            </p>
          </div>
          <div className="sample-grid">
            {SAMPLE_CARDS.map((card, index) => (
              <Link
                key={card.cardId}
                href={`/cards/${card.cardId}`}
                className="sample-tile"
              >
                <div className="sample-image">
                  <img
                    src={`/cards/${card.cardId}/image`}
                    alt={`Fictional sample: ${card.creative.name}`}
                    width={300}
                    height={420}
                    loading="lazy"
                  />
                </div>
                <div className="sample-caption">
                  <span className="eyebrow">
                    0{index + 1} /{" "}
                    {
                      [
                        "THE FIRST CHAPTER",
                        "THE COLLABORATOR",
                        "THE SPECIALIST",
                      ][index]
                    }
                  </span>
                  <h3>{card.creative.name}</h3>
                  <p>
                    {
                      [
                        "Every adventure begins somewhere.",
                        "Keeping the gates. Connecting the guild.",
                        "A single craft, honed into something remarkable.",
                      ][index]
                    }
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="how-section" id="how-it-works">
          <div>
            <p className="eyebrow">NO HIDDEN SPELLS</p>
            <h2>
              The story behind
              <br />
              your stats.
            </h2>
            <p>
              Magic in the presentation.
              <br />
              Plain arithmetic underneath.
            </p>
          </div>
          <ol className="steps">
            <li>
              <span>01</span>
              <div>
                <h3>Read the public record</h3>
                <p>
                  We look at a year of public GitHub contribution records.
                  Private work stays private, and unavailable data is labelled.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Find your archetype</h3>
                <p>
                  Contribution patterns shape your guild, attributes and
                  abilities. Capped rules keep numbers bounded. Popularity
                  doesn’t add power.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Keep your legend</h3>
                <p>
                  Download your card or share its permanent link. A cosmetic
                  rarity gives it a finish, not a rank.
                </p>
              </div>
            </li>
          </ol>
        </section>
      </main>
    </>
  );
}
