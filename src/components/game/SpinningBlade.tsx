import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playWhoosh } from "@/lib/soundEngine";

interface SpinningBladeProps {
  position: [number, number, number];
  radius?: number;
  speed?: number;
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
  onHitPlayer: () => void;
}

const SpinningBlade = ({ position, radius = 1.5, speed = 2, playerPositionRef, onHitPlayer }: SpinningBladeProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(Math.random() * Math.PI * 2);
  const hitCooldownRef = useRef(0);
  const whooshTimerRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Smooth continuous rotation
    angleRef.current += delta * speed;
    hitCooldownRef.current = Math.max(0, hitCooldownRef.current - delta);
    whooshTimerRef.current += delta;

    const pp2 = playerPositionRef.current;
    const d2 = Math.sqrt((pp2.x - position[0]) ** 2 + (pp2.z - position[2]) ** 2);
    if (d2 < 8 && whooshTimerRef.current > (Math.PI * 2) / speed) {
      whooshTimerRef.current = 0;
      playWhoosh();
    }

    const bx = position[0] + Math.cos(angleRef.current) * radius;
    const bz = position[2] + Math.sin(angleRef.current) * radius;
    groupRef.current.position.set(bx, 0.35, bz);
    // Smooth blade spin
    groupRef.current.rotation.y += delta * speed * 8;

    const pp = playerPositionRef.current;
    const dist = Math.sqrt((pp.x - bx) ** 2 + (pp.z - bz) ** 2);
    if (dist < 0.85 && hitCooldownRef.current <= 0) {
      hitCooldownRef.current = 2;
      onHitPlayer();
    }
  });

  return (
    <group>
      {/* Center post */}
      <mesh position={[position[0], 0.5, position[2]]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 1, 8]} />
        <meshStandardMaterial color="#4a3f33" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Spinning blade assembly */}
      <group ref={groupRef} position={position}>
        <mesh castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.12, 12]} />
          <meshStandardMaterial color="#5c5040" metalness={0.95} roughness={0.1} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, (Math.PI / 2) * i, 0]} castShadow>
            <boxGeometry args={[0.9, 0.06, 0.04]} />
            <meshStandardMaterial color="#a08870" metalness={0.85} roughness={0.15} />
          </mesh>
        ))}
        <pointLight color="#ff5500" intensity={1} distance={2.5} />
      </group>
    </group>
  );
};

export default SpinningBlade;
