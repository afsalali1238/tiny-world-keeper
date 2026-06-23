import { useWorld } from "@/game/store";
import type { Speed } from "@/game/types";

const OPTIONS: { value: Speed; label: string; icon: string }[] = [
  { value: 0.5, label: "slow", icon: "◐" },
  { value: 1, label: "steady", icon: "●" },
  { value: 4, label: "swift", icon: "⟫" },
];

export function SpeedDial() {
  const intro = useWorld((s) => s.intro);
  const speed = useWorld((s) => s.speed);
  const setSpeed = useWorld((s) => s.setSpeed);
  if (intro !== "done") return null;
  return (
    <div
      className="pointer-events-auto absolute right-5 z-20 flex flex-col items-stretch gap-1 rounded-full bg-card/80 p-1 backdrop-blur shadow-sm safe-offset-top safe-right"
      style={{ ["--safe-top-base" as string]: "5rem" }}
    >
      {OPTIONS.map((o) => {
        const on = speed === o.value;
        return (
          <button
            key={o.value}
            onClick={() => setSpeed(o.value)}
            title={o.label}
            aria-label={`time flows ${o.label}`}
            className={
              "grid h-7 w-9 place-items-center rounded-full font-serif text-sm transition " +
              (on
                ? "bg-accent text-accent-foreground shadow"
                : "text-foreground/55 hover:bg-secondary/70")
            }
          >
            {o.icon}
          </button>
        );
      })}
    </div>
  );
}
