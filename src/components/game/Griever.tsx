import { useRef, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { WallSegment } from "@/lib/mazeGenerator";
import { playGrieverSound, startHeartbeat, stopHeartbeat } from "@/lib/soundEngine";

interface GrieverProps {
  startPosition: [number, number, number];
  walls: WallSegment[];
  cellSize: number;
  speed: number;
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
  onCatchPlayer: () => void;
  id: number;
}

const GRIEVER_RADIUS = 0.5;
const CATCH_DISTANCE = 1.0;

// Raycast-style check: is there a wall between two points?
function isWallBetween(
  from: THREE.Vector3,
  to: THREE.Vector3,
  walls: WallSegment[],
  cellSize: number
): boolean {
  const steps = Math.ceil(from.distanceTo(to) / 0.5);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = from.x + (to.x - from.x) * t;
    const pz = from.z + (to.z - from.z) * t;
    if (checkPointCollision(px, pz, walls, cellSize, 0.1)) {
      return true;
    }
  }
  return false;
}

function checkPointCollision(
  px: number,
  pz: number,
  walls: WallSegment[],
  cellSize: number,
  radius: number
): boolean {
  for (const wall of walls) {
    const wx = wall.x;
    const wz = wall.z;
    const isVertical = Math.abs(wall.rotationY - Math.PI / 2) < 0.01;
    const halfLen = cellSize / 2;
    const halfThick = 0.15;

    if (isVertical) {
      if (
        px > wx - halfThick - radius &&
        px < wx + halfThick + radius &&
        pz > wz - halfLen - radius &&
        pz < wz + halfLen + radius
      ) return true;
    } else {
      if (
        px > wx - halfLen - radius &&
        px < wx + halfLen + radius &&
        pz > wz - halfThick - radius &&
        pz < wz + halfThick + radius
      ) return true;
    }
  }
  return false;
}

