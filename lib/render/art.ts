import type { Faction } from "@/lib/cards/schema";
import { GUILDS } from "@/lib/cards/catalog";
// Original geometric guild illustration. No external images, copied card frames, or model calls.
export function guildArt(faction: Faction): string {
  const { accent, dark } = GUILDS[faction];
  const symbol =
    faction === "Bastion"
      ? '<path d="M440 125L520 85L600 125V210L520 255L440 210Z"/><path d="M520 85V255"/>'
      : faction === "Confluence"
        ? '<path d="M410 170C410 70 630 270 630 170S410 270 410 170Z"/>'
        : faction === "Kiln"
          ? '<path d="M520 70L610 170L520 270L430 170Z"/><path d="M520 110L570 170L520 230L470 170Z"/>'
          : faction === "Lantern"
            ? '<path d="M480 120H560V220H480Z"/><path d="M520 60V90M425 95L455 115M615 95L585 115M520 220V260"/>'
            : '<circle cx="520" cy="170" r="75"/><circle cx="550" cy="145" r="25"/>';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="580" viewBox="0 0 1000 580"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${dark}"/><stop offset="1" stop-color="#111d24"/></linearGradient><radialGradient id="halo"><stop stop-color="${accent}" stop-opacity=".4"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs><rect width="1000" height="580" fill="url(#sky)"/><circle cx="520" cy="170" r="290" fill="url(#halo)"/><g fill="none" stroke="${accent}" stroke-width="2" opacity=".28"><circle cx="520" cy="170" r="190"/><circle cx="520" cy="170" r="210"/><path d="M0 360H1000M0 380H1000M520 0V500"/></g><g fill="#121d22"><path d="M0 470L140 290L240 410L390 300L490 450L680 325L820 430L1000 300V580H0Z"/><path d="M120 350V200L165 150L210 200V350ZM760 390V240L810 190L860 240V390Z"/></g><g stroke="${accent}" stroke-width="5" fill="none" stroke-linejoin="round">${symbol}</g><g fill="${accent}" opacity=".7"><circle cx="210" cy="85" r="2"/><circle cx="755" cy="70" r="3"/><circle cx="845" cy="165" r="2"/><circle cx="320" cy="155" r="2"/></g><path d="M475 580V390L520 340L565 390V580Z" fill="${accent}" opacity=".15"/><path d="M520 340V580" stroke="${accent}" opacity=".4"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
