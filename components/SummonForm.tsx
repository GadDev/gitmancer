"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function SummonForm({ initial = "" }: { initial?: string }) {
  const [username, setUsername] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const router = useRouter();
  return (
    <form
      className="summon-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setError("");
        try {
          const response = await fetch("/api/cards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
          });
          const result = await response.json();
          if (!response.ok)
            throw new Error(result.error || "The forge is unavailable.");
          router.push(result.url + (result.stale ? "?stale=1" : ""));
        } catch (e) {
          setError(
            e instanceof Error ? e.message : "The forge is unavailable.",
          );
          setBusy(false);
        }
      }}
    >
      <label htmlFor="username">GitHub username</label>
      <div className="input-row">
        <span className="at-sign" aria-hidden="true">
          @
        </span>
        <input
          id="username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={40}
          required
          placeholder="your-username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby="form-help form-status"
        />
        <button className="button primary" disabled={busy} type="submit">
          {busy ? "Summoning…" : "Summon your card"}
          <span aria-hidden="true"> ›</span>
        </button>
      </div>
      <p id="form-help" className="form-help">
        Public contributions. Original characters. A little everyday magic.
      </p>
      <div id="form-status" role="status" aria-live="polite">
        {busy ? (
          <p className="form-help">
            Reading public records and forging your character. Large profiles
            can take up to a minute.
          </p>
        ) : error ? (
          <p className="form-error">{error}</p>
        ) : null}
      </div>
    </form>
  );
}
