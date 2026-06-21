import { useWorld } from "@/game/store";

export function GodActions() {
  const intro = useWorld((s) => s.intro);
  const godAction = useWorld((s) => s.godAction);
  if (intro !== "done") return null;

  const Btn = ({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) => (
    <button
      title={title}
      onClick={onClick}
      className="grid h-11 w-11 place-items-center rounded-full bg-card/80 text-foreground/80 backdrop-blur transition hover:scale-110 hover:bg-card"
    >
      {children}
    </button>
  );

  return (
    <div className="absolute bottom-6 right-5 z-20 flex flex-col gap-2">
      <Btn title="Send rain" onClick={() => godAction("rain")}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 13v8M8 13v8M12 15v8M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>
      </Btn>
      <Btn title="Send a sign" onClick={() => godAction("sign")}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </Btn>
      <Btn title="Withhold" onClick={() => godAction("withhold")}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>
      </Btn>
    </div>
  );
}
