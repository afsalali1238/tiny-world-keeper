import type { MythEntry } from "./types";

export const MYTH_LIBRARY: Record<string, Omit<MythEntry, "era" | "createdAt">> = {
  creation: {
    id: "creation",
    tag: "a creation myth",
    text: "They say the Warm One leaned close and the sea remembered how to move. The first child opened her eyes to a sky that had only just learned its color.",
  },
  comfortingLie: {
    id: "comfortingLie",
    tag: "a children's story",
    text: "The stars, they tell their young, are lanterns held by ancestors leaning down to watch over us.",
  },
  frighteningTruth: {
    id: "frighteningTruth",
    tag: "a quiet doctrine",
    text: "The stars are fires impossibly far. We are small. The elders say this softly, and the children sleep less easily.",
  },
  firstborn: {
    id: "firstborn",
    tag: "a blessing remembered",
    text: "The firstborn of that night grew tall and unafraid, and the people said the Warm One had touched his brow.",
  },
  quietOne: {
    id: "quietOne",
    tag: "a small legend",
    text: "The quiet one grew strange and kind, and the people whispered that the Warm One loved the unnoticed best.",
  },
  bloomMountain: {
    id: "bloomMountain",
    tag: "a place name",
    text: "They named the mountain after you and it answered with flowers. For three generations no one was hungry there.",
  },
  smokeMountain: {
    id: "smokeMountain",
    tag: "a place name",
    text: "They named the mountain after you and it answered with smoke. They learned to bow before naming things.",
  },
  rainBlessing: {
    id: "rainBlessing",
    tag: "a harvest song",
    text: "The rain came on the day they asked, and they sang of a kindness that listens.",
  },
  cometSign: {
    id: "cometSign",
    tag: "a sign in the sky",
    text: "A bright thing crossed the sky and the prophets wrote for a hundred years about what it must have meant.",
  },
  withheld: {
    id: "withheld",
    tag: "a lesson in silence",
    text: "The Warm One did not answer. The people learned to mend what they had broken, and called the silence a teaching.",
  },
  twoProphetsA: {
    id: "twoProphetsA",
    tag: "the elder prophet",
    text: "They followed the elder prophet, and a calm settled on the cities like an old quilt.",
  },
  twoProphetsB: {
    id: "twoProphetsB",
    tag: "the young prophet",
    text: "They followed the young prophet, and the world grew louder and braver and a little less safe.",
  },
  droughtMercy: {
    id: "droughtMercy",
    tag: "a remembered mercy",
    text: "The river returned in the night. They left bread on the stones for years afterward, in case kindness was hungry.",
  },
  auroraWonder: {
    id: "auroraWonder",
    tag: "a sky-story",
    text: "Light moved across the night sky in slow ribbons. The children stopped speaking, and the elders cried without knowing why.",
  },
};
