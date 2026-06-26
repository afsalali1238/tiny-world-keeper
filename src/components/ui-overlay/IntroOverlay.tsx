import { useEffect, useState } from "react";
import { useWorld } from "@/game/store";
import { NAME_SUGGESTIONS, randomMythicName } from "@/game/names";
import { loadKeepers } from "@/game/keepers";

const GIFT_LINES = [
  "This one is yours now.",
  "It is cold, and it is waiting.",
];

const STEP_PROMPT: Record<"warm" | "spray" | "seed", { title: string; sub: string }> = {
  warm: {
    title: "Touch the world to warm it.",
    sub: "Warmth first. Everything else is built on it.",
  },
  spray: {
    title: "Touch the world to bring water.",
    sub: "Warmth alone is a desert. A world needs seas.",
  },
  seed: {
    title: "Touch the world to plant the first life.",
    sub: "Now the first brave, foolish thing.",
  },
};

export function IntroOverlay() {
  const intro = useWorld((s) => s.intro);
  const setIntro = useWorld((s) => s.setIntro);
  const setTool = useWorld((s) => s.setTool);
  const setPlanetName = useWorld((s) => s.setPlanetName);

  if (intro === "done") return null;
  if (intro === "transcend") return <TranscendBeat />;
  if (intro === "escape") return <EscapeBeat />;
  if (intro === "corruption") return <CorruptionBeat />;
  if (intro === "gift")
    return (
      <GiftBeat
        onOpen={() => {
          // Genesis begins: warm step, sun tool pre-equipped, no menus.
          setTool("sun");
          setIntro("warm");
        }}
      />
    );
  if (intro === "name") return <NameBeat onName={setPlanetName} />;
  if (intro === "pour") return null; // legacy step, no UI

  // warm | spray | seed
  const copy = STEP_PROMPT[intro];

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-12 z-30 flex flex-col items-center gap-1 px-6 text-center">
      <p
        key={intro}
        className="terrarium-fade font-serif text-xl italic text-foreground/90 md:text-2xl"
      >
        {copy.title}
      </p>
      <p className="terrarium-fade font-serif text-sm italic text-foreground/60">{copy.sub}</p>
    </div>
  );
}

function GiftBeat({ onOpen }: { onOpen: () => void }) {
  const [shown, setShown] = useState(0);
  const keepers = loadKeepers();
  useEffect(() => {
    if (shown >= GIFT_LINES.length) return;
    const t = setTimeout(() => setShown((s) => s + 1), 1800);
    return () => clearTimeout(t);
  }, [shown]);

  return (
    // No backdrop blur. The cold planet must be visible behind every line.
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center pb-10">
      <div className="flex flex-col items-center gap-2 px-6 text-center">
        {GIFT_LINES.slice(0, shown).map((line, i) => (
          <p
            key={i}
            className="terrarium-fade font-serif text-lg italic text-foreground/85 md:text-xl"
          >
            {line}
          </p>
        ))}
      </div>
      {shown >= GIFT_LINES.length && (
        <>
          {keepers.length > 0 && (
            <div className="terrarium-fade mt-5 max-w-md px-6 text-center">
              <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-foreground/40">
                former keepers
              </p>
              <p className="mt-1 font-serif text-xs italic text-foreground/55">
                {keepers.slice(0, 6).join("  ·  ")}
              </p>
            </div>
          )}
          <button
            onClick={onOpen}
            className="terrarium-rise pointer-events-auto mt-5 rounded-full bg-foreground px-7 py-3 text-sm font-medium text-background transition hover:scale-[1.03]"
          >
            Begin
          </button>
        </>
      )}
    </div>
  );
}

function NameBeat({ onName }: { onName: (n: string) => void }) {
  const [value, setValue] = useState("");
  const submit = (n: string) => {
    const clean = n.trim();
    if (!clean) return;
    onName(clean);
  };
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-end justify-center pb-20">
      <div className="terrarium-rise pointer-events-auto flex w-[min(440px,90vw)] flex-col gap-4 rounded-2xl bg-card/90 p-6 text-center backdrop-blur-xl">
        <p className="font-serif text-lg italic text-foreground/85">
          Every world deserves a name.
        </p>
        <p className="font-serif text-xs italic text-foreground/55">
          What will you call this one?
        </p>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit(value)}
          placeholder="name your terrarium"
          className="rounded-xl border border-border bg-background/60 px-4 py-2.5 text-center font-serif text-lg italic outline-none focus:border-accent"
        />
        <div className="flex flex-wrap justify-center gap-2">
          {NAME_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              className="rounded-full border border-border bg-background/40 px-3 py-1 text-sm font-serif italic transition hover:bg-background/80"
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => submit(randomMythicName())}
            className="rounded-full bg-accent/60 px-3 py-1 text-sm font-serif italic transition hover:bg-accent/80"
          >
            surprise me
          </button>
        </div>
        <button
          onClick={() => submit(value)}
          disabled={!value.trim()}
          className="mt-1 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition hover:scale-[1.03] disabled:opacity-40"
        >
          Then it begins
        </button>
      </div>
    </div>
  );
}

function TranscendBeat() {
  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur px-6 text-center">
      <div className="flex flex-col gap-4">
        <p className="terrarium-fade font-serif text-3xl italic text-foreground md:text-4xl">
          They have outgrown you.
        </p>
        <p className="terrarium-fade font-serif text-lg italic text-foreground/70 delay-500">
          They no longer look to the sky for answers. They look to each other.
        </p>
        <p className="terrarium-fade font-serif text-sm italic text-foreground/50 delay-1000 mt-8">
          The container is open.
        </p>
      </div>
      </div>
    </div>
  );
}

function EscapeBeat() {
  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur px-6 text-center">
      <div className="flex flex-col gap-4">
        <p className="terrarium-fade font-serif text-3xl italic text-foreground md:text-4xl text-amber-500">
          They have broken the sky.
        </p>
        <p className="terrarium-fade font-serif text-lg italic text-foreground/70 delay-500">
          Driven by fear and curiosity, they built a ship to pierce the glass.
        </p>
        <p className="terrarium-fade font-serif text-sm italic text-foreground/50 delay-1000 mt-8">
          The container is empty.
        </p>
      </div>
    </div>
  );
}

function CorruptionBeat() {
  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur px-6 text-center">
      <div className="flex flex-col gap-4">
        <p className="terrarium-fade font-serif text-3xl italic text-red-500 md:text-4xl">
          The Blight has consumed them.
        </p>
        <p className="terrarium-fade font-serif text-lg italic text-foreground/70 delay-500">
          Your world has fallen to darkness.
        </p>
        <p className="terrarium-fade font-serif text-sm italic text-foreground/50 delay-1000 mt-8">
          The container goes silent.
        </p>
        <button
          onClick={() => useWorld.getState().reset()}
          className="terrarium-fade mt-8 rounded-full bg-red-900/40 px-5 py-2 text-sm font-medium text-red-100 transition hover:scale-[1.03] delay-1000 border border-red-500/30"
        >
          Begin Anew
        </button>
      </div>
    </div>
  );
}
