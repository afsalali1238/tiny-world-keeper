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
  | "pivot"
  | "combo:steam"
  | "combo:bloom"
  | "combo:drought"
  | "combo:exodus"
  | "echo";

export interface NarratorLine {
  id: string;
  trigger: NarratorTrigger;
  text: string;
}

// Templated lines use {NAME} which the narrator substitutes at render time.
export const NARRATOR_LIBRARY: NarratorLine[] = [
  // Idle.
  { id: "idle-1", trigger: "idle", text: "Here, on a quiet morning, a small valley begins another day. The river has not been named." },
  { id: "idle-2", trigger: "idle", text: "Watch closely. The lights are fewer than they were last season. Something is troubling them, though they could not tell you what." },
  { id: "idle-3", trigger: "idle", text: "It is night again. The people gather close, as small warm things do, when the dark comes." },
  { id: "idle-4", trigger: "idle", text: "Generations pass between one of our breaths and the next. They do not feel it. We do." },
  { id: "idle-5", trigger: "idle", text: "Their world turns. They believe they are turning with it. In a sense, they are right." },
  { id: "idle-6", trigger: "idle", text: "A boat puts out from a small harbour. It has been built for a reason no one will remember in eighty years." },
  { id: "idle-7", trigger: "idle", text: "The wind moves the smoke. The smoke is from a meal. The meal is the small good thing, today, here." },
  { id: "idle-8", trigger: "idle", text: "There is a quarrel in one of the settlements. By the time we look again, it will be over. By the time we look again after that, it will be a song." },
  { id: "idle-9", trigger: "idle", text: "A clear day. The sort of day they will, eventually, build their religions around." },
  { id: "idle-10", trigger: "idle", text: "Notice how small they keep their lights. They do not yet know how dark the rest of the dark is." },
  { id: "idle-11", trigger: "idle", text: "A funeral, in one of the older towns. The same words, more or less, that they used a thousand years ago. They are good words." },
  { id: "idle-12", trigger: "idle", text: "A boy is teaching himself an instrument. He is not very good. Give him forty years." },
  { id: "idle-13", trigger: "idle", text: "There is a season here for which they have no name. They will invent one, and forget it, and invent it again." },
  { id: "idle-14", trigger: "idle", text: "Two people, on a bridge, in a city that does not yet have a name worth keeping. They are arguing softly about something neither will remember by morning." },
  { id: "idle-15", trigger: "idle", text: "From this distance, their wars look like weather. From closer, of course, they do not." },
  { id: "idle-16", trigger: "idle", text: "A library catches the late light. Inside, a single reader has just understood something. She will not be able to explain it for years." },

  // Rain.
  { id: "rain-1", trigger: "tool:rain", text: "A rain falls on the southern plain. In a hundred years, the people there will have a word for this kind of weather, and a song about who sent it." },
  { id: "rain-2", trigger: "tool:rain", text: "Notice the rain. It arrives without warning, without cloud. They will explain it later, in their own way." },
  { id: "rain-3", trigger: "tool:rain", text: "The fields drink. They do not yet know to be grateful, but they will learn." },
  { id: "rain-4", trigger: "tool:rain", text: "A child in a low village turns her face upward and laughs. It is the first weather she remembers." },

  // Sun.
  { id: "sun-1", trigger: "tool:sun", text: "Warmth on the high country. Whole crops will turn toward this single moment, long after it has passed." },
  { id: "sun-2", trigger: "tool:sun", text: "The sun lingers a little longer than it should. The wise among them are taking notes." },
  { id: "sun-3", trigger: "tool:sun", text: "Here, the cold loosens its grip. The people will say a kind word about it tonight." },
  { id: "sun-4", trigger: "tool:sun", text: "A long afternoon. Someone falls asleep in it. They are not the first." },

  // Wind.
  { id: "wind-1", trigger: "tool:wind", text: "A wind crosses the world. Seeds travel with it. So do stories." },
  { id: "wind-2", trigger: "tool:wind", text: "The clouds are moved. To them, this is weather. To us, it is a hand." },
  { id: "wind-3", trigger: "tool:wind", text: "Sailors take it as a sign. They are nearly always wrong about which sign, and nearly always grateful." },
  { id: "wind-4", trigger: "tool:wind", text: "A kite, somewhere. A child, somewhere. The wind does not care which, but the child does." },

  // Seed.
  { id: "seed-1", trigger: "tool:seed", text: "A small green begins where none was before. In a hundred summers, it will be a wood. In a thousand, a country." },
  { id: "seed-2", trigger: "tool:seed", text: "Life is placed, gently, in a place that did not ask for it. This is the oldest kindness in the world." },
  { id: "seed-3", trigger: "tool:seed", text: "Watch what they build around the green that arrives without warning. They will build something." },
  { id: "seed-4", trigger: "tool:seed", text: "A grove begins. Children, generations from now, will think it has always been there. They will be wrong, but only a little." },

  // Era.
  { id: "era-1", trigger: "era", text: "An age ends here. The next has already begun, though no one inside the world will notice for some time." },
  { id: "era-2", trigger: "era", text: "They are becoming something new. Their grandparents would not recognise them. Their grandchildren will not recognise us." },
  { id: "era-3", trigger: "era", text: "A century closes. The histories will say it ended on a specific day. It did not." },
  { id: "era-4", trigger: "era", text: "Something has shifted. They cannot point to it. We can, and we will not." },
  { id: "era-5", trigger: "era", text: "An age, ending. The first generation of the next age has already been born and given names that will sound old by the time they are old." },

  // Life rises.
  { id: "life-1", trigger: "lifeRise", text: "The settlements are growing now. From up here, they look like small constellations, drawn quietly into being." },
  { id: "life-2", trigger: "lifeRise", text: "A civilisation, in the sense that any of this is civilisation. They have begun to wonder about themselves." },
  { id: "life-3", trigger: "lifeRise", text: "Lights, where there were none. Each one is somebody's evening." },
  { id: "life-4", trigger: "lifeRise", text: "From up here, the cities have started to look like the night sky, only warmer." },

  // Fifth-visit.
  { id: "fifth-1", trigger: "fifthVisit", text: "You have come back to them five times now. They do not know this. We do." },

  // Uncanny.
  { id: "uncanny-1", trigger: "uncanny", text: "One of them looks up. Just for a moment. As if they could see you." },
  { id: "uncanny-2", trigger: "uncanny", text: "Notice the shape of the small fires in the north. Read from above, they almost spell a question." },
  { id: "uncanny-3", trigger: "uncanny", text: "And in some quiet room of their making, a child has begun to build a tiny world of their own. They are not sure why." },
  { id: "uncanny-4", trigger: "uncanny", text: "Their best mathematicians, in late evenings, in quiet rooms, are beginning to suspect that the numbers prefer round figures." },

  // Pivot.
  { id: "pivot-1", trigger: "pivot", text: "The keeper has not moved in some time. The people have started to wonder if the keeper is also being watched." },

  // Combos.
  { id: "combo-steam-1", trigger: "combo:steam", text: "Rain on warm ground. A pale mist climbs. The priests of one village will, in time, declare it the breath of the world." },
  { id: "combo-steam-2", trigger: "combo:steam", text: "The water meets the warmth. They are watching steam for the first time. Some of them will spend their lives studying it." },
  { id: "combo-bloom-1", trigger: "combo:bloom", text: "Wet earth. Warm earth. The seed knows what it has been waiting for. Within a generation, this place will be famous for fruit." },
  { id: "combo-bloom-2", trigger: "combo:bloom", text: "The bloom is sudden. The people who see it will tell their children, who will tell theirs, with embellishments." },
  { id: "combo-drought-1", trigger: "combo:drought", text: "Three suns in a row. The wells go quiet. The eldest among them are not yet worried, but they remember a story." },
  { id: "combo-drought-2", trigger: "combo:drought", text: "The land is being asked too much. Notice the change in the colour of the southern fields." },
  { id: "combo-exodus-1", trigger: "combo:exodus", text: "Seeds, then a wind to carry them. The young leave for the coast. Their parents say they will be back. They will not." },
  { id: "combo-exodus-2", trigger: "combo:exodus", text: "A migration begins, without anyone calling it that. In two hundred years, the museum will." },

  // Echo. {NAME} substituted to a prior keeper's name.
  { id: "echo-1", trigger: "echo", text: "There is an old story in one of the towns about a being called {NAME}. The details are wrong. The feeling is right." },
  { id: "echo-2", trigger: "echo", text: "A child has been named {NAME}, after a word their grandmother insists came from the sky." },
  { id: "echo-3", trigger: "echo", text: "On a high shelf in a temple, the name {NAME} is written, and no one alive knows why." },
  { id: "echo-4", trigger: "echo", text: "An astronomer has begun to suspect that the constellation they call {NAME} is not, in fact, in the sky." },
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
