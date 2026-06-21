import { useWorld } from "@/game/store";
import type { Speed } from "@/game/types";

const OPTIONS: { value: Speed; label: string }[] = [
  { value: 0.5, label: "½×" },
  { value: 1, label: "1×" },
  { value: 4, label: "4×" },
];

export function SpeedDial() {
  const intro = useWorld((s) => s.intro);
  const speed = useWorld((s) => s.speed);
  const setSpeed = useWorld((s) => s.setSpeed);
  if (intro !== "done") return null;
  return (
    <div className="pointer-events-auto absolute right-5 top-20 z-20 flex flex-col items-stretch gap-1 rounded-full bg-card/80 p-1 backdrop-blur shadow-sm">
      {OPTIONS.map((o) => {
        const on = speed === o.value;
        return (
          <button
            key={o.value}
            onClick={() => setSpeed(o.value)}
            title={`time flows at ${o.label}`}
            className={
              "h-7 w-9 rounded-full font-serif text-xs italic transition " +
              (on
                ? "bg-accent text-accent-foreground shadow"
                : "text-foreground/55 hover:bg-secondary/70")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
