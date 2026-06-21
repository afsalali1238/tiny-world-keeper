import { useEffect, useRef, useState } from "react";
import { useWorld } from "@/game/store";

// Single soft bell tone per combo. WebAudio, no asset.
function bell(ctx: AudioContext, freq: number, gain = 0.18) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.value = 0;
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.6);
  osc.connect(g).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 1.7);
}

const TINT: Record<string, string> = {
  steam: "rgba(220, 235, 240, 0.55)",
  bloom: "rgba(160, 210, 130, 0.55)",
  drought: "rgba(220, 160, 90, 0.55)",
  exodus: "rgba(120, 160, 200, 0.55)",
};

const FILTER: Record<string, string> = {
  steam: "saturate(1.15) brightness(1.05)",
  bloom: "saturate(1.25) brightness(1.06)",
  drought: "saturate(0.55) brightness(0.92) sepia(0.18)",
  exodus: "saturate(0.85) brightness(0.96) hue-rotate(-8deg)",
};

const FIRST_TOAST_TEXT =
  "two gestures, working with each other. there are more.";

export function ComboFlash() {
  const intro = useWorld((s) => s.intro);
  const combo = useWorld((s) => s.recentCombo);
  const clearRecentCombo = useWorld((s) => s.clearRecentCombo);
  const flags = useWorld((s) => s.flags);
  const setFirstSeen = useWorld((s) => s.setComboFirstSeen);

  const [flashKind, setFlashKind] = useState<string | null>(null);
  const [showFirstToast, setShowFirstToast] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastTsRef = useRef(0);

  useEffect(() => {
    if (!combo) return;
    if (combo.ts === lastTsRef.current) return;
    lastTsRef.current = combo.ts;
    setFlashKind(combo.kind);

    // bell tone, gated by audio toggle
    if (useWorld.getState().audioOn) {
      try {
        let ctx = audioCtxRef.current;
        if (!ctx) {
          ctx = new AudioContext();
          audioCtxRef.current = ctx;
        }
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        const freq =
          combo.kind === "drought" ? 220 :
          combo.kind === "bloom" ? 660 :
          combo.kind === "steam" ? 523 : 392;
        bell(ctx, freq);
        if (combo.kind !== "drought") bell(ctx, freq * 1.5, 0.09);
      } catch {
        // ignore
      }
    }

    // first-combo learning toast
    if (!flags["combo:first-toast-seen"]) {
      setShowFirstToast(true);
      setFirstSeen();
      setTimeout(() => setShowFirstToast(false), 6500);
    }

    const t = setTimeout(() => {
      setFlashKind(null);
      clearRecentCombo();
    }, 2400);
    return () => clearTimeout(t);
  }, [combo, clearRecentCombo, flags, setFirstSeen]);

  if (intro !== "done") return null;

  return (
    <>
      {flashKind && (
        <div
          className="pointer-events-none absolute inset-0 z-25 transition-opacity"
          style={{
            background: `radial-gradient(circle at center, transparent 30%, ${TINT[flashKind]} 100%)`,
            animation: "terrarium-combo-flash 2.4s ease-out forwards",
          }}
        />
      )}
      {/* Tint the 3D canvas region during drought/exodus */}
      {flashKind && (FILTER[flashKind]) && (
        <style>{`
          .terrarium-canvas-filter { filter: ${FILTER[flashKind]}; transition: filter 0.6s ease-out; }
        `}</style>
      )}
      {showFirstToast && (
        <div className="pointer-events-none absolute left-1/2 top-20 z-40 -translate-x-1/2 max-w-xs">
          <div className="terrarium-rise rounded-2xl bg-card/95 px-4 py-3 text-center backdrop-blur shadow-md">
            <p className="font-serif text-[10px] uppercase tracking-[0.28em] text-foreground/45">
              ✦  a combination
            </p>
            <p className="mt-1 font-serif text-sm italic text-foreground/85">
              {FIRST_TOAST_TEXT}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
