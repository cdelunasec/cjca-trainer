// Tarjeta de nivel: nombre del nivel, XP y progreso al siguiente. Estilo Apple.

import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { nivelDeXp, TOTAL_NIVELES } from "@/lib/levels";
import { AnimatedNumber } from "./AnimatedNumber";
import { Meter } from "./Meter";

export function LevelCard({ xp, className }: { xp: number; className?: string }) {
  const n = nivelDeXp(xp);
  const faltan = n.siguiente ? Math.max(0, n.xpParaSiguiente - xp) : 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card p-5 elev-2",
        className,
      )}
    >
      {/* halo de profundidad, muy sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-60 blur-2xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--primary) 22%, transparent), transparent)",
        }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Tu nivel
          </p>
          <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight">
            {n.actual.nombre}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border bg-secondary px-3 py-1 text-xs font-medium">
          <Zap className="size-3.5 text-primary" />
          Nivel {n.actual.indice + 1}
          <span className="text-muted-foreground">/ {TOTAL_NIVELES}</span>
        </div>
      </div>

      <div className="relative mt-5">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="font-mono text-sm">
            <AnimatedNumber value={xp} className="text-lg font-semibold" /> XP
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {n.siguiente ? `${n.xpParaSiguiente} XP` : "MÁX"}
          </span>
        </div>
        <Meter value={n.progreso} />
        <p className="mt-2 text-xs text-muted-foreground">
          {n.siguiente
            ? `Faltan ${faltan} XP para ${n.siguiente.nombre}`
            : "Nivel máximo alcanzado. Máquina."}
        </p>
      </div>
    </div>
  );
}
