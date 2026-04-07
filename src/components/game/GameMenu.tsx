import { Play, RotateCcw, Trophy, Skull, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface GameMenuProps {
  gameState: "menu" | "won" | "dead";
  score: number;
  level: number;
  onStart: () => void;
  onNextLevel: () => void;
}

const GameMenu = ({ gameState, score, level, onStart, onNextLevel }: GameMenuProps) => {
  const [isTouchDevice] = useState(() => "ontouchstart" in window || navigator.maxTouchPoints > 0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden px-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-20 sm:w-32 h-20 sm:h-32 border-4 border-primary rounded-sm rotate-12" />
        <div className="absolute bottom-20 right-10 w-16 sm:w-24 h-16 sm:h-24 border-4 border-primary rounded-sm -rotate-6" />
        <div className="absolute top-40 right-20 w-12 sm:w-16 h-12 sm:h-16 border-4 border-accent rounded-sm rotate-45" />
        <div className="absolute bottom-40 left-20 w-14 sm:w-20 h-14 sm:h-20 border-4 border-accent rounded-sm -rotate-12" />
      </div>

      <div className="relative z-10 text-center px-4 sm:px-6 w-full max-w-md">
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-foreground tracking-tighter mb-1 sm:mb-2">
          MAZE
        </h1>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-light text-primary tracking-widest mb-6 sm:mb-8">
          RUNNER
        </h2>

        {gameState === "dead" && (
          <div className="mb-6 sm:mb-8 bg-destructive/10 backdrop-blur rounded-2xl p-4 sm:p-6 border border-destructive/30 shadow-xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Skull className="w-6 h-6 sm:w-8 sm:h-8 text-destructive" />
              <span className="text-lg sm:text-2xl font-bold text-destructive">CAUGHT!</span>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mb-1">A Griever got you.</p>
            <p className="text-base sm:text-lg font-mono text-foreground">Level {level} · {score} pts</p>
          </div>
        )}

        {gameState === "won" && (
          <div className="mb-6 sm:mb-8 bg-card/80 backdrop-blur rounded-2xl p-4 sm:p-6 border border-border shadow-xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-game-gold" />
              <span className="text-lg sm:text-2xl font-bold text-foreground">Level {level} Complete!</span>
            </div>
            <p className="text-3xl sm:text-4xl font-mono font-black text-primary">{score} pts</p>
          </div>
        )}

        {gameState === "menu" && (
          <div className="mb-6 sm:mb-8">
            <p className="text-muted-foreground text-sm sm:text-lg mb-4 max-w-md mx-auto">
              Navigate the ever-shifting maze. Avoid the Grievers. Reach the exit before the walls change.
            </p>
            {isTouchDevice ? (
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-primary/80 bg-primary/10 rounded-lg px-3 py-2">
                <Smartphone className="w-4 h-4" />
                <span>Use the <strong>joystick</strong> to move</span>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Use <kbd className="bg-muted px-2 py-0.5 rounded text-xs font-mono">WASD</kbd> or arrow keys to move.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 items-center w-full">
          {gameState === "menu" ? (
            <Button
              onClick={onStart}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 rounded-xl shadow-lg w-full max-w-xs"
            >
              <Play className="w-5 h-5 mr-2" />
              Enter The Maze
            </Button>
          ) : gameState === "won" ? (
            <>
              <Button
                onClick={onNextLevel}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 rounded-xl shadow-lg w-full max-w-xs"
              >
                <Play className="w-5 h-5 mr-2" />
                Next Level
              </Button>
              <Button
                onClick={onStart}
                variant="outline"
                size="lg"
                className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 rounded-xl w-full max-w-xs"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart
              </Button>
            </>
          ) : (
            <Button
              onClick={onStart}
              size="lg"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 rounded-xl shadow-lg w-full max-w-xs"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameMenu;
