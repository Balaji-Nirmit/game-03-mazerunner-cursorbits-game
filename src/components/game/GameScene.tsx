import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import MazeWall from "./MazeWall";
import Player from "./Player";
import ExitMarker from "./ExitMarker";
import Griever from "./Griever";
import SpinningBlade from "./SpinningBlade";
import CrushingPillar from "./CrushingPillar";
import MovingWall from "./MovingWall";
import FlameJet from "./FlameJet";
import SpikeTrap from "./SpikeTrap";
import LaserGrid from "./LaserGrid";
import MazeAtmosphere from "./MazeAtmosphere";
import PlayerTrail from "./PlayerTrail";
import { generateMaze, getWallSegments, type WallSegment, type MazeGrid } from "@/lib/mazeGenerator";
import * as THREE from "three";

const CELL_SIZE = 3;
const WALL_HEIGHT = 3.5;

function getMazeConfig(level: number) {
  const size = Math.min(12 + Math.floor(level * 2), 28);
  const shiftInterval = Math.max(10 - level, 4);
  const grieverCount = Math.min(3 + Math.floor(level * 1.2), 12);
  const grieverSpeed = Math.min(2.2 + level * 0.3, 5);
  const bladeCount = Math.min(3 + Math.floor(level * 1), 10);
  const pillarCount = Math.min(2 + Math.floor(level * 0.8), 8);
  const movingWallCount = Math.min(3 + Math.floor(level * 1), 10);
  const flameJetCount = Math.min(2 + Math.floor(level * 0.8), 8);
  const spikeTrapCount = Math.min(2 + Math.floor(level * 0.7), 7);
  const laserGridCount = Math.min(1 + Math.floor(level * 0.6), 6);
  return { size, shiftInterval, grieverCount, grieverSpeed, bladeCount, pillarCount, movingWallCount, flameJetCount, spikeTrapCount, laserGridCount };
}

function getRandomOpenCell(grid: MazeGrid, cellSize: number, excludeX = 0, excludeZ = 0): [number, number, number] {
  const w = grid.length;
  const h = grid[0].length;
  let attempts = 0;
  while (attempts < 100) {
    const rx = Math.floor(Math.random() * w);
    const rz = Math.floor(Math.random() * h);
    const dist = Math.sqrt(rx * rx + rz * rz);
    if (dist > Math.max(w, h) * 0.4 && (rx !== excludeX || rz !== excludeZ)) {
      return [rx * cellSize, 0, rz * cellSize];
    }
    attempts++;
  }
  return [(w - 1) * cellSize, 0, (h - 1) * cellSize];
}

interface GameSceneProps {
  onScore: (points: number) => void;
  onTimeUpdate: (time: number) => void;
  onMazeShift: () => void;
  onLevelUp: (level: number) => void;
  gameState: "playing" | "won" | "menu" | "dead";
  onWin: () => void;
  onDeath: () => void;
  level: number;
  onPlayerMove?: (x: number, z: number) => void;
  onExitChange?: (x: number, z: number) => void;
  onMazeSizeChange?: (size: number) => void;
  joystickInput?: React.MutableRefObject<{ dx: number; dz: number }>;
}

