import "server-only";
import { GithubError } from "./github/client";
export function errorResponse(error: unknown): Response {
  const known = error instanceof GithubError;
  return Response.json(
    {
      error: known
        ? error.message
        : "The forge could not complete this request. Please try again.",
      code: known ? error.code : "internal",
    },
    {
      status: known ? error.status : 500,
      headers: {
        "Cache-Control": "no-store",
        ...(known && error.retryAfter
          ? { "Retry-After": String(error.retryAfter) }
          : {}),
      },
    },
  );
}
export async function readSummonRequest(request: Request): Promise<string> {
  const expected = process.env.APP_ORIGIN || new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (
    (origin && origin !== expected) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new GithubError("invalid", "Please generate cards from this site.");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new GithubError("invalid", "Send a JSON username.");
  const reader = request.body?.getReader();
  if (!reader) throw new GithubError("invalid", "Enter a GitHub username.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > 1024) {
      await reader.cancel();
      throw new GithubError("invalid", "This request is too large.");
    }
    chunks.push(chunk.value);
  }
  let body: unknown;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new GithubError("invalid", "Send a valid JSON username.");
  }
  if (
    !body ||
    typeof body !== "object" ||
    !("username" in body) ||
    typeof body.username !== "string"
  )
    throw new GithubError("invalid", "Enter a GitHub username.");
  return body.username;
}
