import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface MazeWallProps {
  position: [number, number, number];
  rotation: [number, number, number];
  cellSize: number;
  wallHeight: number;
  isNew?: boolean;
  isRemoving?: boolean;
}

const MazeWall = ({ position, rotation, cellSize, wallHeight, isNew, isRemoving }: MazeWallProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(isNew ? 0 : 1);
  const targetScale = isRemoving ? 0 : 1;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    scaleRef.current += (targetScale - scaleRef.current) * Math.min(delta * 3, 1);
    meshRef.current.scale.y = Math.max(0.001, scaleRef.current);
    meshRef.current.position.y = (wallHeight / 2) * scaleRef.current;
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[cellSize, wallHeight, 0.3]} />
      <meshStandardMaterial
        color="#c4a882"
        roughness={0.8}
        metalness={0.05}
      />
    </mesh>
  );
};

export default MazeWall;
