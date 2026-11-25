import { findCard } from "@/lib/cardLookup";
import { renderCard } from "@/lib/render/cardTree";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> },
) {
  try {
    const { cardId } = await params;
    const card = findCard(cardId);
    if (!card)
      return new Response("Card not found", {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      });
    const social = new URL(request.url).searchParams.get("social") === "1";
    const image = await renderCard(card, social);
    image.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    if (new URL(request.url).searchParams.get("download") === "1")
      image.headers.set(
        "Content-Disposition",
        `attachment; filename="${card.evidence.identity.login.replace(/[^a-zA-Z0-9-]/g, "")}-gitmancer.png"`,
      );
    return image;
  } catch {
    return new Response("Image rendering is temporarily unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
