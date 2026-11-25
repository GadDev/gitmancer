import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ABILITIES, GUILDS } from "@/lib/cards/catalog";
import type { Card } from "@/lib/cards/schema";
import { guildArt } from "./art";
let fonts:
  | Promise<
      { name: string; data: Buffer; weight: 400 | 600; style: "normal" }[]
    >
  | undefined;
function loadFonts() {
  return (fonts ??= Promise.all(
    [
      {
        name: "Cormorant",
        file: "@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff",
        weight: 600 as const,
      },
      {
        name: "DM Sans",
        file: "@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff",
        weight: 400 as const,
      },
    ].map(async (f) => ({
      name: f.name,
      data: await readFile(join(process.cwd(), "node_modules", f.file)),
      weight: f.weight,
      style: "normal" as const,
    })),
  ));
}
export function cardTree(card: Card) {
  const d = card.derived,
    faction = d?.faction ?? "Horizon",
    guild = GUILDS[faction];
  // Artwork is decorative. For unsupported scripts, a GitHub login keeps PNG text legible;
  // the full Unicode display name remains in the accessible HTML evidence panel.
  const pngName = /^[\u0000-\u00ff\u2000-\u206f]*$/.test(card.creative.name)
    ? card.creative.name
    : `${card.evidence.identity.login}, ${guild.title}`;
  return (
    <div
      style={{
        width: 1000,
        height: 1400,
        display: "flex",
        padding: 24,
        background: "#17211f",
        color: "#252e28",
        fontFamily: "DM Sans",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          flexDirection: "column",
          background: "#eee7d7",
          border: `3px solid ${guild.accent}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            height: 144,
            padding: "25px 30px",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#f3edde",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Cormorant",
              fontWeight: 600,
              fontSize: pngName.length > 45 ? 36 : 46,
              width: 730,
              lineHeight: 1.05,
            }}
          >
            {pngName}
          </div>
          <div
            style={{
              display: "flex",
              width: 92,
              height: 92,
              borderRadius: 46,
              background: guild.dark,
              color: "#f4eedf",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
            }}
          >
            {d?.resourceCost ?? "—"}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            height: 480,
            overflow: "hidden",
            borderTop: "2px solid #b8af9a",
            borderBottom: "2px solid #b8af9a",
          }}
        >
          <img
            src={guildArt(faction)}
            width={948}
            height={480}
            alt=""
            style={{ objectFit: "cover" }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "22px 30px",
            background: guild.dark,
            color: "#eee7d7",
            fontSize: 25,
          }}
        >
          <span>{d ? `${faction} · ${d.archetype}` : "Unwritten legend"}</span>
          <span>{d?.rarity ?? "Provisional"}</span>
        </div>
        <div
          style={{
            display: "flex",
            flex: 1,
            padding: "30px 36px 20px",
            flexDirection: "column",
          }}
        >
          {d ? (
            d.abilities.map((id) => (
              <div
                key={id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginBottom: 22,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 29,
                    marginBottom: 7,
                    color: guild.dark,
                  }}
                >
                  {ABILITIES[id].name}
                </div>
                <div style={{ display: "flex", fontSize: 25, lineHeight: 1.3 }}>
                  {ABILITIES[id].text}
                </div>
              </div>
            ))
          ) : (
            <div style={{ display: "flex", fontSize: 30, lineHeight: 1.4 }}>
              {card.evidence.identity.accountType === "Bot"
                ? "Clockwork companion. Human-community mechanics are not assigned."
                : "Partial public data — mechanics pending. A missing record is not zero activity."}
            </div>
          )}
          <div
            style={{
              display: "flex",
              marginTop: "auto",
              fontFamily: "Cormorant",
              fontSize: 32,
              lineHeight: 1.2,
              paddingTop: 20,
              borderTop: "1px solid #c6bda9",
            }}
          >
            {card.creative.flavorText}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            padding: "14px 30px 24px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 18,
              color: "#586355",
              width: 700,
            }}
          >
            <span>GITMANCER · @{card.evidence.identity.login}</span>
            <span>
              {card.evidence.source === "fictional"
                ? "FICTIONAL SAMPLE"
                : `PUBLIC RECORDS · ${card.evidence.fetchedAt.slice(0, 10)}`}{" "}
              · GUILD-1
            </span>
          </div>
          <div
            style={{
              display: "flex",
              padding: "7px 21px",
              border: `2px solid ${guild.dark}`,
              fontFamily: "Cormorant",
              fontSize: 43,
            }}
          >
            {d ? `${d.power} / ${d.toughness}` : "— / —"}
          </div>
        </div>
      </div>
    </div>
  );
}
export async function renderCard(card: Card, social = false) {
  const fontData = await loadFonts();
  const element = social ? (
    <div
      style={{
        width: 1200,
        height: 630,
        background: "#101b18",
        color: "#f0e9da",
        display: "flex",
        alignItems: "center",
        padding: 48,
        justifyContent: "space-between",
        fontFamily: "DM Sans",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: 630 }}>
        <div
          style={{
            display: "flex",
            fontSize: 20,
            color: "#b6c38e",
            letterSpacing: 4,
          }}
        >
          GITMANCER
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Cormorant",
            fontSize: 62,
            marginTop: 30,
          }}
        >
          {card.creative.name}
        </div>
        <div style={{ display: "flex", fontSize: 25, marginTop: 25 }}>
          {card.derived
            ? `${card.derived.archetype} · ${card.derived.power}/${card.derived.toughness} · ${card.derived.resourceCost} Charge`
            : "A legend in the making"}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 20,
            color: "#aeb5a6",
            marginTop: 24,
          }}
        >
          {card.evidence.source === "fictional"
            ? "Fictional sample character"
            : "Your contributions. Your character."}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          width: 360,
          height: 504,
          transform: "rotate(4deg)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            transform: "scale(0.36)",
            transformOrigin: "top left",
            width: 1000,
            height: 1400,
            flexShrink: 0,
          }}
        >
          {cardTree(card)}
        </div>
      </div>
    </div>
  ) : (
    cardTree(card)
  );
  return new ImageResponse(element, {
    width: social ? 1200 : 1000,
    height: social ? 630 : 1400,
    fonts: fontData,
  });
}
