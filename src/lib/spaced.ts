// Repetición espaciada (Leitner simplificado). Función pura y testeable.
//
// Regla del brief:
//  - Si el usuario falla o pide "mostrar respuesta", el ejercicio se reprograma
//    para volver a salir pronto.
//  - Los ejercicios acertados se espacian más en el tiempo.
//
// Modelo: una escalera ordenada de estados. Al acertar, el ejercicio sube un
// peldaño y su intervalo crece. Al fallar, cae al primer peldaño
// ("aprendiendo") y reaparece en minutos. El campo `estado` de la tabla
// `progress` guarda el peldaño actual, así que no hace falta ninguna columna
// extra fuera del schema del brief.

import type { EstadoProgreso, Progress } from "./types";

const MINUTO = 60 * 1000;
const DIA = 24 * 60 * MINUTO;

// Peldaños en orden. Cada uno define el intervalo hasta la próxima aparición
// cuando el ejercicio queda EN ese estado tras un acierto.
const LADDER: { estado: EstadoProgreso; intervalMs: number }[] = [
  { estado: "aprendiendo", intervalMs: 10 * MINUTO },
  { estado: "repaso_1", intervalMs: 1 * DIA },
  { estado: "repaso_2", intervalMs: 3 * DIA },
  { estado: "repaso_3", intervalMs: 7 * DIA },
  { estado: "dominado", intervalMs: 16 * DIA },
];

function indexOfEstado(estado: EstadoProgreso | null | undefined): number {
  if (!estado) return -1; // nuevo: sin fila de progreso todavía
  const i = LADDER.findIndex((p) => p.estado === estado);
  return i; // -1 si el valor es desconocido; se tratará como nuevo
}

export interface AttemptResult {
  estado: EstadoProgreso;
  proxima_vez: string; // ISO
  ultima_vez: string; // ISO
  veces_visto: number;
  veces_fallado: number;
}

/**
 * Calcula el nuevo estado de progreso tras un intento.
 *
 * @param prev   Fila de progreso existente, o null si es la primera vez.
 * @param acerto true si el usuario respondió bien; false si falló o pidió ver
 *               la respuesta (ambos casos cuentan como fallo para el repaso).
 * @param now    Momento del intento (inyectable para tests).
 */
export function computeNextProgress(
  prev: Pick<Progress, "veces_visto" | "veces_fallado" | "estado"> | null,
  acerto: boolean,
  now: Date = new Date(),
): AttemptResult {
  const prevIndex = prev ? indexOfEstado(prev.estado) : -1;
  const vistos = (prev?.veces_visto ?? 0) + 1;
  const fallados = (prev?.veces_fallado ?? 0) + (acerto ? 0 : 1);

  // Acierto: un ejercicio nuevo entra directo a repaso_1 (1 día); si ya tenía
  // progreso, sube un peldaño (tope en el último). Fallo: vuelve a "aprendiendo".
  const last = LADDER.length - 1;
  const nextIndex = acerto
    ? prevIndex < 0
      ? 1
      : Math.min(prevIndex + 1, last)
    : 0;
  const rung = LADDER[Math.max(0, Math.min(nextIndex, last))]!;

  return {
    estado: rung.estado,
    proxima_vez: new Date(now.getTime() + rung.intervalMs).toISOString(),
    ultima_vez: now.toISOString(),
    veces_visto: vistos,
    veces_fallado: fallados,
  };
}

/** Un ejercicio está "vencido" (toca repasarlo) si nunca se ha visto o si su
 *  próxima aparición ya pasó. */
export function estaVencido(
  progress: Pick<Progress, "proxima_vez"> | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!progress || !progress.proxima_vez) return true;
  return new Date(progress.proxima_vez).getTime() <= now.getTime();
}

/** ¿Se considera dominado? Útil para el tracker. */
export function estaDominado(estado: EstadoProgreso | null | undefined): boolean {
  return estado === "dominado";
}

/** Nombre legible del peldaño, para mostrárselo al usuario. */
export const ETIQUETA_ESTADO: Record<EstadoProgreso, string> = {
  aprendiendo: "Aprendiendo",
  repaso_1: "Repaso 1",
  repaso_2: "Repaso 2",
  repaso_3: "Repaso 3",
  dominado: "Dominado",
};

/** Cuántos peldaños tiene la escalera (para "nivel 2 de 5"). */
export const PELDANOS = LADDER.length;

/** Posición (1..PELDANOS) del estado en la escalera. */
export function peldanoDeEstado(estado: EstadoProgreso): number {
  const i = LADDER.findIndex((p) => p.estado === estado);
  return i < 0 ? 1 : i + 1;
}

/** "en 10 minutos", "en 1 día", "en 3 días" — para decir cuándo vuelve. */
export function describeProxima(iso: string, now: Date = new Date()): string {
  const ms = new Date(iso).getTime() - now.getTime();
  if (ms <= 0) return "ahora";
  const minutos = Math.round(ms / 60000);
  if (minutos < 60) return `en ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `en ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? "en 1 día" : `en ${dias} días`;
}
