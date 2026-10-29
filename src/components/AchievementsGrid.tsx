// Rejilla de logros. Desbloqueados con acento; bloqueados en gris con su barra
// de progreso si aplica. Entrada escalonada.

import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Logro } from "@/lib/achievements";
import { Meter } from "./Meter";

export function AchievementsGrid({ logros }: { logros: Logro[] }) {
  // Desbloqueados primero; luego los que están más cerca de completarse.
  const ordenados = [...logros].sort((a, b) => {
    if (a.hecho !== b.hecho) return a.hecho ? -1 : 1;
    const ra = a.progreso ? a.progreso.hecho / Math.max(1, a.progreso.total) : 0;
    const rb = b.progreso ? b.progreso.hecho / Math.max(1, b.progreso.total) : 0;
    return rb - ra;
  });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ordenados.map((l, i) => {
        const Icon = l.icon;
        return (
          <div
            key={l.id}
            className={cn(
              "anim-enter flex gap-3 rounded-xl border bg-card p-4 elev-1 ease-apple transition-transform hover:-translate-y-0.5",
              !l.hecho && "opacity-70",
            )}
            style={{ animationDelay: `${Math.min(i * 45, 400)}ms` }}
          >
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                l.hecho
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{l.nombre}</p>
                {l.hecho ? (
                  <Check className="size-4 shrink-0 text-success" />
                ) : (
                  <Lock className="size-3.5 shrink-0 text-muted-foreground/60" />
                )}
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {l.descripcion}
              </p>
              {l.progreso && !l.hecho && l.progreso.total > 0 && (
                <div className="mt-2">
                  <Meter
                    value={l.progreso.hecho / l.progreso.total}
                    tone="muted"
                  />
                  <p className="mt-1 text-right font-mono text-[10px] text-muted-foreground">
                    {l.progreso.hecho}/{l.progreso.total}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
