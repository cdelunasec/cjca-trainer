// Barra de progreso que crece al montar (transición de ancho). value es 0..1.

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "muted";

export function Meter({
  value,
  tone = "primary",
  className,
}: {
  value: number;
  tone?: Tone;
  className?: string;
}) {
  const [w, setW] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setW(Math.max(0, Math.min(1, value))));
    return () => cancelAnimationFrame(id);
  }, [value]);

  const fill =
    tone === "success"
      ? "bg-success"
      : tone === "muted"
        ? "bg-muted-foreground/40"
        : "bg-primary";

  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-secondary",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700", fill)}
        style={{ width: `${w * 100}%`, transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
      />
    </div>
  );
}
