import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { PracticePanel } from "@/components/PracticePanel";
import { useAllExercises, useProgress } from "@/lib/queries";
import { estaVencido } from "@/lib/spaced";
import type { Progress } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_layout/repaso")({
  component: Repaso,
});

function Repaso() {
  const { data: exercises, isLoading } = useAllExercises();
  const { data: progress } = useProgress();

  const vencidos = useMemo(() => {
    const byExercise = new Map<string, Progress>();
    (progress ?? []).forEach((p) => byExercise.set(p.exercise_id, p));
    const now = new Date();
    return (exercises ?? []).filter((e) =>
      estaVencido(byExercise.get(e.id) ?? null, now),
    );
  }, [exercises, progress]);

  return (
    <div className="anim-enter space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Repaso
        </p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
          Lo que toca hoy
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todos los ejercicios pendientes, de todas las herramientas.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : vencidos.length === 0 ? (
        <div className="rounded-2xl border bg-card py-12 text-center text-sm text-muted-foreground elev-1">
          No hay nada pendiente por ahora. Vuelve más tarde o practica una
          herramienta desde el inicio.
        </div>
      ) : (
        <PracticePanel exercises={vencidos} scope="repaso" />
      )}
    </div>
  );
}
