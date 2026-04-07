import { Timer, Trophy, AlertTriangle, Gamepad2, Bug, Volume2, VolumeX } from "lucide-react";

interface GameHUDProps {
  time: number;
  score: number;
  level: number;
  shiftWarning: boolean;
  muted: boolean;
  onToggleMute: () => void;
}

const GameHUD = ({ time, score, level, shiftWarning, muted, onToggleMute }: GameHUDProps) => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  return (
    <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 flex justify-between items-start pointer-events-none z-10">
      <div className="flex flex-col gap-1 sm:gap-2">
        <div className="bg-card/80 backdrop-blur-md rounded-lg px-2 sm:px-4 py-1 sm:py-2 flex items-center gap-1.5 sm:gap-2 shadow-lg border border-border">
          <Timer className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
          <span className="font-mono text-sm sm:text-lg font-bold text-foreground">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </div>
        <div className="bg-card/80 backdrop-blur-md rounded-lg px-2 sm:px-4 py-1 sm:py-2 flex items-center gap-1.5 sm:gap-2 shadow-lg border border-border">
          <Gamepad2 className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
          <span className="text-xs sm:text-sm font-semibold text-foreground">Lv {level}</span>
        </div>
        <div className="bg-card/80 backdrop-blur-md rounded-lg px-2 sm:px-4 py-1 sm:py-2 flex items-center gap-1.5 sm:gap-2 shadow-lg border border-border hidden sm:flex">
          <Bug className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
          <span className="text-xs text-muted-foreground">Grievers are hunting you</span>
        </div>
      </div>

      {shiftWarning && (
        <div className="bg-game-danger/90 backdrop-blur-md rounded-lg px-2 sm:px-4 py-1 sm:py-2 flex items-center gap-1.5 sm:gap-2 shadow-lg animate-pulse">
          <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-destructive-foreground" />
          <span className="text-xs sm:text-sm font-bold text-destructive-foreground">MAZE SHIFTING!</span>
        </div>
      )}

      <div className="flex flex-col gap-1 sm:gap-2 items-end">
        <div className="bg-card/80 backdrop-blur-md rounded-lg px-2 sm:px-4 py-1 sm:py-2 flex items-center gap-1.5 sm:gap-2 shadow-lg border border-border">
          <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-game-gold" />
          <span className="font-mono text-sm sm:text-lg font-bold text-foreground">{score}</span>
        </div>
        <button
          onClick={onToggleMute}
          className="bg-card/80 backdrop-blur-md rounded-lg px-2 sm:px-3 py-1 sm:py-2 shadow-lg border border-border pointer-events-auto hover:bg-card/95 transition-colors"
        >
          {muted ? <VolumeX className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" /> : <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />}
        </button>
      </div>
    </div>
  );
};

export default GameHUD;
