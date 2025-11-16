import { useRef, useState } from "react";
import type { NormalizedOcrZone } from "@/lib/text-extraction";

type OcrZoneSelectorProps = {
  imageUrl: string;
  zones: Array<NormalizedOcrZone & { id: string }>;
  onAddZone: (zone: NormalizedOcrZone) => void;
  disabled?: boolean;
};

const clamp = (value: number) => Math.min(Math.max(value, 0), 100);
const MIN_ZONE_SIZE = 1; // percentage

const OcrZoneSelector = ({ imageUrl, zones, onAddZone, disabled = false }: OcrZoneSelectorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const [draftRect, setDraftRect] = useState<NormalizedOcrZone | null>(null);

  const resetDraft = () => {
    originRef.current = null;
    setDraftRect(null);
  };

  const getRelativePosition = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) {
      return null;
    }
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    return { x: clamp(x), y: clamp(y) };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }

    const start = getRelativePosition(event);
    if (!start) {
      return;
    }

    originRef.current = start;
    setDraftRect({ x: start.x, y: start.y, width: 0, height: 0 });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!originRef.current || disabled) {
      return;
    }

    const current = getRelativePosition(event);
    if (!current) {
      return;
    }

    const x = Math.min(originRef.current.x, current.x);
    const y = Math.min(originRef.current.y, current.y);
    const width = Math.abs(current.x - originRef.current.x);
    const height = Math.abs(current.y - originRef.current.y);

    setDraftRect({ x, y, width, height });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!originRef.current || disabled) {
      resetDraft();
      return;
    }

    if (draftRect && draftRect.width >= MIN_ZONE_SIZE && draftRect.height >= MIN_ZONE_SIZE) {
      onAddZone({
        x: Number(draftRect.x.toFixed(2)),
        y: Number(draftRect.y.toFixed(2)),
        width: Number(draftRect.width.toFixed(2)),
        height: Number(draftRect.height.toFixed(2)),
      });
    }

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    resetDraft();
  };

  const handlePointerLeave = () => {
    if (originRef.current) {
      resetDraft();
    }
  };

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-md border border-dashed border-primary/40 bg-muted/30 ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-crosshair"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        <img
          src={imageUrl}
          alt="ตัวอย่างรูปภาพ OCR"
          className="block w-full select-none"
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0">
          {zones.map((zone, index) => (
            <div
              key={zone.id}
              className="absolute border-2 border-primary bg-primary/10 text-primary transition-opacity"
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.width}%`,
                height: `${zone.height}%`,
              }}
            >
              <span className="absolute left-1 top-1 rounded bg-primary px-1 text-[10px] font-semibold text-white">
                {index + 1}
              </span>
            </div>
          ))}
          {draftRect && (
            <div
              className="absolute border-2 border-dashed border-primary/80 bg-primary/10"
              style={{
                left: `${draftRect.x}%`,
                top: `${draftRect.y}%`,
                width: `${draftRect.width}%`,
                height: `${draftRect.height}%`,
              }}
            />
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        ลากเมาส์หรือนิ้วเพื่อเลือกพื้นที่ข้อความ สามารถเพิ่มได้หลายพื้นที่ และจะใช้ค่าร้อยละตามขนาดรูป
      </p>
    </div>
  );
};

export default OcrZoneSelector;
