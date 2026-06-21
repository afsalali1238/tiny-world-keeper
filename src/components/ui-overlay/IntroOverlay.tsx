import { useEffect, useState } from "react";
import { useWorld } from "@/game/store";
import { NAME_SUGGESTIONS, randomMythicName } from "@/game/names";
import { loadKeepers } from "@/game/keepers";


const GIFT_LINES = [
  "Every Keeper is given one.",
  "A world, small enough to hold. Real enough to matter.",
  "The last one who held it is gone now. It's yours.",
  "It's cold. It's waiting.",
];

export function IntroOverlay() {
  const intro = useWorld((s) => s.intro);
  const setIntro = useWorld((s) => s.setIntro);
  const setPlanetName = useWorld((s) => s.setPlanetName);
  const breatheWarmth = useWorld((s) => s.breatheWarmth);
  const letItRain = useWorld((s) => s.letItRain);
  const plantSpark = useWorld((s) => s.plantSpark);

  if (intro === "done") return null;
  if (intro === "gift") return <GiftBeat onOpen={() => setIntro("name")} />;
  if (intro === "name") return <NameBeat onName={setPlanetName} />;

  const step =
    intro === "warm"
      ? { title: "It's cold.", btn: "Breathe warmth", action: breatheWarmth }
      : intro === "water"
        ? { title: "It's dry.", btn: "Let it rain", action: letItRain }
        : { title: "It's empty.", btn: "Plant the first spark", action: plantSpark };

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-end justify-center pb-20">
      <div className="terrarium-rise pointer-events-auto flex flex-col items-center gap-6 rounded-2xl bg-card/80 px-8 py-6 text-center backdrop-blur-xl">
        <p className="font-serif text-2xl italic text-foreground">{step.title}</p>
        <button
          onClick={step.action}
          className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition hover:scale-[1.03]"
        >
          {step.btn}
        </button>
      </div>
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
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-end bg-background/40 pb-24 backdrop-blur-[2px]">
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        {GIFT_LINES.slice(0, shown).map((line, i) => (
          <p
            key={i}
            className="terrarium-fade font-serif text-xl italic text-foreground/85 md:text-2xl"
          >
            {line}
          </p>
        ))}
      </div>
      {shown >= GIFT_LINES.length && (
        <>
          {keepers.length > 0 && (
            <div className="terrarium-fade mt-8 max-w-md px-6 text-center">
              <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-foreground/40">
                former keepers
              </p>
              <p className="mt-2 font-serif text-sm italic text-foreground/55">
                {keepers.slice(0, 6).join("  ·  ")}
              </p>
            </div>
          )}
          <button
            onClick={onOpen}
            className="terrarium-rise pointer-events-auto mt-8 rounded-full bg-foreground px-7 py-3 text-sm font-medium text-background transition hover:scale-[1.03]"
          >
            Open the terrarium
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
      <div className="terrarium-rise pointer-events-auto flex w-[min(440px,90vw)] flex-col gap-5 rounded-2xl bg-card/85 p-7 text-center backdrop-blur-xl">
        <p className="font-serif text-xl italic text-foreground">Every world deserves a name.</p>
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
          Name it
        </button>
      </div>
    </div>
  );
}
