import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";

import { LevelCard } from "@/components/LevelCard";
import { AchievementsGrid } from "@/components/AchievementsGrid";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Meter } from "@/components/Meter";
import { useAuth } from "@/lib/auth";
import { useAllExercises, useProgress, useTools } from "@/lib/queries";
import { estaVencido } from "@/lib/spaced";
import { dominio, xpDeProgreso, XP_POR_ESTADO } from "@/lib/levels";
import { evaluarLogros } from "@/lib/achievements";
import type { Progress } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { data: tools, isLoading: loadingTools } = useTools();
  const { data: exercises } = useAllExercises();
  const { data: progress } = useProgress();

  const nombre =
    (user?.user_metadata?.["nombre"] as string | undefined) ??
    user?.email?.split("@")[0] ??
    "hacker";

  const byExercise = useMemo(() => {
    const m = new Map<string, Progress>();
    (progress ?? []).forEach((p) => m.set(p.exercise_id, p));
    return m;
  }, [progress]);

  const xp = useMemo(() => xpDeProgreso(progress ?? []), [progress]);

  const global = useMemo(() => {
    const ex = exercises ?? [];
    const now = new Date();
    const xpAcumulado = ex.reduce((sum, e) => {
      const estado = byExercise.get(e.id)?.estado;
      return sum + (estado ? XP_POR_ESTADO[estado] : 0);
    }, 0);
    return {
      total: ex.length,
      dominados: ex.filter((e) => byExercise.get(e.id)?.estado === "dominado").length,
      porPracticar: ex.filter((e) => estaVencido(byExercise.get(e.id) ?? null, now))
        .length,
      dominioPct: Math.round(dominio(xpAcumulado, ex.length) * 100),
    };
  }, [exercises, byExercise]);

  const logros = useMemo(
    () => evaluarLogros({ progress: progress ?? [], exercises: exercises ?? [], tools: tools ?? [] }),
    [progress, exercises, tools],
  );
  const logrosHechos = logros.filter((l) => l.hecho).length;

  // El avance por herramienta se mide por grado de dominio (cuánto ha subido
  // cada ejercicio en la escalera), no solo por los que ya están "dominados".
  // Así el trabajo de la primera sesión ya se ve reflejado.
  function statsDeHerramienta(toolId: string) {
    const ex = (exercises ?? []).filter((e) => e.tool_id === toolId);
    const total = ex.length;
    const dominados = ex.filter((e) => byExercise.get(e.id)?.estado === "dominado").length;
    const xpTool = ex.reduce((sum, e) => {
      const estado = byExercise.get(e.id)?.estado;
      return sum + (estado ? XP_POR_ESTADO[estado] : 0);
    }, 0);
    const ratio = dominio(xpTool, total);
    return { total, dominados, ratio, pct: Math.round(ratio * 100) };
  }

  return (
    <div className="space-y-10">
      <section className="anim-enter">
        <p className="text-sm text-muted-foreground">Hola, {nombre}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">Tu práctica</h1>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <LevelCard xp={xp} />
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Ejercicios" value={global.total} delay={60} />
            <StatTile label="Por practicar" value={global.porPracticar} delay={120} />
            <StatTile
              label="Dominio"
              value={global.dominioPct}
              suffix="%"
              delay={180}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionHead eyebrow="Herramientas" title="Elige un servicio" />
        {loadingTools ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        ) : (tools?.length ?? 0) === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Aún no hay herramientas cargadas. Aplica la migración de schema y el
              seed.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {tools!.map((tool, i) => {
              const s = statsDeHerramienta(tool.id);
              const completa = s.total > 0 && s.dominados === s.total;
              return (
                <Link
                  key={tool.id}
                  to="/tools/$toolId"
                  params={{ toolId: tool.id }}
                  className="anim-enter group"
                  style={{ animationDelay: `${Math.min(i * 60, 400)}ms` }}
                >
                  <div className="h-full rounded-2xl border bg-card p-5 elev-1 ease-apple transition-all duration-300 hover:-translate-y-1 hover:elev-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold tracking-tight">
                          {tool.nombre}
                        </h3>
                        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                          {tool.protocolo}
                        </p>
                      </div>
                      <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all ease-apple group-hover:bg-primary group-hover:text-primary-foreground">
                        <ArrowRight className="size-4" />
                      </span>
                    </div>

                    {tool.descripcion && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {tool.descripcion}
                      </p>
                    )}

                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                        <span>
                          {s.dominados}/{s.total} dominados
                        </span>
                        <span className={completa ? "text-success" : ""}>
                          {completa ? "completado" : `${s.pct}% dominio`}
                        </span>
                      </div>
                      <Meter value={s.ratio} tone={completa ? "success" : "primary"} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <SectionHead
            eyebrow="Logros"
            title={`${logrosHechos} de ${logros.length} desbloqueados`}
          />
          <Link
            to="/ranking"
            className="inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
          >
            Ver todos <ChevronRight className="size-4" />
          </Link>
        </div>
        <AchievementsGrid logros={logros.slice(0, 6)} />
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  suffix,
  delay = 0,
}: {
  label: string;
  value: number;
  suffix?: string;
  delay?: number;
}) {
  return (
    <div
      className="anim-enter flex flex-col justify-center rounded-2xl border bg-card px-3 py-4 text-center elev-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-2xl font-semibold tracking-tight">
        <AnimatedNumber value={value} />
        {suffix}
      </div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-0.5 text-lg font-semibold tracking-tight">{title}</h2>
    </div>
  );
}
