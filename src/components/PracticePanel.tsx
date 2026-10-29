// Motor de práctica: corre una sesión sobre un conjunto de ejercicios.
//
// - Ordena la cola priorizando lo vencido/nuevo (repetición espaciada).
// - El usuario teclea el comando y comprueba localmente (sin IA).
// - Botones de pista y de mostrar respuesta; siempre se muestra la explicación.
// - Cada intento se guarda en `progress` y recalcula la próxima aparición.
// - Fallar o pedir la respuesta reencola el ejercicio para la misma sesión.
// - Feedback animado: acierto hace "pop", fallo hace "shake".
// - La sesión (cola + posición) se guarda por herramienta, así que salir a la
//   cheatsheet o a otra sección y volver te deja donde ibas.

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Eye, Lightbulb, RotateCcw, TrendingUp, XCircle } from "lucide-react";

import type { Exercise, Progress } from "@/lib/types";
import { detectarErrata, isCorrect } from "@/lib/validate";
import {
  computeNextProgress,
  describeProxima,
  estaVencido,
  ETIQUETA_ESTADO,
  peldanoDeEstado,
  PELDANOS,
  type AttemptResult,
} from "@/lib/spaced";
import { useAuth } from "@/lib/auth";
import { useProgress, useRecordAttempt } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Meter } from "@/components/Meter";

type Phase = "answering" | "correct" | "incorrect" | "revealed";

function ordenarPorVencimiento(
  exercises: Exercise[],
  byExercise: Map<string, Progress>,
): string[] {
  const now = new Date();
  return [...exercises]
    .sort((a, b) => {
      const va = estaVencido(byExercise.get(a.id) ?? null, now) ? 0 : 1;
      const vb = estaVencido(byExercise.get(b.id) ?? null, now) ? 0 : 1;
      return va - vb;
    })
    .map((e) => e.id);
}

/** Sesión guardada en el navegador: la cola y por dónde ibas. */
interface SesionGuardada {
  queue: string[];
  pos: number;
}

function leerSesion(key: string | null, validIds: Set<string>): SesionGuardada | null {
  if (!key || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const p = JSON.parse(raw) as SesionGuardada;
    const ok =
      Array.isArray(p.queue) &&
      p.queue.length > 0 &&
      typeof p.pos === "number" &&
      p.pos >= 0 &&
      p.pos < p.queue.length &&
      p.queue.every((id) => validIds.has(id));
    return ok ? { queue: p.queue, pos: p.pos } : null;
  } catch {
    return null;
  }
}

