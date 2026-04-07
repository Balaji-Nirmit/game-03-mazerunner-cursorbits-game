import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SpikeTrapProps {
  position: [number, number, number];
  interval?: number;
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
  onHitPlayer: () => void;
}

const SPIKE_COUNT = 5;

const SpikeTrap = ({ position, interval = 4, playerPositionRef, onHitPlayer }: SpikeTrapProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const timerRef = useRef(Math.random() * interval);
  const yRef = useRef(-0.5);
  const stateRef = useRef<"hidden" | "rising" | "up" | "falling">("hidden");
  const hitCooldownRef = useRef(0);

  const spikeOffsets = useMemo(() => {
    return Array.from({ length: SPIKE_COUNT }, () => ({
      x: (Math.random() - 0.5) * 0.8,
      z: (Math.random() - 0.5) * 0.8,
      h: 0.6 + Math.random() * 0.4,
    }));
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timerRef.current += delta;
    hitCooldownRef.current = Math.max(0, hitCooldownRef.current - delta);
    const state = stateRef.current;

    if (state === "hidden" && timerRef.current > interval) {
      stateRef.current = "rising";
      timerRef.current = 0;
    } else if (state === "rising") {
      yRef.current += delta * 8;
      if (yRef.current >= 0.6) {
        yRef.current = 0.6;
        stateRef.current = "up";
        timerRef.current = 0;
      }
    } else if (state === "up") {
      if (timerRef.current > 1.2) {
        stateRef.current = "falling";
        timerRef.current = 0;
      }
      // Check player
      if (hitCooldownRef.current <= 0) {
        const pp = playerPositionRef.current;
        const dist = Math.sqrt((pp.x - position[0]) ** 2 + (pp.z - position[2]) ** 2);
        if (dist < 0.8) {
          hitCooldownRef.current = 2;
          onHitPlayer();
        }
      }
    } else if (state === "falling") {
      yRef.current -= delta * 4;
      if (yRef.current <= -0.5) {
        yRef.current = -0.5;
        stateRef.current = "hidden";
        timerRef.current = 0;
      }
    }

    groupRef.current.position.set(position[0], yRef.current, position[2]);
  });

  return (
    <group ref={groupRef} position={[position[0], -0.5, position[2]]}>
      {/* Base plate */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 8]} />
        <meshStandardMaterial color="#4a3828" roughness={0.8} />
      </mesh>
      {/* Spikes */}
      {spikeOffsets.map((s, i) => (
        <mesh key={i} position={[s.x, s.h / 2, s.z]} castShadow>
          <coneGeometry args={[0.06, s.h, 4]} />
          <meshStandardMaterial color="#8a8a8a" metalness={0.95} roughness={0.1} />
        </mesh>
      ))}
    </group>
  );
};

export default SpikeTrap;
