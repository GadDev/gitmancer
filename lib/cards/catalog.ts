import type { AbilityId, Faction } from "./schema";
export const ABILITIES: Record<
  AbilityId,
  { name: string; text: string; points: number }
> = {
  aegis: {
    name: "Aegis",
    text: "The first time this unit would take damage each round, prevent 1 of that damage.",
    points: 2,
  },
  relay: {
    name: "Relay",
    text: "On entry, another friendly unit gains +1 toughness until the end of this round.",
    points: 1,
  },
  forge: {
    name: "Forge",
    text: "On entry, deal 1 damage to one opposing unit, if any.",
    points: 1,
  },
  survey: {
    name: "Survey",
    text: "On entry, look at your deck’s top card; you may put it on the bottom. No effect on an empty deck.",
    points: 1,
  },
  spark: {
    name: "Spark",
    text: "On entry, restore 1 vitality to your player, up to starting vitality.",
    points: 1,
  },
};
export const GUILDS: Record<
  Faction,
  { title: string; accent: string; dark: string; flavor: string; mark: string }
> = {
  Bastion: {
    title: "Aegis Keeper",
    accent: "#a5bed3",
    dark: "#233a4b",
    flavor: "The city sleeps because someone checks the gates.",
    mark: "◇",
  },
  Confluence: {
    title: "Threadbinder",
    accent: "#87baad",
    dark: "#23443e",
    flavor: "A single thread becomes a bridge in the right hands.",
    mark: "∞",
  },
  Kiln: {
    title: "Emberwright",
    accent: "#d89874",
    dark: "#593528",
    flavor: "One instrument, a thousand careful variations.",
    mark: "△",
  },
  Lantern: {
    title: "Lantern Seeker",
    accent: "#d1b76e",
    dark: "#443849",
    flavor: "A question is a lantern waiting to be lit.",
    mark: "✧",
  },
  Horizon: {
    title: "First Spark",
    accent: "#abbc8d",
    dark: "#364033",
    flavor: "Every enduring forge begins with a careful spark.",
    mark: "○",
  },
};
