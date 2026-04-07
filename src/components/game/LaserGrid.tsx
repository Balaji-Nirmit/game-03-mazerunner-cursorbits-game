import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface LaserGridProps {
  position: [number, number, number];
  direction: "x" | "z";
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
  onHitPlayer: () => void;
}

const LaserGrid = ({ position, direction, playerPositionRef, onHitPlayer }: LaserGridProps) => {
  const beamRef = useRef<THREE.Mesh>(null);
  const timerRef = useRef(Math.random() * 6);
  const hitCooldownRef = useRef(0);
  const activeRef = useRef(true);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    timerRef.current += delta;
    hitCooldownRef.current = Math.max(0, hitCooldownRef.current - delta);

    // Toggle on/off cycle
    const cycle = timerRef.current % 5;
    activeRef.current = cycle < 3.5;

    if (beamRef.current) {
      const opacity = activeRef.current ? 0.7 + Math.sin(timerRef.current * 12) * 0.3 : 0;
      (beamRef.current.material as THREE.MeshStandardMaterial).opacity = opacity;
      beamRef.current.visible = activeRef.current;
    }

    if (glowRef.current) {
      glowRef.current.intensity = activeRef.current ? 2 + Math.sin(timerRef.current * 12) : 0;
    }

    // Collision
    if (activeRef.current && hitCooldownRef.current <= 0) {
      const pp = playerPositionRef.current;
      if (direction === "x") {
        if (Math.abs(pp.z - position[2]) < 0.5 && Math.abs(pp.x - position[0]) < 1.5) {
          hitCooldownRef.current = 2;
          onHitPlayer();
        }
      } else {
        if (Math.abs(pp.x - position[0]) < 0.5 && Math.abs(pp.z - position[2]) < 1.5) {
          hitCooldownRef.current = 2;
          onHitPlayer();
        }
      }
    }
  });

  const len = 2.8;
  const rot: [number, number, number] = direction === "x" ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0];

  return (
    <group>
      {/* Emitter posts */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[
            position[0] + (direction === "x" ? side * len / 2 : 0),
            0.4,
            position[2] + (direction === "z" ? side * len / 2 : 0),
          ]}
          castShadow
        >
          <cylinderGeometry args={[0.08, 0.08, 0.8, 6]} />
          <meshStandardMaterial color="#555" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* Laser beam */}
      <mesh ref={beamRef} position={[position[0], 0.4, position[2]]} rotation={rot}>
        <cylinderGeometry args={[0.03, 0.03, len, 6]} />
        <meshStandardMaterial
          color="#ff0033"
          emissive="#ff0033"
          emissiveIntensity={5}
          transparent
          opacity={0.8}
        />
      </mesh>

      <pointLight ref={glowRef} position={[position[0], 0.4, position[2]]} color="#ff0033" intensity={2} distance={4} />
    </group>
  );
};

export default LaserGrid;