const GameScene = ({ onScore, onTimeUpdate, onMazeShift, onLevelUp, gameState, onWin, onDeath, level, onPlayerMove, onExitChange, onMazeSizeChange, joystickInput }: GameSceneProps) => {
  const config = useMemo(() => getMazeConfig(level), [level]);
  const [walls, setWalls] = useState<WallSegment[]>([]);
  const [removingWalls, setRemovingWalls] = useState<Set<string>>(new Set());
  const [newWalls, setNewWalls] = useState<Set<string>>(new Set());
  const [exitPos, setExitPos] = useState<[number, number, number]>([(config.size - 1) * CELL_SIZE, 0, (config.size - 1) * CELL_SIZE]);
  const timerRef = useRef(0);
  const shiftTimerRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const playerPosRef = useRef(new THREE.Vector3(0, 0.5, 0));
  const deadRef = useRef(false);
  const gridRef = useRef<MazeGrid | null>(null);

  const startPos: [number, number, number] = useMemo(() => [0, 0.5, 0], []);

  // Obstacle positions
  const obstaclePositions = useMemo(() => {
    const blades: [number, number, number][] = [];
    const pillars: [number, number, number][] = [];
    const movingWalls: { start: [number, number, number]; end: [number, number, number] }[] = [];
    const flameJets: [number, number, number][] = [];
    const spikeTraps: [number, number, number][] = [];
    const laserGrids: { pos: [number, number, number]; dir: "x" | "z" }[] = [];
    const used = new Set<string>();

    const addPos = (count: number, arr: [number, number, number][]) => {
      for (let i = 0; i < count; i++) {
        const x = (Math.floor(Math.random() * (config.size - 4)) + 2) * CELL_SIZE;
        const z = (Math.floor(Math.random() * (config.size - 4)) + 2) * CELL_SIZE;
        const key = `${x}_${z}`;
        if (!used.has(key)) { arr.push([x, 0, z]); used.add(key); }
      }
    };

    addPos(config.bladeCount, blades);
    addPos(config.pillarCount, pillars);
    addPos(config.flameJetCount, flameJets);
    addPos(config.spikeTrapCount, spikeTraps);

    for (let i = 0; i < config.movingWallCount; i++) {
      const sx = (Math.floor(Math.random() * (config.size - 4)) + 2) * CELL_SIZE;
      const sz = (Math.floor(Math.random() * (config.size - 4)) + 2) * CELL_SIZE;
      const horizontal = Math.random() > 0.5;
      const travel = CELL_SIZE * (2 + Math.floor(Math.random() * 2));
      movingWalls.push({ start: [sx, 0, sz], end: [horizontal ? sx + travel : sx, 0, horizontal ? sz : sz + travel] });
    }

    for (let i = 0; i < config.laserGridCount; i++) {
      const x = (Math.floor(Math.random() * (config.size - 4)) + 2) * CELL_SIZE;
      const z = (Math.floor(Math.random() * (config.size - 4)) + 2) * CELL_SIZE;
      const key = `${x}_${z}`;
      if (!used.has(key)) {
        laserGrids.push({ pos: [x, 0, z], dir: Math.random() > 0.5 ? "x" : "z" });
        used.add(key);
      }
    }

    return { blades, pillars, movingWalls, flameJets, spikeTraps, laserGrids };
  }, [config, level]); // eslint-disable-line

  const grieverPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < config.grieverCount; i++) {
      const gx = (Math.floor(Math.random() * (config.size - 2)) + 1) * CELL_SIZE;
      const gz = (Math.floor(Math.random() * (config.size - 2)) + 1) * CELL_SIZE;
      const distToStart = Math.sqrt(gx * gx + gz * gz);
      if (distToStart > 8) {
        positions.push([gx, 0, gz]);
      } else {
        const mid = Math.floor(config.size / 2) * CELL_SIZE;
        positions.push([mid + i * 2, 0, mid - i * 2]);
      }
    }
    return positions;
  }, [config.size, config.grieverCount, level]); // eslint-disable-line

  const regenerateMaze = useCallback(() => {
    const grid = generateMaze(config.size, config.size);
    gridRef.current = grid;
    return { segments: getWallSegments(grid, CELL_SIZE), grid };
  }, [config.size]);

  const shiftMaze = useCallback(() => {
    const oldWalls = walls;
    const { segments: newMazeWalls, grid } = regenerateMaze();
    const oldIds = new Set(oldWalls.map((w) => w.id));
    const newIds = new Set(newMazeWalls.map((w) => w.id));
    const removing = new Set<string>();
    oldWalls.forEach((w) => { if (!newIds.has(w.id)) removing.add(w.id); });
    const adding = new Set<string>();
    newMazeWalls.forEach((w) => { if (!oldIds.has(w.id)) adding.add(w.id); });
    setRemovingWalls(removing);
    onMazeShift();
    const newExit = getRandomOpenCell(grid, CELL_SIZE);
    setTimeout(() => {
      setWalls(newMazeWalls);
      setNewWalls(adding);
      setRemovingWalls(new Set());
      setExitPos(newExit);
      onExitChange?.(newExit[0], newExit[2]);
      setTimeout(() => setNewWalls(new Set()), 1000);
    }, 600);
  }, [walls, regenerateMaze, onMazeShift]);

  useEffect(() => {
    if (gameState === "playing") {
      const { segments, grid } = regenerateMaze();
      setWalls(segments);
      const newExit = getRandomOpenCell(grid, CELL_SIZE);
      setExitPos(newExit);
      onExitChange?.(newExit[0], newExit[2]);
      onMazeSizeChange?.(config.size);
      timerRef.current = 0;
      shiftTimerRef.current = 0;
      deadRef.current = false;
      playerPosRef.current.set(0, 0.5, 0);
    }
  }, [gameState, level, regenerateMaze]);

  useEffect(() => {
    if (gameState !== "playing") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      timerRef.current += 1;
      shiftTimerRef.current += 1;
      onTimeUpdate(timerRef.current);
      if (shiftTimerRef.current >= config.shiftInterval) {
        shiftTimerRef.current = 0;
        shiftMaze();
      }
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [gameState, onTimeUpdate, shiftMaze, config.shiftInterval]);

  const handlePositionChange = useCallback(
    (x: number, z: number) => {
      playerPosRef.current.set(x, 0.5, z);
      onPlayerMove?.(x, z);
      const ex = exitPos[0];
      const ez = exitPos[2];
      const dist = Math.sqrt((x - ex) ** 2 + (z - ez) ** 2);
      if (dist < 1.2 && gameState === "playing") {
        const timeBonus = Math.max(0, 500 - timerRef.current * 5);
        onScore(100 + timeBonus);
        onWin();
      }
    },
    [exitPos, gameState, onScore, onWin]
  );

  const handleDeath = useCallback(() => {
    if (deadRef.current) return;
    deadRef.current = true;
    onDeath();
  }, [onDeath]);

  if (gameState !== "playing") return null;

  const groundSize = config.size * CELL_SIZE + 8;
  const groundCenter = (config.size - 1) * CELL_SIZE / 2;

  return (
    <Canvas shadows camera={{ position: [0, 18, 12], fov: 50 }}>
      <Sky sunPosition={[100, 50, 100]} turbidity={0.3} rayleigh={0.5} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[15, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={150}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      <pointLight position={[exitPos[0], 3, exitPos[2]]} color="#22c55e" intensity={3} distance={10} />

      <fog attach="fog" args={["#e8dcc8", 20, 65]} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[groundCenter, -0.01, groundCenter]} receiveShadow>
        <planeGeometry args={[groundSize, groundSize]} />
        <meshStandardMaterial color="#e0d4b8" roughness={0.9} />
      </mesh>

      {/* Atmosphere: torches, dust particles */}
      <MazeAtmosphere mazeSize={config.size} cellSize={CELL_SIZE} playerPositionRef={playerPosRef} />

      {/* Player trail */}
      <PlayerTrail playerPositionRef={playerPosRef} />

      {/* Maze Walls */}
      {walls.map((wall) => (
        <MazeWall
          key={wall.id}
          position={[wall.x, 0, wall.z]}
          rotation={[0, wall.rotationY, 0]}
          cellSize={CELL_SIZE}
          wallHeight={WALL_HEIGHT}
          isNew={newWalls.has(wall.id)}
          isRemoving={removingWalls.has(wall.id)}
        />
      ))}

      <Player startPosition={startPos} walls={walls} cellSize={CELL_SIZE} onPositionChange={handlePositionChange} joystickInput={joystickInput} />

      {/* Grievers */}
      {grieverPositions.map((gPos, i) => (
        <Griever key={`griever-${level}-${i}`} id={i} startPosition={gPos} walls={walls} cellSize={CELL_SIZE} speed={config.grieverSpeed} playerPositionRef={playerPosRef} onCatchPlayer={handleDeath} />
      ))}

      {/* Spinning Blades */}
      {obstaclePositions.blades.map((pos, i) => (
        <SpinningBlade key={`blade-${level}-${i}`} position={pos} speed={1.5 + level * 0.3} radius={1.2 + Math.random() * 0.5} playerPositionRef={playerPosRef} onHitPlayer={handleDeath} />
      ))}

      {/* Crushing Pillars */}
      {obstaclePositions.pillars.map((pos, i) => (
        <CrushingPillar key={`pillar-${level}-${i}`} position={pos} interval={Math.max(2, 4 - level * 0.3)} playerPositionRef={playerPosRef} onCrushPlayer={handleDeath} />
      ))}

      {/* Moving Walls */}
      {obstaclePositions.movingWalls.map((mw, i) => (
        <MovingWall key={`mwall-${level}-${i}`} startPosition={mw.start} endPosition={mw.end} speed={1 + level * 0.2} wallHeight={WALL_HEIGHT} playerPositionRef={playerPosRef} onHitPlayer={handleDeath} walls={walls} cellSize={CELL_SIZE} />
      ))}

      {/* Flame Jets */}
      {obstaclePositions.flameJets.map((pos, i) => (
        <FlameJet key={`flame-${level}-${i}`} position={pos} interval={Math.max(2.5, 4 - level * 0.2)} playerPositionRef={playerPosRef} onHitPlayer={handleDeath} />
      ))}

      {/* Spike Traps */}
      {obstaclePositions.spikeTraps.map((pos, i) => (
        <SpikeTrap key={`spike-${level}-${i}`} position={pos} interval={Math.max(2, 4.5 - level * 0.3)} playerPositionRef={playerPosRef} onHitPlayer={handleDeath} />
      ))}

      {/* Laser Grids */}
      {obstaclePositions.laserGrids.map((lg, i) => (
        <LaserGrid key={`laser-${level}-${i}`} position={lg.pos} direction={lg.dir} playerPositionRef={playerPosRef} onHitPlayer={handleDeath} />
      ))}

      <ExitMarker position={exitPos} />
    </Canvas>
  );
};

export default GameScene;
