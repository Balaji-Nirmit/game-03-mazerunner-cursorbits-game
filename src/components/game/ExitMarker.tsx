import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ExitMarkerProps {
  position: [number, number, number];
}

const ExitMarker = ({ position }: ExitMarkerProps) => {
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.y = 0.5 + Math.sin(t * 2) * 0.2;
      ref.current.rotation.y = t;
    }
    if (glowRef.current) {
      const s = 1 + Math.sin(t * 3) * 0.15;
      glowRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={position}>
      <mesh ref={glowRef} position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.05, 32]} />
        <meshStandardMaterial color="#4ade80" emissive="#22c55e" emissiveIntensity={0.5} transparent opacity={0.4} />
      </mesh>
      <mesh ref={ref} castShadow>
        <torusKnotGeometry args={[0.25, 0.08, 64, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.6} metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
};

export default ExitMarker;
