import Link from "next/link";
import Header from "@/components/Header";
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="developer-page">
        <p className="eyebrow">A MISSING PAGE</p>
        <h1>
          This legend hasn’t
          <br />
          been written yet.
        </h1>
        <p>The card may not exist on this forge. Try summoning a new one.</p>
        <Link className="button primary" href="/">
          Return to the grimoire
        </Link>
      </main>
    </>
  );
}
