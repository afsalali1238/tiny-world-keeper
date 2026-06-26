import { useWorld } from "@/game/store";
import { Html } from "@react-three/drei";

export function Prayers() {
  const prayers = useWorld((s) => s.prayers);

  return (
    <group>
      {prayers.map((prayer) => {
        // Calculate age for fading
        const ageMs = Date.now() - prayer.bornAt;
        const progress = Math.min(1, ageMs / 5000);
        
        // Rise up slowly
        const position = [
          prayer.pos[0],
          prayer.pos[1] + progress * 2.0, // float upwards
          prayer.pos[2]
        ] as [number, number, number];

        // Fade out
        const opacity = Math.max(0, 1 - progress * 1.5);

        return (
          <Html
            key={prayer.id}
            position={position}
            center
            style={{
              pointerEvents: "none",
              opacity,
              transition: "opacity 0.1s ease-out",
            }}
          >
            <div className="font-serif text-xs italic text-foreground/80 whitespace-nowrap bg-background/30 px-2 py-1 rounded-full backdrop-blur-sm drop-shadow-sm">
              {prayer.text}
            </div>
          </Html>
        );
      })}
    </group>
  );
}
