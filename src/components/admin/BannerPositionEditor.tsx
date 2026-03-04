import { useState, useRef, useCallback, useEffect } from "react";
import { Move, ZoomIn, ZoomOut, Crosshair, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface BannerPositionEditorProps {
  imageUrl: string;
  positionX: number;
  positionY: number;
  zoom: number;
  onChange: (values: { positionX: number; positionY: number; zoom: number }) => void;
}

export function BannerPositionEditor({
  imageUrl,
  positionX,
  positionY,
  zoom,
  onChange,
}: BannerPositionEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, startPx: 0, startPy: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        startPx: positionX,
        startPy: positionY,
      };
    },
    [positionX, positionY]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - dragStart.current.x) / rect.width) * 100;
      const dy = ((e.clientY - dragStart.current.y) / rect.height) * 100;
      // Invert: dragging right moves image left (lower objectPosition %)
      const newX = Math.max(0, Math.min(100, dragStart.current.startPx - dx));
      const newY = Math.max(0, Math.min(100, dragStart.current.startPy - dy));
      onChange({ positionX: Math.round(newX * 10) / 10, positionY: Math.round(newY * 10) / 10, zoom });
    },
    [dragging, zoom, onChange]
  );

  const handleMouseUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Touch support
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      setDragging(true);
      dragStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        startPx: positionX,
        startPy: positionY,
      };
    },
    [positionX, positionY]
  );

  useEffect(() => {
    if (!dragging) return;
    const onTouchMove = (e: TouchEvent) => {
      if (!containerRef.current) return;
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((touch.clientX - dragStart.current.x) / rect.width) * 100;
      const dy = ((touch.clientY - dragStart.current.y) / rect.height) * 100;
      const newX = Math.max(0, Math.min(100, dragStart.current.startPx - dx));
      const newY = Math.max(0, Math.min(100, dragStart.current.startPy - dy));
      onChange({ positionX: Math.round(newX * 10) / 10, positionY: Math.round(newY * 10) / 10, zoom });
    };
    const onTouchEnd = () => setDragging(false);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [dragging, zoom, onChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Move className="h-3.5 w-3.5" />
        <span>Arraste a imagem para reposicionar</span>
      </div>

      {/* Preview frame */}
      <div
        ref={containerRef}
        className={`relative w-full overflow-hidden rounded-lg border-2 border-dashed ${
          dragging ? "border-accent cursor-grabbing" : "border-muted-foreground/30 cursor-grab"
        }`}
        style={{ aspectRatio: "1920/550" }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <img
          src={imageUrl}
          alt="Banner preview"
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
          draggable={false}
          style={{
            objectFit: "cover",
            objectPosition: `${positionX}% ${positionY}%`,
            transform: `scale(${zoom})`,
            transformOrigin: `${positionX}% ${positionY}%`,
          }}
        />

        {/* Crosshair overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-accent/30" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-accent/30" />
        </div>

        {/* Position indicator */}
        <div className="absolute bottom-2 right-2 bg-background/80 text-foreground text-xs px-2 py-1 rounded font-mono">
          X:{positionX}% Y:{positionY}% Z:{zoom.toFixed(1)}x
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3">
        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <ZoomOut className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.1}
            onValueChange={([v]) => onChange({ positionX, positionY, zoom: v })}
            className="flex-1"
          />
          <ZoomIn className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground w-10 text-right font-mono">{zoom.toFixed(1)}x</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ positionX: 50, positionY: 50, zoom })}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Crosshair className="h-3.5 w-3.5" /> Centralizar
          </button>
          <button
            type="button"
            onClick={() => onChange({ positionX: 50, positionY: 50, zoom: 1 })}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Resetar
          </button>
        </div>
      </div>
    </div>
  );
}
