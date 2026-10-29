// Logros. Función pura, se evalúan contra el progreso del usuario.
//
// Todo se calcula desde datos que ya tenemos (progress + exercises + tools),
// sin tablas extra. Un logro puede traer `progreso` para mostrar barra.

import type { LucideIcon } from "lucide-react";
import {
  Award,
  Compass,
  Flag,
  Gauge,
  Medal,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import type { Exercise, Progress, Tool } from "./types";

export interface Logro {
  id: string;
  nombre: string;
  descripcion: string;
  icon: LucideIcon;
  hecho: boolean;
  progreso?: { hecho: number; total: number };
}

export interface LogrosContext {
  progress: Progress[];
  exercises: Exercise[];
  tools: Tool[];
}

export function evaluarLogros({ progress, exercises, tools }: LogrosContext): Logro[] {
  const toolDeEjercicio = new Map<string, string>();
  exercises.forEach((e) => toolDeEjercicio.set(e.id, e.tool_id));

  const progByExercise = new Map<string, Progress>();
  progress.forEach((p) => progByExercise.set(p.exercise_id, p));

  const totalEjercicios = exercises.length;
  const dominados = progress.filter((p) => p.estado === "dominado").length;
  const vistos = progress.length;

  // Por herramienta: total, dominados y suma de fallos.
  const porTool = new Map<string, { total: number; dominados: number; fallos: number }>();
  tools.forEach((t) => porTool.set(t.id, { total: 0, dominados: 0, fallos: 0 }));
  exercises.forEach((e) => {
    const acc = porTool.get(e.tool_id);
    if (acc) acc.total += 1;
  });
  progress.forEach((p) => {
    const toolId = toolDeEjercicio.get(p.exercise_id);
    if (!toolId) return;
    const acc = porTool.get(toolId);
    if (!acc) return;
    if (p.estado === "dominado") acc.dominados += 1;
    acc.fallos += p.veces_fallado;
  });

  const toolsTocadas = new Set(
    progress.map((p) => toolDeEjercicio.get(p.exercise_id)).filter(Boolean),
  ).size;
  const toolsCompletas = [...porTool.values()].filter(
    (a) => a.total > 0 && a.dominados === a.total,
  ).length;
  const comeback = progress.some((p) => p.veces_fallado >= 3 && p.estado === "dominado");
  const impecable = [...porTool.values()].some(
    (a) => a.total > 0 && a.dominados === a.total && a.fallos === 0,
  );

  const generales: Logro[] = [
    {
      id: "primer-contacto",
      nombre: "Primer contacto",
      descripcion: "Resolviste tu primer ejercicio.",
      icon: Flag,
      hecho: vistos >= 1,
    },
    {
      id: "calentando",
      nombre: "Calentando",
      descripcion: "Domina 10 ejercicios.",
      icon: Gauge,
      hecho: dominados >= 10,
      progreso: { hecho: Math.min(dominados, 10), total: 10 },
    },
    {
      id: "en-forma",
      nombre: "En forma",
      descripcion: "Domina 20 ejercicios.",
      icon: Target,
      hecho: dominados >= 20,
      progreso: { hecho: Math.min(dominados, 20), total: 20 },
    },
    {
      id: "explorador",
      nombre: "Explorador",
      descripcion: "Practica al menos un ejercicio de cada herramienta.",
      icon: Compass,
      hecho: tools.length > 0 && toolsTocadas === tools.length,
      progreso: { hecho: toolsTocadas, total: tools.length },
    },
    {
      id: "primera-bandera",
      nombre: "Primera bandera",
      descripcion: "Completa tu primera herramienta al 100%.",
      icon: Medal,
      hecho: toolsCompletas >= 1,
    },
    {
      id: "perseverante",
      nombre: "Perseverante",
      descripcion: "Domina un ejercicio que fallaste 3 veces o más.",
      icon: RotateCcw,
      hecho: comeback,
    },
    {
      id: "impecable",
      nombre: "Impecable",
      descripcion: "Completa una herramienta sin fallar ni una vez.",
      icon: ShieldCheck,
      hecho: impecable,
    },
    {
      id: "cjca-ready",
      nombre: "CJCA Ready",
      descripcion: "Domina los ejercicios de las 7 herramientas.",
      icon: Trophy,
      hecho: totalEjercicios > 0 && dominados === totalEjercicios,
      progreso: { hecho: dominados, total: totalEjercicios },
    },
  ];

  // Un logro por herramienta completada.
  const porHerramienta: Logro[] = tools.map((t) => {
    const acc = porTool.get(t.id) ?? { total: 0, dominados: 0, fallos: 0 };
    return {
      id: `tool-${t.id}`,
      nombre: `${t.nombre} dominado`,
      descripcion: `Domina todos los ejercicios de ${t.nombre}.`,
      icon: Award,
      hecho: acc.total > 0 && acc.dominados === acc.total,
      progreso: { hecho: acc.dominados, total: acc.total },
    };
  });

  return [...generales, ...porHerramienta];
}

// Icono de "logro genérico" por si hace falta un fallback.
export const IconoLogro = Sparkles;
