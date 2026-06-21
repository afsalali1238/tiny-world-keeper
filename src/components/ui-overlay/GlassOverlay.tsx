import { useEffect, useState } from "react";
import { useWorld } from "@/game/store";

const DURATION_MS = 2600;

export function GlassOverlay() {
  const at = useWorld((s) => s.glassMomentAt);
  const clear = useWorld((s) => s.clearGlassMoment);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!at) return;
    setShow(true);
    const a = setTimeout(() => setShow(false), DURATION_MS - 300);
    const b = setTimeout(() => clear(), DURATION_MS);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [at, clear]);

  if (!show) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-40"
      style={{ animation: `terrarium-glass ${DURATION_MS}ms ease-out both` }}
    >
      {/* curved glass reflection */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 90% at 30% 25%, rgba(255,255,255,0.18), transparent 60%), radial-gradient(ellipse 60% 80% at 75% 70%, rgba(255,255,255,0.10), transparent 65%)",
          mixBlendMode: "screen",
        }}
      />
      {/* dust on the glass */}
      <svg className="absolute inset-0 h-full w-full opacity-40" aria-hidden>
        <circle cx="22%" cy="18%" r="1.2" fill="#fff" />
        <circle cx="68%" cy="34%" r="0.9" fill="#fff" />
        <circle cx="44%" cy="62%" r="1.4" fill="#fff" />
        <circle cx="80%" cy="78%" r="0.8" fill="#fff" />
        <circle cx="14%" cy="72%" r="1.0" fill="#fff" />
      </svg>
      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 55%, transparent 55%, rgba(0,0,0,0.45) 100%)",
        }}
      />
    </div>
  );
}
