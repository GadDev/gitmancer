import "server-only";
import { SAMPLE_CARDS } from "./cards/samples";
import { getStore } from "./store";
export function findCard(id: string) {
  const sample = SAMPLE_CARDS.find((c) => c.cardId === id);
  if (sample) {
    if (!getStore().get(id)) getStore().save(sample);
    return sample;
  }
  return getStore().get(id);
}
