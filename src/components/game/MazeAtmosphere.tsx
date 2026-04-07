import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface MazeAtmosphereProps {
  mazeSize: number;
  cellSize: number;
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

const TORCH_LIGHT_COUNT = 8;
const DUST_COUNT = 60;

const MazeAtmosphere = ({ mazeSize, cellSize, playerPositionRef }: MazeAtmosphereProps) => {
  const dustRef = useRef<THREE.InstancedMesh>(null);
  const torchLightsRef = useRef<THREE.Group>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const timeRef = useRef(0);

  const torchPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const total = Math.floor(mazeSize / 3);
    for (let i = 0; i < total && positions.length < TORCH_LIGHT_COUNT; i++) {
      const x = (Math.floor(Math.random() * mazeSize)) * cellSize;
      const z = (Math.floor(Math.random() * mazeSize)) * cellSize;
      positions.push([x, 2.5, z]);
    }
    return positions;
  }, [mazeSize, cellSize]);

  const dustData = useMemo(() => {
    return Array.from({ length: DUST_COUNT }, () => ({
      x: Math.random() * mazeSize * cellSize,
      y: 0.5 + Math.random() * 3,
      z: Math.random() * mazeSize * cellSize,
      speed: 0.1 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.5,
    }));
  }, [mazeSize, cellSize]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    // Animate dust motes
    if (dustRef.current) {
      const pp = playerPositionRef.current;
      for (let i = 0; i < DUST_COUNT; i++) {
        const d = dustData[i];
        const x = d.x + Math.sin(t * d.speed + d.phase) * 1.5;
        const y = d.y + Math.sin(t * 0.5 + d.phase) * 0.3;
        const z = d.z + Math.cos(t * d.speed + d.phase * 0.7) * 1.5 + t * d.drift;

        // Only show particles near the player
        const dist = Math.sqrt((x - pp.x) ** 2 + (z - pp.z) ** 2);
        const visible = dist < 15;

        dummy.position.set(x, y, z);
        const s = visible ? 0.02 + Math.sin(t + d.phase) * 0.01 : 0;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        dustRef.current.setMatrixAt(i, dummy.matrix);
      }
      dustRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Floating dust particles */}
      <instancedMesh ref={dustRef} args={[undefined, undefined, DUST_COUNT]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshStandardMaterial color="#fff8e0" emissive="#fff8e0" emissiveIntensity={2} transparent opacity={0.5} />
      </instancedMesh>

      {/* Torch lights with flicker */}
      <group ref={torchLightsRef}>
        {torchPositions.map((pos, i) => (
          <TorchLight key={i} position={pos} index={i} />
        ))}
      </group>
    </group>
  );
};

// Individual torch with flicker animation
function TorchLight({ position, index }: { position: [number, number, number]; index: number }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const flameRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (lightRef.current) {
      lightRef.current.intensity = 1.5 + Math.sin(t * 8 + index * 2) * 0.5 + Math.sin(t * 13 + index) * 0.3;
    }
    if (flameRef.current) {
      flameRef.current.scale.y = 0.8 + Math.sin(t * 10 + index * 3) * 0.2;
      flameRef.current.scale.x = 0.8 + Math.sin(t * 7 + index) * 0.15;
    }
  });

  return (
    <group position={position}>
      {/* Torch post */}
      <mesh position={[0, -0.8, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 1.6, 6]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.9} />
      </mesh>
      {/* Flame */}
      <mesh ref={flameRef} position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshStandardMaterial color="#ff8800" emissive="#ff6600" emissiveIntensity={4} transparent opacity={0.9} />
      </mesh>
      <pointLight ref={lightRef} color="#ff9944" intensity={1.5} distance={8} decay={2} />
    </group>
  );
}

export default MazeAtmosphere;
