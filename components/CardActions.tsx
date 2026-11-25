"use client";
import { useEffect, useState } from "react";
export default function CardActions({
  cardId,
  name,
}: {
  cardId: string;
  name: string;
}) {
  const [message, setMessage] = useState(""),
    [native, setNative] = useState(false);
  useEffect(() => {
    setNative(typeof navigator.share === "function");
  }, []);
  const link = () => `${location.origin}/cards/${cardId}`;
  return (
    <div>
      <div className="actions">
        <a
          className="button primary"
          href={`/cards/${cardId}/image?download=1`}
        >
          Download PNG <span aria-hidden="true">⌄</span>
        </a>
        <button
          className="button secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link());
              setMessage("Card link copied.");
            } catch {
              setMessage(
                "Copy the address from your browser to share this card.",
              );
            }
          }}
        >
          Copy link
        </button>
        {native && (
          <button
            className="button secondary"
            onClick={async () => {
              try {
                await navigator.share({
                  title: name,
                  text: "Your contributions. Your character.",
                  url: link(),
                });
              } catch (error) {
                if (!(error instanceof Error && error.name === "AbortError"))
                  setMessage("Sharing is unavailable. Try copying the link.");
              }
            }}
          >
            Share
          </button>
        )}
      </div>
      <p className="form-help" role="status">
        {message}
      </p>
    </div>
  );
}
