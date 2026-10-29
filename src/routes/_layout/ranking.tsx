import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Crown, Trophy } from "lucide-react";

import { AchievementsGrid } from "@/components/AchievementsGrid";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Meter } from "@/components/Meter";
import { useAuth } from "@/lib/auth";
import {
  useAllExercises,
  useLeaderboard,
  useProgress,
  useTools,
  type LeaderboardRow,
} from "@/lib/queries";
import { dominio, nivelDeXp } from "@/lib/levels";
import { evaluarLogros } from "@/lib/achievements";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_layout/ranking")({
  component: Ranking,
});

interface UserAgg {
  id: string;
  nombre: string;
  xp: number;
  dominados: number;
  perTool: Map<string, { dominados: number; xp: number }>; // por herramienta
}

function agregar(rows: LeaderboardRow[]): UserAgg[] {
  const byUser = new Map<string, UserAgg>();
  for (const r of rows) {
    const u =
      byUser.get(r.user_id) ??
      ({ id: r.user_id, nombre: r.nombre ?? "usuario", xp: 0, dominados: 0, perTool: new Map() } as UserAgg);
    u.xp += Number(r.xp) || 0;
    u.dominados += Number(r.dominados) || 0;
    if (r.nombre) u.nombre = r.nombre;
    u.perTool.set(r.tool_id, {
      dominados: Number(r.dominados) || 0,
      xp: Number(r.xp) || 0,
    });
    byUser.set(r.user_id, u);
  }
  return [...byUser.values()].sort((a, b) => b.xp - a.xp);
}

function Ranking() {
  const { user } = useAuth();
  const { data: rows, isLoading } = useLeaderboard();
  const { data: tools } = useTools();
  const { data: exercises } = useAllExercises();
  const { data: progress } = useProgress();

  const standings = useMemo(() => agregar(rows ?? []), [rows]);
  const maxXp = Math.max(1, ...standings.map((s) => s.xp));

  const totalPorTool = useMemo(() => {
    const m = new Map<string, number>();
    (exercises ?? []).forEach((e) => m.set(e.tool_id, (m.get(e.tool_id) ?? 0) + 1));
    return m;
  }, [exercises]);

  const logros = useMemo(
    () =>
      evaluarLogros({
        progress: progress ?? [],
        exercises: exercises ?? [],
        tools: tools ?? [],
      }),
    [progress, exercises, tools],
  );

  return (
    <div className="space-y-10">
      <section className="anim-enter space-y-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Ranking
          </p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
            Tú vs. tu escuadra
          </h1>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : standings.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Todavía no hay progreso registrado. Practica un rato y vuelve a ver
              el ranking.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {standings.map((s, i) => {
              const nivel = nivelDeXp(s.xp);
              const yo = s.id === user?.id;
              return (
                <div
                  key={s.id}
                  className={cn(
                    "anim-enter flex items-center gap-4 rounded-2xl border bg-card p-4 elev-1",
                    yo && "ring-1 ring-primary/40",
                  )}
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold",
                      i === 0
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {i === 0 ? <Crown className="size-5" /> : i + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{s.nombre}</span>
                      {yo && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          tú
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {nivel.actual.nombre} · {s.dominados} dominados
                    </p>
                    <div className="mt-2">
                      <Meter value={s.xp / maxXp} tone={i === 0 ? "primary" : "muted"} />
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="font-mono text-lg font-semibold">
                      <AnimatedNumber value={s.xp} />
                    </div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      XP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {standings.length > 0 && (tools?.length ?? 0) > 0 && (
        <section className="space-y-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Por área
            </p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight">
              Dominio por herramienta
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {tools!.map((t, i) => {
              const total = totalPorTool.get(t.id) ?? 0;
              const lider = [...standings].sort(
                (a, b) => (b.perTool.get(t.id)?.xp ?? 0) - (a.perTool.get(t.id)?.xp ?? 0),
              )[0];
              return (
                <div
                  key={t.id}
                  className="anim-enter rounded-2xl border bg-card p-4 elev-1"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium">{t.nombre}</h3>
                    {lider && (lider.perTool.get(t.id)?.xp ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Trophy className="size-3.5 text-primary" />
                        {lider.nombre}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {standings.map((s) => {
                      const agg = s.perTool.get(t.id);
                      const dom = agg?.dominados ?? 0;
                      const grado = dominio(agg?.xp ?? 0, total);
                      return (
                        <div key={s.id} className="flex items-center gap-3">
                          <span
                            className={cn(
                              "w-20 shrink-0 truncate text-xs",
                              s.id === user?.id ? "font-medium text-foreground" : "text-muted-foreground",
                            )}
                          >
                            {s.nombre}
                          </span>
                          <Meter
                            value={grado}
                            tone={s.id === user?.id ? "primary" : "muted"}
                            className="flex-1"
                          />
                          <span
                            className="w-12 shrink-0 text-right font-mono text-xs text-muted-foreground"
                            title={`${dom} de ${total} dominados`}
                          >
                            {Math.round(grado * 100)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Logros
          </p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight">Tus logros</h2>
        </div>
        <AchievementsGrid logros={logros} />
      </section>
    </div>
  );
}
