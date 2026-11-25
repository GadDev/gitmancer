import Link from "next/link";
export default function Header() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Gitmancer home">
        <span className="brand-mark" aria-hidden="true">
          ✧
        </span>{" "}
        Gitmancer
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/#collection">The collection</Link>
        <Link href="/#how-it-works">How it works</Link>
        <a
          href="https://github.com/GadDev/gitmancer"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ›
        </a>
      </nav>
    </header>
  );
}
