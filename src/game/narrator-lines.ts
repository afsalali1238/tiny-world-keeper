// Naturalist narrator lines. Present tense. The people are a species being observed.
// Rare second-person lines speak quietly to the keeper. No em-dashes anywhere.

import type { ToolKind } from "./types";

export type NarratorTrigger =
  | "idle"
  | "tool:rain"
  | "tool:sun"
  | "tool:wind"
  | "tool:seed"
  | "era"
  | "lifeRise"
  | "fifthVisit"
  | "uncanny"
  | "pivot";

export interface NarratorLine {
  id: string;
  trigger: NarratorTrigger;
  text: string;
}

export const NARRATOR_LIBRARY: NarratorLine[] = [
  { id: "idle-1", trigger: "idle", text: "Here, on a quiet morning, a small valley begins another day. The river has not been named." },
  { id: "idle-2", trigger: "idle", text: "Watch closely. The lights are fewer than they were last season. Something is troubling them, though they could not tell you what." },
  { id: "idle-3", trigger: "idle", text: "It is night again. The people gather close, as small warm things do, when the dark comes." },
  { id: "idle-4", trigger: "idle", text: "Generations pass between one of our breaths and the next. They do not feel it. We do." },
  { id: "idle-5", trigger: "idle", text: "Their world turns. They believe they are turning with it. In a sense, they are right." },

  { id: "rain-1", trigger: "tool:rain", text: "A rain falls on the southern plain. In a hundred years, the people there will have a word for this kind of weather, and a song about who sent it." },
  { id: "rain-2", trigger: "tool:rain", text: "Notice the rain. It arrives without warning, without cloud. They will explain it later, in their own way." },
  { id: "rain-3", trigger: "tool:rain", text: "The fields drink. They do not yet know to be grateful, but they will learn." },

  { id: "sun-1", trigger: "tool:sun", text: "Warmth on the high country. Whole crops will turn toward this single moment, long after it has passed." },
  { id: "sun-2", trigger: "tool:sun", text: "The sun lingers a little longer than it should. The wise among them are taking notes." },
  { id: "sun-3", trigger: "tool:sun", text: "Here, the cold loosens its grip. The people will say a kind word about it tonight." },

  { id: "wind-1", trigger: "tool:wind", text: "A wind crosses the world. Seeds travel with it. So do stories." },
  { id: "wind-2", trigger: "tool:wind", text: "The clouds are moved. To them, this is weather. To us, it is a hand." },

  { id: "seed-1", trigger: "tool:seed", text: "A small green begins where none was before. In a hundred summers, it will be a wood. In a thousand, a country." },
  { id: "seed-2", trigger: "tool:seed", text: "Life is placed, gently, in a place that did not ask for it. This is the oldest kindness in the world." },
  { id: "seed-3", trigger: "tool:seed", text: "Watch what they build around the green that arrives without warning. They will build something." },

  { id: "era-1", trigger: "era", text: "An age ends here. The next has already begun, though no one inside the world will notice for some time." },
  { id: "era-2", trigger: "era", text: "They are becoming something new. Their grandparents would not recognise them. Their grandchildren will not recognise us." },

  { id: "life-1", trigger: "lifeRise", text: "The settlements are growing now. From up here, they look like small constellations, drawn quietly into being." },
  { id: "life-2", trigger: "lifeRise", text: "A civilisation, in the sense that any of this is civilisation. They have begun to wonder about themselves." },
  { id: "life-3", trigger: "lifeRise", text: "Lights, where there were none. Each one is somebody's evening." },

  { id: "fifth-1", trigger: "fifthVisit", text: "You have come back to them five times now. They do not know this. We do." },

  { id: "uncanny-1", trigger: "uncanny", text: "One of them looks up. Just for a moment. As if they could see you." },
  { id: "uncanny-2", trigger: "uncanny", text: "Notice the shape of the small fires in the north. Read from above, they almost spell a question." },
  { id: "uncanny-3", trigger: "uncanny", text: "And in some quiet room of their making, a child has begun to build a tiny world of their own. They are not sure why." },

  // PIVOT. Fires once, ever, around 25 minutes of real play. The single line people will quote.
  { id: "pivot-1", trigger: "pivot", text: "The keeper has not moved in some time. The people have started to wonder if the keeper is also being watched." },
];

export const TRIGGER_FROM_TOOL: Record<ToolKind, NarratorTrigger> = {
  rain: "tool:rain",
  sun: "tool:sun",
  wind: "tool:wind",
  seed: "tool:seed",
};

export function pickLine(
  trigger: NarratorTrigger,
  recentIds: string[],
): NarratorLine | null {
  const pool = NARRATOR_LIBRARY.filter(
    (l) => l.trigger === trigger && !recentIds.includes(l.id),
  );
  const usable = pool.length > 0
    ? pool
    : NARRATOR_LIBRARY.filter((l) => l.trigger === trigger);
  if (!usable.length) return null;
  return usable[Math.floor(Math.random() * usable.length)];
}
