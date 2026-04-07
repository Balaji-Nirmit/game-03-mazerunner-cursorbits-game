import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playSlam } from "@/lib/soundEngine";

interface CrushingPillarProps {
  position: [number, number, number];
  interval?: number;
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
  onCrushPlayer: () => void;
}

const CrushingPillar = ({ position, interval = 3, playerPositionRef, onCrushPlayer }: CrushingPillarProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const timerRef = useRef(Math.random() * interval);
  const stateRef = useRef<"up" | "slamming" | "down" | "rising">("up");
  const yRef = useRef(5);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timerRef.current += delta;

    const state = stateRef.current;

    if (state === "up" && timerRef.current > interval) {
      stateRef.current = "slamming";
      timerRef.current = 0;
    } else if (state === "slamming") {
      // Smooth eased slam (accelerating)
      yRef.current -= delta * (25 - yRef.current * 3);
      if (yRef.current <= 0.6) {
        yRef.current = 0.6;
        stateRef.current = "down";
        timerRef.current = 0;
        playSlam();

        const pp = playerPositionRef.current;
        const dist = Math.sqrt((pp.x - position[0]) ** 2 + (pp.z - position[2]) ** 2);
        if (dist < 1.0) {
          onCrushPlayer();
        }
      }
    } else if (state === "down" && timerRef.current > 0.5) {
      stateRef.current = "rising";
    } else if (state === "rising") {
      // Smooth eased rise (decelerating)
      const t = (yRef.current - 0.6) / (5 - 0.6);
      const riseSpeed = 2 + (1 - t) * 3;
      yRef.current += delta * riseSpeed;
      if (yRef.current >= 5) {
        yRef.current = 5;
        stateRef.current = "up";
        timerRef.current = 0;
      }
    }

    meshRef.current.position.set(position[0], yRef.current, position[2]);
  });

  return (
    <group>
      {/* Pillar */}
      <mesh ref={meshRef} position={[position[0], 5, position[2]]} castShadow>
        <boxGeometry args={[1.3, 1.5, 1.3]} />
        <meshStandardMaterial color="#5a4d40" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  );
};

export default CrushingPillar;
