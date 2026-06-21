import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { Suspense } from "react";
import { Planet } from "./Planet";
import { Clouds } from "./Clouds";
import { Aurora } from "./Aurora";
import { SunLight } from "./SunLight";
import { useWorld } from "@/game/store";

function TickDriver() {
  const tick = useWorld((s) => s.tick);
  useFrame((_, dt) => tick(dt));
  return null;
}

export function TerrariumScene() {
  const intro = useWorld((s) => s.intro);
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.6, 3.4], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <SunLight />
        <Planet cold={intro === "gift"} />
        {intro !== "gift" && <Clouds />}
        {intro === "done" && <Aurora />}
        <ContactShadows position={[0, -1.25, 0]} opacity={0.35} scale={4} blur={2.6} far={2} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableDamping
          dampingFactor={0.08}
          autoRotate={false}
          rotateSpeed={0.6}
        />
        <TickDriver />
      </Suspense>
    </Canvas>
  );
}