export function PracticePanel({
  exercises,
  scope,
}: {
  exercises: Exercise[];
  /** Identifica la sesión a guardar (id de la herramienta, o "repaso"). */
  scope: string;
}) {
  const { user } = useAuth();
  const { data: progress } = useProgress();
  const recordAttempt = useRecordAttempt();

  const byExercise = useMemo(() => {
    const m = new Map<string, Progress>();
    (progress ?? []).forEach((p) => m.set(p.exercise_id, p));
    return m;
  }, [progress]);

  const byId = useMemo(() => {
    const m = new Map<string, Exercise>();
    exercises.forEach((e) => m.set(e.id, e));
    return m;
  }, [exercises]);

  const [queue, setQueue] = useState<string[]>([]);
  const [pos, setPos] = useState(0);
  const [input, setInput] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [phase, setPhase] = useState<Phase>("answering");
  const [attemptKey, setAttemptKey] = useState(0);
  const [ultimo, setUltimo] = useState<AttemptResult | null>(null);

  const storageKey = user ? `cjca:sesion:${user.id}:${scope}` : null;
  const iniciado = useRef(false);

  // Al montar: retoma la sesión guardada si sigue siendo válida; si no, arma
  // una nueva ordenada por vencimiento.
  useEffect(() => {
    if (!exercises.length || iniciado.current) return;
    iniciado.current = true;
    const ids = new Set(exercises.map((e) => e.id));
    const guardada = leerSesion(storageKey, ids);
    if (guardada) {
      setQueue(guardada.queue);
      setPos(guardada.pos);
    } else {
      setQueue(ordenarPorVencimiento(exercises, byExercise));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises, storageKey]);

  // Guarda el avance. Si la tanda terminó, borra la sesión para que la próxima
  // vez arranque fresca con lo que toque.
  useEffect(() => {
    if (!storageKey || queue.length === 0 || typeof window === "undefined") return;
    try {
      if (pos >= queue.length) window.localStorage.removeItem(storageKey);
      else window.localStorage.setItem(storageKey, JSON.stringify({ queue, pos }));
    } catch {
      // almacenamiento no disponible; la sesión simplemente no se recuerda
    }
  }, [storageKey, queue, pos]);

  if (exercises.length === 0) {
    return (
      <div className="rounded-2xl border bg-card py-12 text-center text-sm text-muted-foreground elev-1">
        Aún no hay ejercicios para esta herramienta. Se cargarán por tandas.
      </div>
    );
  }

  const finished = queue.length > 0 && pos >= queue.length;
  const currentId = finished ? undefined : queue[pos];
  const current = currentId ? byId.get(currentId) : undefined;

  function reiniciar() {
    if (storageKey && typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // sin almacenamiento; nada que limpiar
      }
    }
    setQueue(ordenarPorVencimiento(exercises, byExercise));
    setPos(0);
    setInput("");
    setShowHint(false);
    setPhase("answering");
    setUltimo(null);
  }

  // Registra el intento y devuelve el nuevo estado, para poder mostrarle al
  // usuario a qué peldaño subió y cuándo vuelve el ejercicio.
  function registrar(ex: Exercise, acerto: boolean) {
    const prev = byExercise.get(ex.id) ?? null;
    setUltimo(computeNextProgress(prev, acerto));
    if (!user) return;
    recordAttempt.mutate({ userId: user.id, exercise: ex, prev, acerto });
  }

  function comprobar() {
    if (!current) return;
    const acerto = isCorrect(input, current.respuestas_aceptadas);
    registrar(current, acerto);
    setPhase(acerto ? "correct" : "incorrect");
    setAttemptKey((k) => k + 1);
  }

  function revelar() {
    if (!current) return;
    registrar(current, false);
    setPhase("revealed");
    setAttemptKey((k) => k + 1);
  }

  function siguiente() {
    if (!current) return;
    if (phase === "incorrect" || phase === "revealed") {
      setQueue((q) => [...q, current.id]);
    }
    setPos((p) => p + 1);
    setInput("");
    setShowHint(false);
    setPhase("answering");
    setUltimo(null);
  }

  if (finished || !current) {
    return (
      <div className="anim-enter flex flex-col items-center gap-4 rounded-2xl border bg-card py-14 text-center elev-1">
        <div className="anim-pop flex size-14 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="size-8 text-success" />
        </div>
        <div>
          <p className="font-medium">Completaste la tanda</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Cada acierto sube el ejercicio un peldaño y lo espacia en el tiempo.
            Un ejercicio queda <strong className="font-medium">Dominado</strong>{" "}
            tras acertarlo en {PELDANOS - 1} repasos separados por días.
          </p>
        </div>
        <Button onClick={reiniciar} variant="outline" className="rounded-full">
          <RotateCcw className="size-4" />
          Practicar de nuevo
        </Button>
      </div>
    );
  }

  const answered = phase !== "answering";
  const respuestaPrincipal = current.respuestas_aceptadas[0] ?? "";
  // Si falló por una letra bailada, señalamos cuál en vez del genérico.
  const errata =
    phase === "incorrect"
      ? detectarErrata(input, current.respuestas_aceptadas)
      : null;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
          <span>
            Ejercicio {pos + 1} de {queue.length}
          </span>
        </div>
        <Meter value={(pos + (answered ? 1 : 0)) / queue.length} />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card elev-1">
        <div className="space-y-4 p-5">
          <p className="text-base leading-relaxed">{current.enunciado}</p>

          <div className="overflow-hidden rounded-xl border bg-muted/40">
            <div className="flex items-center gap-1.5 border-b bg-secondary/60 px-3 py-1.5">
              <span className="size-2 rounded-full bg-muted-foreground/30" />
              <span className="size-2 rounded-full bg-muted-foreground/30" />
              <span className="size-2 rounded-full bg-muted-foreground/30" />
              <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                comando
              </span>
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="escribe el comando…"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              className="min-h-20 resize-none border-0 bg-transparent font-mono text-sm shadow-none focus-visible:ring-0"
              disabled={answered}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !answered) {
                  e.preventDefault();
                  comprobar();
                }
              }}
            />
          </div>

          {showHint && current.pista && (
            <div className="anim-enter flex gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{current.pista}</span>
            </div>
          )}

          {phase === "correct" && (
            <div
              key={attemptKey}
              className="anim-pop flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-sm"
            >
              <CheckCircle2 className="size-4 shrink-0 text-success" />
              <span className="font-medium">¡Correcto!</span>
            </div>
          )}

          {(phase === "incorrect" || phase === "revealed") && (
            <div
              key={attemptKey}
              className={
                phase === "incorrect"
                  ? "anim-shake space-y-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm"
                  : "anim-enter space-y-2 rounded-xl border bg-secondary/60 p-3 text-sm"
              }
            >
              <div className="flex items-center gap-2">
                {phase === "incorrect" ? (
                  <XCircle className="size-4 shrink-0 text-destructive" />
                ) : (
                  <Eye className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className={phase === "incorrect" ? "" : "text-muted-foreground"}>
                  {phase !== "incorrect" ? (
                    "Respuesta:"
                  ) : errata ? (
                    <>
                      Casi. Revisa esto: escribiste{" "}
                      <code className="rounded bg-destructive/15 px-1 font-mono text-xs">
                        {errata.escrito}
                      </code>{" "}
                      y va{" "}
                      <code className="rounded bg-success/15 px-1 font-mono text-xs">
                        {errata.esperado}
                      </code>
                      .
                    </>
                  ) : (
                    "No es la respuesta esperada."
                  )}
                </span>
              </div>
              <code className="block overflow-x-auto rounded-lg bg-card px-3 py-2 font-mono text-xs elev-1">
                {respuestaPrincipal}
              </code>
            </div>
          )}

          {answered && current.explicacion && (
            <div className="anim-enter rounded-xl border bg-muted/40 p-3 text-sm leading-relaxed">
              <span className="font-medium">Por qué: </span>
              {current.explicacion}
            </div>
          )}

          {answered && ultimo && (
            <div className="anim-enter flex items-center gap-2 rounded-xl border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
              <TrendingUp className="size-3.5 shrink-0 text-primary" />
              <span>
                Nivel del ejercicio:{" "}
                <span className="font-medium text-foreground">
                  {ETIQUETA_ESTADO[ultimo.estado]}
                </span>{" "}
                ({peldanoDeEstado(ultimo.estado)}/{PELDANOS}) · vuelve{" "}
                {describeProxima(ultimo.proxima_vez)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {!answered ? (
          <>
            <Button onClick={comprobar} disabled={!input.trim()} className="rounded-full">
              Comprobar
            </Button>
            {current.pista && (
              <Button
                variant="ghost"
                onClick={() => setShowHint((s) => !s)}
                disabled={showHint}
                className="rounded-full"
              >
                <Lightbulb className="size-4" />
                Pista
              </Button>
            )}
            <Button variant="outline" onClick={revelar} className="rounded-full">
              <Eye className="size-4" />
              Mostrar respuesta
            </Button>
          </>
        ) : (
          <Button onClick={siguiente} className="rounded-full">
            Siguiente
          </Button>
        )}
      </div>
    </div>
  );
}
