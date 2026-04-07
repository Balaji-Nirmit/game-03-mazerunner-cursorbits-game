import { useIsMobile } from "@/hooks/use-mobile";

interface MinimapProps {
  playerX: number;
  playerZ: number;
  exitX: number;
  exitZ: number;
  mazeSize: number;
  cellSize: number;
}

const Minimap = ({ playerX, playerZ, exitX, exitZ, mazeSize, cellSize }: MinimapProps) => {
  const isMobile = useIsMobile();
  const MAP_SIZE = isMobile ? 90 : 140;

  const worldSize = mazeSize * cellSize;
  const scale = MAP_SIZE / worldSize;

  const px = Math.max(0, Math.min(MAP_SIZE, playerX * scale));
  const pz = Math.max(0, Math.min(MAP_SIZE, playerZ * scale));
  const ex = Math.max(0, Math.min(MAP_SIZE, exitX * scale));
  const ez = Math.max(0, Math.min(MAP_SIZE, exitZ * scale));

  return (
    <div
      className="absolute top-auto bottom-4 right-4 sm:bottom-4 sm:right-4 z-10 pointer-events-none rounded-lg border border-border shadow-lg overflow-hidden"
      style={{
        width: MAP_SIZE,
        height: MAP_SIZE,
        background: "hsla(var(--card), 0.85)",
        backdropFilter: "blur(8px)",
        // On mobile, position top-right to avoid joystick overlap
        ...(isMobile ? { bottom: "auto", top: 80, right: 8 } : {}),
      }}
    >
      {/* Grid lines */}
      <svg width={MAP_SIZE} height={MAP_SIZE} className="absolute inset-0 opacity-20">
        {Array.from({ length: Math.min(mazeSize, 20) + 1 }).map((_, i) => {
          const pos = i * cellSize * scale;
          return (
            <g key={i}>
              <line x1={pos} y1={0} x2={pos} y2={MAP_SIZE} stroke="hsl(var(--foreground))" strokeWidth={0.5} />
              <line x1={0} y1={pos} x2={MAP_SIZE} y2={pos} stroke="hsl(var(--foreground))" strokeWidth={0.5} />
            </g>
          );
        })}
      </svg>

      {/* Exit marker */}
      <div
        className="absolute rounded-full animate-pulse"
        style={{
          width: isMobile ? 7 : 10,
          height: isMobile ? 7 : 10,
          left: ex - (isMobile ? 3.5 : 5),
          top: ez - (isMobile ? 3.5 : 5),
          background: "#22c55e",
          boxShadow: "0 0 8px 3px rgba(34,197,94,0.6)",
        }}
      />

      {/* Player dot */}
      <div
        className="absolute rounded-full"
        style={{
          width: isMobile ? 6 : 8,
          height: isMobile ? 6 : 8,
          left: px - (isMobile ? 3 : 4),
          top: pz - (isMobile ? 3 : 4),
          background: "#e8a838",
          boxShadow: "0 0 6px 2px rgba(232,168,56,0.5)",
        }}
      />

      {/* Label */}
      <span className="absolute top-1 left-2 text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Map</span>
    </div>
  );
};

export default Minimap;
