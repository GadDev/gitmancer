import { findCard } from "@/lib/cardLookup";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cardId: string }> },
) {
  const { cardId } = await params;
  const card = findCard(cardId);
  return card
    ? Response.json(card, {
        headers: { "Cache-Control": "public, max-age=31536000, immutable" },
      })
    : Response.json(
        { error: "Card not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
}
