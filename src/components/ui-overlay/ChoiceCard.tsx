import { CHOICE_CARDS } from "@/game/choices";
import { useWorld } from "@/game/store";

export function ChoiceCard() {
  const id = useWorld((s) => s.activeChoiceId);
  const resolve = useWorld((s) => s.resolveChoice);
  const intro = useWorld((s) => s.intro);
  if (!id || intro !== "done") return null;
  const card = CHOICE_CARDS.find((c) => c.id === id);
  if (!card) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex justify-center px-4">
      <div className="terrarium-rise pointer-events-auto flex w-[min(560px,92vw)] flex-col gap-4 rounded-2xl bg-card/85 p-6 text-center shadow-[0_8px_40px_-12px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <div>
          <p className="font-serif text-lg italic text-foreground">{card.prompt}</p>
          {card.sub && (
            <p className="mt-1 font-serif text-sm italic text-foreground/60">{card.sub}</p>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {card.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => resolve(opt)}
              className={
                opt.ghost
                  ? "rounded-full border border-border bg-background/40 px-4 py-2 text-sm font-serif italic text-foreground/70 transition hover:bg-background/80"
                  : "rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:scale-[1.04]"
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
