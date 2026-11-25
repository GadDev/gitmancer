import Link from "next/link";
import { getStore } from "@/lib/store";
import { normalizeLogin } from "@/lib/github/client";
import Header from "@/components/Header";
import SummonForm from "@/components/SummonForm";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default async function DeveloperPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  let login = "";
  try {
    login = normalizeLogin(username);
  } catch {
    /* Show the validation form. */
  }
  const card = login ? getStore().latest(login) : null;
  return (
    <>
      <Header />
      <main id="main" className="developer-page">
        <p className="eyebrow">THE GRIMOIRE / DEVELOPER</p>
        <h1>{login ? `@${login}` : "Find a contributor"}</h1>
        {card ? (
          <>
            <p>
              The latest complete card was forged on{" "}
              {card.evidence.fetchedAt.slice(0, 10)}.
            </p>
            <Link className="button secondary" href={`/cards/${card.cardId}`}>
              Open the saved card ›
            </Link>
          </>
        ) : (
          <p>This contributor’s story is waiting to be written.</p>
        )}
        <h2>{card ? "Refresh the public record" : "Summon a character"}</h2>
        <SummonForm initial={login} />
      </main>
    </>
  );
}
