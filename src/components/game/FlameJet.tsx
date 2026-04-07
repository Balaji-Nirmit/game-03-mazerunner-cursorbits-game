import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface FlameJetProps {
  position: [number, number, number];
  interval?: number;
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
  onHitPlayer: () => void;
}

const PARTICLE_COUNT = 24;

const FlameJet = ({ position, interval = 3.5, playerPositionRef, onHitPlayer }: FlameJetProps) => {
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const timerRef = useRef(Math.random() * interval);
  const activeRef = useRef(false);
  const hitCooldownRef = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particleData = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, () => ({
      offset: Math.random() * Math.PI * 2,
      speed: 2 + Math.random() * 3,
      radius: Math.random() * 0.4,
      phase: Math.random(),
    }));
  }, []);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    timerRef.current += delta;
    hitCooldownRef.current = Math.max(0, hitCooldownRef.current - delta);

    const cycleTime = timerRef.current % (interval + 1.5);
    activeRef.current = cycleTime < 1.5;

    const intensity = activeRef.current ? Math.sin((cycleTime / 1.5) * Math.PI) : 0;

    if (lightRef.current) {
      lightRef.current.intensity = intensity * 4;
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particleData[i];
      if (activeRef.current) {
        const t = ((cycleTime * p.speed + p.phase) % 1);
        const y = t * 4;
        const spread = t * p.radius;
        dummy.position.set(
          position[0] + Math.sin(p.offset + cycleTime * 3) * spread,
          y,
          position[2] + Math.cos(p.offset + cycleTime * 3) * spread
        );
        const s = (1 - t) * 0.15;
        dummy.scale.set(s, s, s);
      } else {
        dummy.position.set(0, -10, 0);
        dummy.scale.set(0, 0, 0);
      }
      dummy.updateMatrix();
      particlesRef.current.setMatrixAt(i, dummy.matrix);
    }
    particlesRef.current.instanceMatrix.needsUpdate = true;

    // Player collision when active
    if (activeRef.current && hitCooldownRef.current <= 0) {
      const pp = playerPositionRef.current;
      const dist = Math.sqrt((pp.x - position[0]) ** 2 + (pp.z - position[2]) ** 2);
      if (dist < 1.0) {
        hitCooldownRef.current = 2;
        onHitPlayer();
      }
    }
  });

  return (
    <group>
      {/* Base grate */}
      <mesh position={[position[0], 0.05, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.45, 8]} />
        <meshStandardMaterial color="#3d3d3d" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Flame particles */}
      <instancedMesh ref={particlesRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff3300" emissiveIntensity={3} transparent opacity={0.8} />
      </instancedMesh>

      <pointLight ref={lightRef} position={[position[0], 2, position[2]]} color="#ff4400" intensity={0} distance={6} />
    </group>
  );
};

export default FlameJet;
