import { summon } from "@/lib/scout";
import { errorResponse, readSummonRequest } from "@/lib/http";
export const runtime = "nodejs";
export const maxDuration = 90;
export async function POST(request: Request) {
  try {
    const username = await readSummonRequest(request);
    // Trust forwarded client headers only behind a proxy explicitly configured by the operator.
    const clientId =
      process.env.TRUST_PROXY === "1"
        ? (
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            "shared"
          ).slice(0, 100)
        : "shared";
    const { card, stale } = await summon(username, clientId);
    return Response.json(
      { cardId: card.cardId, url: `/cards/${card.cardId}`, stale },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
