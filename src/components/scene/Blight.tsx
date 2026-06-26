import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorld } from "@/game/store";

export function Blight() {
  const blightNodes = useWorld((s) => s.blightNodes);

  if (!blightNodes || blightNodes.length === 0) return null;

  return (
    <group>
      {blightNodes.map((node) => (
        <BlightCluster key={node.id} pos={node.pos} size={node.size} />
      ))}
    </group>
  );
}

function BlightCluster({ pos, size }: { pos: [number, number, number]; size: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Pulsate slightly
    const scale = Math.max(0.1, size) * (1 + 0.1 * Math.sin(t * 3));
    groupRef.current.scale.setScalar(scale);
    
    // Rotate slowly
    groupRef.current.rotation.y += 0.01;
    groupRef.current.rotation.z += 0.005;
  });

  // Calculate rotation to face away from planet center
  const vPos = new THREE.Vector3(...pos);
  vPos.normalize().multiplyScalar(10.1); // slightly above surface (planet radius is 10)

  // A thorny cluster made of a few scaled tetrahedrons
  return (
    <group ref={groupRef} position={vPos} lookAt={() => new THREE.Vector3(0, 0, 0)}>
      <pointLight color="#8a2be2" distance={8} intensity={0.8} />
      <mesh position={[0, 0, 0]} castShadow>
        <tetrahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial ref={materialRef} color="#1a0b1c" roughness={0.9} />
      </mesh>
      <mesh position={[0.2, 0.2, 0]} rotation={[1, 0.5, 0]} castShadow>
        <tetrahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial color="#2d1131" roughness={0.9} />
      </mesh>
      <mesh position={[-0.2, -0.1, 0.1]} rotation={[-1, -0.5, 1]} castShadow>
        <tetrahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color="#1a0b1c" roughness={0.9} />
      </mesh>
    </group>
  );
}
