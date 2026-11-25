import { it, expect } from "vitest";
import { readSummonRequest, errorResponse } from "@/lib/http";
it("rejects cross-origin, oversized and malformed generation requests", async () => {
  const request = (body: string, origin = "http://localhost:3000") =>
    new Request("http://localhost:3000/api/cards", {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body,
    });
  await expect(readSummonRequest(request('{"username":"Ada"}'))).resolves.toBe(
    "Ada",
  );
  await expect(
    readSummonRequest(request('{"username":"Ada"}', "https://evil.example")),
  ).rejects.toThrow();
  await expect(readSummonRequest(request("x".repeat(2000)))).rejects.toThrow();
  await expect(readSummonRequest(request("{oops"))).rejects.toThrow();
});
it("never exposes an unexpected error or token in HTTP responses", async () => {
  const response = errorResponse(new Error("secret-canary"));
  expect(response.status).toBe(500);
  expect(await response.text()).not.toContain("secret-canary");
});
