import { useRef, useCallback, useEffect, useState } from "react";

interface VirtualJoystickProps {
  onMove: (dx: number, dz: number) => void;
}

const STICK_SIZE = 110;
const KNOB_SIZE = 44;
const MAX_DIST = (STICK_SIZE - KNOB_SIZE) / 2;

const VirtualJoystick = ({ onMove }: VirtualJoystickProps) => {
  const stickRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const centerRef = useRef({ x: 0, y: 0 });
  const moveRef = useRef({ dx: 0, dz: 0 });
  const rafRef = useRef<number>(0);

  const updateKnob = useCallback((clientX: number, clientY: number) => {
    const cx = centerRef.current.x;
    const cy = centerRef.current.y;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > MAX_DIST) {
      dx = (dx / dist) * MAX_DIST;
      dy = (dy / dist) * MAX_DIST;
    }
    setKnobPos({ x: dx, y: dy });
    moveRef.current = { dx: dx / MAX_DIST, dz: dy / MAX_DIST };
  }, []);

  const handleStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = stickRef.current?.getBoundingClientRect();
    if (!rect) return;
    centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    setActive(true);
    updateKnob(touch.clientX, touch.clientY);
  }, [updateKnob]);

  const handleMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!active) return;
    updateKnob(e.touches[0].clientX, e.touches[0].clientY);
  }, [active, updateKnob]);

  const handleEnd = useCallback(() => {
    setActive(false);
    setKnobPos({ x: 0, y: 0 });
    moveRef.current = { dx: 0, dz: 0 };
  }, []);

  useEffect(() => {
    const loop = () => {
      const { dx, dz } = moveRef.current;
      onMove(dx, dz);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [onMove]);

  return (
    <div
      ref={stickRef}
      className="absolute bottom-6 left-6 z-20 touch-none select-none"
      style={{ width: STICK_SIZE, height: STICK_SIZE }}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
    >
      {/* Base ring */}
      <div
        className="absolute inset-0 rounded-full border-2 border-foreground/25"
        style={{ background: "hsla(var(--card), 0.5)", backdropFilter: "blur(6px)" }}
      />
      {/* Direction indicators */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute top-2 text-foreground/20 text-[10px] font-bold">▲</div>
        <div className="absolute bottom-2 text-foreground/20 text-[10px] font-bold">▼</div>
        <div className="absolute left-2 text-foreground/20 text-[10px] font-bold">◀</div>
        <div className="absolute right-2 text-foreground/20 text-[10px] font-bold">▶</div>
      </div>
      {/* Knob */}
      <div
        className="absolute rounded-full"
        style={{
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          left: STICK_SIZE / 2 - KNOB_SIZE / 2 + knobPos.x,
          top: STICK_SIZE / 2 - KNOB_SIZE / 2 + knobPos.y,
          background: active ? "hsla(var(--primary), 0.8)" : "hsla(var(--foreground), 0.35)",
          transition: active ? "none" : "all 0.15s ease-out",
          boxShadow: active ? "0 0 16px 4px hsla(var(--primary), 0.5)" : "0 0 4px 1px hsla(var(--foreground), 0.1)",
        }}
      />
    </div>
  );
};

export default VirtualJoystick;