// Push an entity out of any wall it's inside
function pushOutOfWalls(
  pos: THREE.Vector3,
  walls: WallSegment[],
  cellSize: number,
  radius: number
): void {
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
      // Find the smallest push direction
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

const Griever = ({ startPosition, walls, cellSize, speed, playerPositionRef, onCatchPlayer, id }: GrieverProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const posRef = useRef(new THREE.Vector3(...startPosition));
  const dirRef = useRef(new THREE.Vector3(
    Math.random() > 0.5 ? 1 : -1,
    0,
    Math.random() > 0.5 ? 1 : -1
  ).normalize());
  const changeTimerRef = useRef(0);
  const stuckCounterRef = useRef(0);

  const screechTimerRef = useRef(0);
  const wasNearRef = useRef(false);

  // When walls change, push Griever out of any wall it's now inside
  useEffect(() => {
    pushOutOfWalls(posRef.current, walls, cellSize, GRIEVER_RADIUS);
  }, [walls, cellSize]);

  useEffect(() => {
    posRef.current.set(...startPosition);
  }, [startPosition]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const pos = posRef.current;
    const dir = dirRef.current;
    const playerPos = playerPositionRef.current;

    const toPlayer = new THREE.Vector3().subVectors(playerPos, pos);
    const distToPlayer = toPlayer.length();

    changeTimerRef.current += delta;
    screechTimerRef.current += delta;

    // Heartbeat when griever is near
    const isNear = distToPlayer < 6;
    if (isNear && !wasNearRef.current) {
      startHeartbeat(distToPlayer < 3 ? 160 : 110);
    } else if (!isNear && wasNearRef.current) {
      stopHeartbeat();
    }
    wasNearRef.current = isNear;

    // Griever screech when chasing
    if (distToPlayer < 8 && screechTimerRef.current > 3 + Math.random() * 2) {
      screechTimerRef.current = 0;
      playGrieverSound();
    }

    // Change direction periodically or when stuck
    const shouldChangeDir = changeTimerRef.current > 1.2 + Math.random() * 1.5 || stuckCounterRef.current > 5;

    if (shouldChangeDir) {
      changeTimerRef.current = 0;
      stuckCounterRef.current = 0;

      const playerVec = new THREE.Vector3(toPlayer.x, 0, toPlayer.z);

      // Only chase if no wall between griever and player
      const canSeePlayer = distToPlayer < 10 && !isWallBetween(pos, playerPos, walls, cellSize);

      if (canSeePlayer) {
        // Direct chase - player is visible
        dir.copy(playerVec).normalize();
        dir.x += (Math.random() - 0.5) * 0.15;
        dir.z += (Math.random() - 0.5) * 0.15;
        dir.normalize();
      } else {
        // Wander - pick random cardinal-ish direction (better for maze navigation)
        const directions = [
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(-1, 0, 0),
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(0, 0, -1),
        ];
        // Filter to directions that aren't immediately blocked
        const validDirs = directions.filter((d) => {
          const testX = pos.x + d.x * 0.8;
          const testZ = pos.z + d.z * 0.8;
          return !checkPointCollision(testX, testZ, walls, cellSize, GRIEVER_RADIUS);
        });

        if (validDirs.length > 0) {
          // Slightly bias toward player direction even when wandering
          if (distToPlayer < 15) {
            const biased = validDirs.sort((a, b) => {
              const da = new THREE.Vector3().subVectors(playerVec.clone().normalize(), a).length();
              const db = new THREE.Vector3().subVectors(playerVec.clone().normalize(), b).length();
              return da - db;
            });
            // 60% chance to pick best direction, 40% random
            dir.copy(Math.random() < 0.6 ? biased[0] : validDirs[Math.floor(Math.random() * validDirs.length)]);
          } else {
            dir.copy(validDirs[Math.floor(Math.random() * validDirs.length)]);
          }
        } else {
          // All blocked - try diagonal
          const angle = Math.random() * Math.PI * 2;
          dir.set(Math.cos(angle), 0, Math.sin(angle));
        }
      }
    }

    const moveSpeed = distToPlayer < 6 && !isWallBetween(pos, playerPos, walls, cellSize)
      ? speed * 1.3
      : speed;

    const newX = pos.x + dir.x * moveSpeed * delta;
    const newZ = pos.z + dir.z * moveSpeed * delta;

    if (!checkPointCollision(newX, newZ, walls, cellSize, GRIEVER_RADIUS)) {
      pos.x = newX;
      pos.z = newZ;
      stuckCounterRef.current = 0;
    } else if (!checkPointCollision(newX, pos.z, walls, cellSize, GRIEVER_RADIUS)) {
      pos.x = newX;
      stuckCounterRef.current++;
    } else if (!checkPointCollision(pos.x, newZ, walls, cellSize, GRIEVER_RADIUS)) {
      pos.z = newZ;
      stuckCounterRef.current++;
    } else {
      stuckCounterRef.current += 2;
    }

    // Update visual
    groupRef.current.position.set(pos.x, 0, pos.z);
    groupRef.current.rotation.y = Math.atan2(dir.x, dir.z);

    // Check if caught player
    if (distToPlayer < CATCH_DISTANCE) {
      onCatchPlayer();
    }
  });

  const bodyY = 0.6;

  return (
    <group ref={groupRef} position={startPosition}>
      {/* Main body */}
      <mesh position={[0, bodyY, 0]} castShadow>
        <sphereGeometry args={[0.45, 12, 10]} />
        <meshStandardMaterial color="#3d3428" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Exoskeleton plates */}
      <mesh position={[0, bodyY + 0.15, 0.1]} castShadow>
        <sphereGeometry args={[0.35, 8, 6]} />
        <meshStandardMaterial color="#4a3d2e" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Glowing red eyes */}
      <mesh position={[-0.15, bodyY + 0.15, 0.35]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.15, bodyY + 0.15, 0.35]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
      </mesh>

      {/* Stinger tail */}
      <mesh position={[0, bodyY + 0.1, -0.5]} rotation={[-0.5, 0, 0]} castShadow>
        <coneGeometry args={[0.12, 0.6, 6]} />
        <meshStandardMaterial color="#2a2218" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Mechanical legs */}
      {[-1, 1].map((side) =>
        [0, 1, 2].map((legIdx) => {
          const zOff = (legIdx - 1) * 0.25;
          return (
            <group key={`${side}-${legIdx}`} position={[side * 0.35, 0.25, zOff]}>
              <mesh rotation={[0, 0, side * 0.8]} castShadow>
                <cylinderGeometry args={[0.03, 0.02, 0.5, 4]} />
                <meshStandardMaterial color="#2a2218" metalness={0.8} roughness={0.3} />
              </mesh>
            </group>
          );
        })
      )}

      {/* Mandibles */}
      <mesh position={[-0.12, bodyY - 0.05, 0.4]} rotation={[0.3, 0.2, 0]}>
        <coneGeometry args={[0.04, 0.2, 4]} />
        <meshStandardMaterial color="#1a1510" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.12, bodyY - 0.05, 0.4]} rotation={[0.3, -0.2, 0]}>
        <coneGeometry args={[0.04, 0.2, 4]} />
        <meshStandardMaterial color="#1a1510" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Eerie glow */}
      <pointLight position={[0, 0.3, 0]} color="#ff3300" intensity={1.5} distance={4} />
    </group>
  );
};

export default Griever;
