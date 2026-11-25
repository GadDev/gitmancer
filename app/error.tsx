"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="developer-page">
      <p className="eyebrow">A PAUSE IN THE SPELL</p>
      <h1>The forge needs a moment.</h1>
      <p>Your saved cards are kept separately. Please try again.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
