// Niveles y XP. Función pura.
//
// El XP sale del estado de repetición espaciada de cada ejercicio: mientras más
// dominado, más aporta. Los pesos DEBEN coincidir con los del cálculo en la
// función SQL get_leaderboard (ver supabase/migrations),
// para que el nivel salga igual en tu perfil y en el ranking.

import type { EstadoProgreso, Progress } from "./types";

export const XP_POR_ESTADO: Record<EstadoProgreso, number> = {
  aprendiendo: 2,
  repaso_1: 4,
  repaso_2: 6,
  repaso_3: 8,
  dominado: 12,
};

export interface Nivel {
  indice: number;
  nombre: string;
  min: number;
}

// Escalera de niveles. Calibrada para ~41 ejercicios (XP máx ≈ 492).
const NIVELES: Omit<Nivel, "indice">[] = [
  { nombre: "Iniciado", min: 0 },
  { nombre: "Recon", min: 40 },
  { nombre: "Enumerador", min: 100 },
  { nombre: "Operador", min: 180 },
  { nombre: "Analista", min: 280 },
  { nombre: "Especialista", min: 380 },
  { nombre: "Maestro CJCA", min: 460 },
];

export function xpDeProgreso(rows: Pick<Progress, "estado">[]): number {
  return rows.reduce((sum, r) => sum + (XP_POR_ESTADO[r.estado] ?? 0), 0);
}

/** XP que aporta un ejercicio totalmente dominado. */
export const XP_MAX_EJERCICIO = XP_POR_ESTADO.dominado;

/**
 * Grado de dominio (0..1) de un conjunto de ejercicios: XP acumulado sobre el
 * XP máximo posible. A diferencia de contar solo los "dominados", esto refleja
 * el avance desde el primer acierto, que es lo que el usuario ve moverse.
 */
export function dominio(xpAcumulado: number, totalEjercicios: number): number {
  if (totalEjercicios <= 0) return 0;
  return Math.min(1, xpAcumulado / (XP_MAX_EJERCICIO * totalEjercicios));
}

export interface EstadoNivel {
  actual: Nivel;
  siguiente: Nivel | null;
  xp: number;
  xpEnNivel: number; // XP acumulado dentro del nivel actual
  xpParaSiguiente: number; // XP total que exige el siguiente nivel
  progreso: number; // 0..1 hacia el siguiente nivel (1 si es el máximo)
}

export function nivelDeXp(xp: number): EstadoNivel {
  let idx = 0;
  for (let i = 0; i < NIVELES.length; i++) {
    if (xp >= NIVELES[i]!.min) idx = i;
  }
  const actual: Nivel = { indice: idx, ...NIVELES[idx]! };
  const sig = NIVELES[idx + 1];
  const siguiente: Nivel | null = sig ? { indice: idx + 1, ...sig } : null;

  const progreso = siguiente
    ? Math.min(1, (xp - actual.min) / (siguiente.min - actual.min))
    : 1;

  return {
    actual,
    siguiente,
    xp,
    xpEnNivel: xp - actual.min,
    xpParaSiguiente: siguiente ? siguiente.min : actual.min,
    progreso,
  };
}

export const TOTAL_NIVELES = NIVELES.length;
