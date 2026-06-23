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
    <div className="pointer-events-none absolute inset-x-0 bottom-32 sm:bottom-44 z-30 flex justify-center px-3">
      <div className="terrarium-rise pointer-events-auto flex w-[min(560px,94vw)] flex-col gap-3 rounded-2xl bg-card/90 p-4 sm:p-5 text-center shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <div>
          <p className="font-serif text-base sm:text-lg italic text-foreground">{card.prompt}</p>
          {card.sub && (
            <p className="mt-1 font-serif text-xs sm:text-sm italic text-foreground/60">{card.sub}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center gap-2">
          {card.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => resolve(opt)}
              className={
                "w-full sm:w-auto px-4 py-2 text-sm transition " +
                (opt.ghost
                  ? "rounded-full border border-border bg-background/40 font-serif italic text-foreground/70 hover:bg-background/80"
                  : "rounded-full bg-foreground font-medium text-background hover:scale-[1.04]")
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
