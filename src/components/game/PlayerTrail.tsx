import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PlayerTrailProps {
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

const TRAIL_LENGTH = 30;

const PlayerTrail = ({ playerPositionRef }: PlayerTrailProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const trailRef = useRef<{ x: number; z: number; age: number }[]>([]);
  const lastPosRef = useRef({ x: -999, z: -999 });
  const timerRef = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timerRef.current += delta;

    const pp = playerPositionRef.current;
    const dx = pp.x - lastPosRef.current.x;
    const dz = pp.z - lastPosRef.current.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Drop trail point every ~0.3 units
    if (dist > 0.3) {
      trailRef.current.push({ x: pp.x, z: pp.z, age: 0 });
      lastPosRef.current = { x: pp.x, z: pp.z };
      if (trailRef.current.length > TRAIL_LENGTH) {
        trailRef.current.shift();
      }
    }

    // Age and render
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const point = trailRef.current[i];
      if (point) {
        point.age += delta;
        const fade = Math.max(0, 1 - point.age / 3);
        const s = fade * 0.12;
        dummy.position.set(point.x, 0.02, point.z);
        dummy.scale.set(s, 0.01, s);
      } else {
        dummy.position.set(0, -10, 0);
        dummy.scale.set(0, 0, 0);
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    // Remove old points
    trailRef.current = trailRef.current.filter((p) => p.age < 3);
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, TRAIL_LENGTH]}>
      <sphereGeometry args={[1, 6, 3]} />
      <meshStandardMaterial color="#e8a838" emissive="#d4942a" emissiveIntensity={1.5} transparent opacity={0.6} />
    </instancedMesh>
  );
};

export default PlayerTrail;
