import { useState, useCallback, useRef } from "react";
import GameScene from "@/components/game/GameScene";
import GameHUD from "@/components/game/GameHUD";
import GameMenu from "@/components/game/GameMenu";
import Minimap from "@/components/game/Minimap";
import VirtualJoystick from "@/components/game/VirtualJoystick";
import { playDeathSound, playWinSound, playMazeShift, stopHeartbeat, toggleMute, isMuted } from "@/lib/soundEngine";

const CELL_SIZE = 3;

const Index = () => {
  const [gameState, setGameState] = useState<"menu" | "playing" | "won" | "dead">("menu");
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [level, setLevel] = useState(1);
  const [shiftWarning, setShiftWarning] = useState(false);
  const [playerPos, setPlayerPos] = useState({ x: 0, z: 0 });
  const [exitPos, setExitPos] = useState({ x: 0, z: 0 });
  const [mazeSize, setMazeSize] = useState(12);
  const [muted, setMuted] = useState(false);
  const joystickRef = useRef({ dx: 0, dz: 0 });
  const [isTouchDevice] = useState(() => "ontouchstart" in window || navigator.maxTouchPoints > 0);

  const handleStart = useCallback(() => {
    setScore(0);
    setLevel(1);
    setTime(0);
    setGameState("playing");
  }, []);

  const handleNextLevel = useCallback(() => {
    setLevel((l) => l + 1);
    setTime(0);
    setGameState("playing");
  }, []);

  const handleScore = useCallback((points: number) => {
    setScore((s) => s + points);
  }, []);

  const handleMazeShift = useCallback(() => {
    setShiftWarning(true);
    playMazeShift();
    setTimeout(() => setShiftWarning(false), 2000);
  }, []);

  const handleWin = useCallback(() => {
    stopHeartbeat();
    playWinSound();
    setGameState("won");
  }, []);

  const handleDeath = useCallback(() => {
    stopHeartbeat();
    playDeathSound();
    setGameState("dead");
  }, []);

  const handlePlayerMove = useCallback((x: number, z: number) => {
    setPlayerPos({ x, z });
  }, []);

  const handleExitChange = useCallback((x: number, z: number) => {
    setExitPos({ x, z });
  }, []);

  const handleMazeSizeChange = useCallback((size: number) => {
    setMazeSize(size);
  }, []);

  const handleToggleMute = useCallback(() => {
    const nowMuted = toggleMute();
    setMuted(nowMuted);
  }, []);

  const handleJoystickMove = useCallback((dx: number, dz: number) => {
    joystickRef.current = { dx, dz };
  }, []);

  if (gameState === "menu" || gameState === "won" || gameState === "dead") {
    return (
      <GameMenu
        gameState={gameState}
        score={score}
        level={level}
        onStart={handleStart}
        onNextLevel={handleNextLevel}
      />
    );
  }

  return (
    <div className="w-full h-screen relative bg-background">
      <GameHUD time={time} score={score} level={level} shiftWarning={shiftWarning} muted={muted} onToggleMute={handleToggleMute} />
      <Minimap
        playerX={playerPos.x}
        playerZ={playerPos.z}
        exitX={exitPos.x}
        exitZ={exitPos.z}
        mazeSize={mazeSize}
        cellSize={CELL_SIZE}
      />
      {isTouchDevice && <VirtualJoystick onMove={handleJoystickMove} />}
      <GameScene
        onScore={handleScore}
        onTimeUpdate={setTime}
        onMazeShift={handleMazeShift}
        onLevelUp={setLevel}
        gameState={gameState}
        onWin={handleWin}
        onDeath={handleDeath}
        level={level}
        onPlayerMove={handlePlayerMove}
        onExitChange={handleExitChange}
        onMazeSizeChange={handleMazeSizeChange}
        joystickInput={joystickRef}
      />
    </div>
  );
};

export default Index;
