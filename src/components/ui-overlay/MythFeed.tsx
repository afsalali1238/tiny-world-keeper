import { useWorld } from "@/game/store";

export function MythFeed() {
  const myths = useWorld((s) => s.myths);
  const visible = myths.slice(0, 3);
  if (!visible.length) return null;
  return (
    <div className="pointer-events-none absolute right-5 top-1/2 z-20 flex w-[min(320px,80vw)] -translate-y-1/2 flex-col gap-3">
      {visible.map((m, i) => (
        <div
          key={m.id + m.createdAt}
          className="terrarium-rise rounded-2xl bg-card/80 p-4 backdrop-blur-xl"
          style={{ opacity: 1 - i * 0.25 }}
        >
          <p className="mb-1 font-serif text-[10px] uppercase tracking-[0.25em] text-accent">
            {m.tag}
          </p>
          <p className="font-serif text-sm italic leading-relaxed text-foreground/85">{m.text}</p>
        </div>
      ))}
    </div>
  );
}
