import { useWorld } from "@/game/store";

export function MythFeed() {
  const myths = useWorld((s) => s.myths);
  const visible = myths.slice(0, 3);
  if (!visible.length) return null;
  const latest = visible[0];
  return (
    <>
      {/* Mobile: a single compact myth pill at the top, so the side stack
          never dominates a narrow screen or collides with the narrator. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-3 safe-offset-top safe-x md:hidden" style={{ ["--safe-top-base" as string]: "4.5rem" }}>
        <div
          key={latest.id + latest.createdAt}
          className="terrarium-rise w-[min(22rem,86vw)] rounded-2xl bg-card/85 px-4 py-2.5 backdrop-blur-xl shadow-sm"
        >
          <p className="mb-0.5 font-serif text-[9px] uppercase tracking-[0.25em] text-accent">
            {latest.tag}
          </p>
          <p className="font-serif text-[13px] italic leading-snug text-foreground/85 line-clamp-3">
            {latest.text}
          </p>
        </div>
      </div>

      {/* Desktop / tablet: the original three-card side stack. */}
      <div className="pointer-events-none absolute right-5 top-1/2 z-20 hidden w-[min(320px,80vw)] -translate-y-1/2 flex-col gap-3 md:flex">
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
    </>
  );
}
