import { useMemo } from "react";

interface Doodle {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  drift: number;
  delay: number;
  kind: number;
}

const KINDS = [
  // squiggle
  <path d="M2 10 Q 6 2, 10 10 T 18 10" />,
  // tiny cloud
  <path d="M3 12 Q 3 7, 8 7 Q 10 3, 14 6 Q 19 6, 18 12 Z" />,
  // sparkle
  <path d="M10 2 L11 9 L18 10 L11 11 L10 18 L9 11 L2 10 L9 9 Z" />,
  // bird
  <path d="M2 10 Q 6 6, 10 10 Q 14 6, 18 10" />,
  // circle
  <circle cx="10" cy="10" r="6" />,
  // little O
  <circle cx="10" cy="10" r="3" />,
];

export function BackgroundDoodles() {
  const doodles = useMemo<Doodle[]>(() => {
    const arr: Doodle[] = [];
    let seed = 1337;
    const r = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 16; i++) {
      arr.push({
        x: r() * 100,
        y: r() * 100,
        scale: 0.7 + r() * 1.4,
        rotation: r() * 360,
        drift: 6 + r() * 10,
        delay: r() * 8,
        kind: Math.floor(r() * KINDS.length),
      });
    }
    return arr;
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {doodles.map((d, i) => (
        <svg
          key={i}
          width="40"
          height="40"
          viewBox="0 0 20 20"
          fill="none"
          stroke="rgba(20, 50, 50, 0.22)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: "absolute",
            left: `${d.x}%`,
            top: `${d.y}%`,
            transform: `rotate(${d.rotation}deg) scale(${d.scale})`,
            animation: `terrarium-doodle-drift ${d.drift}s ease-in-out ${d.delay}s infinite alternate`,
          }}
        >
          {KINDS[d.kind]}
        </svg>
      ))}
    </div>
  );
}
