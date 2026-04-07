import { useRef, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { WallSegment } from "@/lib/mazeGenerator";

interface PlayerProps {
  startPosition: [number, number, number];
  walls: WallSegment[];
  cellSize: number;
  onPositionChange: (x: number, z: number) => void;
  joystickInput?: React.MutableRefObject<{ dx: number; dz: number }>;
}

const SPEED = 5;
const PLAYER_RADIUS = 0.35;

function pushOutOfWalls(
  pos: THREE.Vector3,
  walls: WallSegment[],
  cellSize: number,
  radius: number
): void {
  // Run multiple iterations to resolve overlapping walls
  for (let iter = 0; iter < 3; iter++) {
    for (const wall of walls) {
      const wx = wall.x;
      const wz = wall.z;
      const isVertical = Math.abs(wall.rotationY - Math.PI / 2) < 0.01;
      const halfLen = cellSize / 2;
      const halfThick = 0.15;

      let minX: number, maxX: number, minZ: number, maxZ: number;
      if (isVertical) {
        minX = wx - halfThick - radius;
        maxX = wx + halfThick + radius;
        minZ = wz - halfLen - radius;
        maxZ = wz + halfLen + radius;
      } else {
        minX = wx - halfLen - radius;
        maxX = wx + halfLen + radius;
        minZ = wz - halfThick - radius;
        maxZ = wz + halfThick + radius;
      }

      if (pos.x > minX && pos.x < maxX && pos.z > minZ && pos.z < maxZ) {
        const pushLeft = pos.x - minX;
        const pushRight = maxX - pos.x;
        const pushUp = pos.z - minZ;
        const pushDown = maxZ - pos.z;
        const minPush = Math.min(pushLeft, pushRight, pushUp, pushDown);

        if (minPush === pushLeft) pos.x = minX - 0.01;
        else if (minPush === pushRight) pos.x = maxX + 0.01;
        else if (minPush === pushUp) pos.z = minZ - 0.01;
        else pos.z = maxZ + 0.01;
      }
    }
  }
}

const Player = ({ startPosition, walls, cellSize, onPositionChange, joystickInput }: PlayerProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const posRef = useRef(new THREE.Vector3(...startPosition));
  const keysRef = useRef<Set<string>>(new Set());
  const { camera } = useThree();

  useEffect(() => {
    posRef.current.set(...startPosition);
  }, [startPosition]);

  // When walls change, push player out of any wall they're now inside
  useEffect(() => {
    pushOutOfWalls(posRef.current, walls, cellSize, PLAYER_RADIUS);
  }, [walls, cellSize]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.key.toLowerCase());
  }, []);
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.key.toLowerCase());
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const checkCollision = useCallback((newX: number, newZ: number): boolean => {
    for (const wall of walls) {
      const wx = wall.x;
      const wz = wall.z;
      const isVertical = Math.abs(wall.rotationY - Math.PI / 2) < 0.01;

      if (isVertical) {
        const halfLen = cellSize / 2;
        const halfThick = 0.15;
        if (
          newX > wx - halfThick - PLAYER_RADIUS &&
          newX < wx + halfThick + PLAYER_RADIUS &&
          newZ > wz - halfLen - PLAYER_RADIUS &&
          newZ < wz + halfLen + PLAYER_RADIUS
        ) return true;
      } else {
        const halfLen = cellSize / 2;
        const halfThick = 0.15;
        if (
          newX > wx - halfLen - PLAYER_RADIUS &&
          newX < wx + halfLen + PLAYER_RADIUS &&
          newZ > wz - halfThick - PLAYER_RADIUS &&
          newZ < wz + halfThick + PLAYER_RADIUS
        ) return true;
      }
    }
    return false;
  }, [walls, cellSize]);

  useFrame((_, delta) => {
    const keys = keysRef.current;
    let dx = 0, dz = 0;

    if (keys.has("w") || keys.has("arrowup")) dz -= 1;
    if (keys.has("s") || keys.has("arrowdown")) dz += 1;
    if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
    if (keys.has("d") || keys.has("arrowright")) dx += 1;

    // Merge joystick input
    if (joystickInput?.current) {
      dx += joystickInput.current.dx;
      dz += joystickInput.current.dz;
    }

    if (dx !== 0 || dz !== 0) {
      const len = Math.sqrt(dx * dx + dz * dz);
      dx = (dx / len) * SPEED * delta;
      dz = (dz / len) * SPEED * delta;

      const newX = posRef.current.x + dx;
      const newZ = posRef.current.z + dz;

      if (!checkCollision(newX, newZ)) {
        posRef.current.x = newX;
        posRef.current.z = newZ;
      } else if (!checkCollision(newX, posRef.current.z)) {
        posRef.current.x = newX;
      } else if (!checkCollision(posRef.current.x, newZ)) {
        posRef.current.z = newZ;
      }
    }

    if (meshRef.current) {
      meshRef.current.position.x = posRef.current.x;
      meshRef.current.position.z = posRef.current.z;
      meshRef.current.rotation.y += delta * 2;
    }

    camera.position.set(posRef.current.x, 18, posRef.current.z + 12);
    camera.lookAt(posRef.current.x, 0, posRef.current.z);

    onPositionChange(posRef.current.x, posRef.current.z);
  });

  return (
    <mesh ref={meshRef} position={startPosition} castShadow>
      <octahedronGeometry args={[0.35, 0]} />
      <meshStandardMaterial
        color="#e8a838"
        emissive="#d4942a"
        emissiveIntensity={0.3}
        metalness={0.6}
        roughness={0.3}
      />
    </mesh>
  );
};

export default Player;
