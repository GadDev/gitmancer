import { expect, it } from "vitest";
import { renderCard } from "@/lib/render/cardTree";
import { buildCard } from "@/lib/cards/build";
import { sampleSnapshot } from "@/lib/cards/samples";
it.each(["A".repeat(60), "开发者"])(
  "renders a portable PNG for a long or unsupported-script name",
  async (name) => {
    const snapshot = sampleSnapshot(1);
    snapshot.identity.displayName = name;
    const response = await renderCard(buildCard(snapshot));
    const png = Buffer.from(await response.arrayBuffer());
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(1000);
    expect(png.readUInt32BE(20)).toBe(1400);
    expect(png.length).toBeGreaterThan(10000);
  },
);
