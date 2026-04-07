import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { startGrinding, stopGrinding } from "@/lib/soundEngine";
import type { WallSegment } from "@/lib/mazeGenerator";

interface MovingWallProps {
  startPosition: [number, number, number];
  endPosition: [number, number, number];
  speed?: number;
  wallHeight?: number;
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
  onHitPlayer: () => void;
  walls: WallSegment[];
  cellSize: number;
}

const WALL_THICKNESS = 0.4;
const WALL_LENGTH = 2.8;

function isBlockedByWall(x: number, z: number, walls: WallSegment[], cellSize: number): boolean {
  const pr = 0.35;
  for (const wall of walls) {
    const halfLen = cellSize / 2;
    const halfThick = 0.15;
    let minX: number, maxX: number, minZ: number, maxZ: number;
    if (Math.abs(wall.rotationY) < 0.01) {
      minX = wall.x - halfLen; maxX = wall.x + halfLen;
      minZ = wall.z - halfThick; maxZ = wall.z + halfThick;
    } else {
      minX = wall.x - halfThick; maxX = wall.x + halfThick;
      minZ = wall.z - halfLen; maxZ = wall.z + halfLen;
    }
    if (x > minX - pr && x < maxX + pr && z > minZ - pr && z < maxZ + pr) {
      return true;
    }
  }
  return false;
}

const MovingWall = ({ startPosition, endPosition, speed = 1.5, wallHeight = 3.5, playerPositionRef, onHitPlayer, walls, cellSize }: MovingWallProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(Math.random());
  const dirRef = useRef(1);
  const grindingRef = useRef(false);

  useEffect(() => {
    startGrinding();
    grindingRef.current = true;
    return () => { stopGrinding(); grindingRef.current = false; };
  }, []);

  const dx = endPosition[0] - startPosition[0];
  const dz = endPosition[2] - startPosition[2];
  const isMovingX = Math.abs(dx) > Math.abs(dz);
  const rotY = isMovingX ? Math.PI / 2 : 0;

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Smooth sinusoidal easing for wall movement
    tRef.current += delta * speed * 0.3 * dirRef.current;
    if (tRef.current >= 1) { tRef.current = 1; dirRef.current = -1; }
    if (tRef.current <= 0) { tRef.current = 0; dirRef.current = 1; }

    // Ease in-out for smoother movement
    const eased = tRef.current * tRef.current * (3 - 2 * tRef.current);
    const wx = startPosition[0] + dx * eased;
    const wz = startPosition[2] + dz * eased;
    meshRef.current.position.set(wx, wallHeight / 2, wz);

    // Check player collision
    const pp = playerPositionRef.current;
    const halfLen = WALL_LENGTH / 2;
    const halfThick = WALL_THICKNESS / 2;
    const pr = 0.35;

    let minX: number, maxX: number, minZ: number, maxZ: number;
    if (isMovingX) {
      minX = wx - halfThick; maxX = wx + halfThick;
      minZ = wz - halfLen; maxZ = wz + halfLen;
    } else {
      minX = wx - halfLen; maxX = wx + halfLen;
      minZ = wz - halfThick; maxZ = wz + halfThick;
    }

    if (pp.x > minX - pr && pp.x < maxX + pr && pp.z > minZ - pr && pp.z < maxZ + pr) {
      let pushX = pp.x;
      let pushZ = pp.z;
      if (isMovingX) {
        pushX = dirRef.current > 0 ? maxX + pr + 0.05 : minX - pr - 0.05;
      } else {
        pushZ = dirRef.current > 0 ? maxZ + pr + 0.05 : minZ - pr - 0.05;
      }

      if (isBlockedByWall(pushX, pushZ, walls, cellSize)) {
        onHitPlayer();
      } else {
        pp.x = pushX;
        pp.z = pushZ;
      }
    }
  });

  return (
    <mesh ref={meshRef} position={[startPosition[0], wallHeight / 2, startPosition[2]]} rotation={[0, rotY, 0]} castShadow receiveShadow>
      <boxGeometry args={[WALL_LENGTH, wallHeight, WALL_THICKNESS]} />
      <meshStandardMaterial color="#7a6b5a" roughness={0.5} metalness={0.4} />
    </mesh>
  );
};

export default MovingWall;
