import { test, expect } from "@playwright/test";
test("samples, immutable JSON, PNG export, metadata and mobile navigation", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Every contributor/ }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: /Fictional sample: Rowan/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Rowan, Aegis Keeper" }),
  ).toBeVisible();
  await expect(page.getByText("Fictional sample ·")).toBeVisible();
  const id = page.url().split("/").pop()!;
  const json = await request.get("/api/cards/" + id);
  expect(json.status()).toBe(200);
  expect((await json.json()).derived.resourceCost).toBe(6);
  const png = await request.get(`/cards/${id}.png`);
  expect(png.status()).toBe(200);
  expect(png.headers()["content-type"]).toContain("image/png");
  const buffer = await png.body();
  expect(buffer.subarray(1, 4).toString()).toBe("PNG");
  expect(buffer.readUInt32BE(16)).toBe(1000);
  expect(buffer.readUInt32BE(20)).toBe(1400);
  expect(buffer.length).toBeGreaterThan(10000);
  const social = await request.get(`/cards/${id}/image?social=1`);
  const image = await social.body();
  expect(image.readUInt32BE(16)).toBe(1200);
  expect(image.readUInt32BE(20)).toBe(630);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: /Download PNG/ }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("fictional-rowan-gitmancer.png");
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("textbox", { name: "GitHub username" })
    .fill("https://evil.example");
  await page.getByRole("button", { name: /Summon your card/ }).click();
  await expect(page.getByRole("status")).toContainText(
    "Enter a GitHub username",
  );
  const missing = await request.get("/cards/" + "0".repeat(64) + "/image");
  expect(missing.status()).toBe(404);
  expect(missing.headers()["cache-control"]).toBe("no-store");
});
