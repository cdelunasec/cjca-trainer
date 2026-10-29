// Capa de datos: hooks de react-query sobre el cliente de Supabase.
//
// Nota sobre tipos: `src/integrations/supabase/types.ts` está vacío hasta que
// se regenere tras aplicar la primera migración. Mientras tanto,
// accedemos a las tablas a través de un pequeño ayudante `from()` sin tipado
// estricto de Supabase y casteamos los resultados a nuestros tipos de dominio
// (`src/lib/types.ts`). Cuando los tipos autogenerados existan, este código
// sigue funcionando sin cambios.

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Command, Exercise, Progress, Tool } from "./types";
import { computeNextProgress } from "./spaced";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const from = (table: string) => (supabase as any).from(table);

export const queryKeys = {
  tools: ["tools"] as const,
  tool: (id: string) => ["tools", id] as const,
  commands: (toolId: string) => ["commands", toolId] as const,
  exercises: (toolId: string) => ["exercises", toolId] as const,
  progress: ["progress"] as const,
};

export function useTools() {
  return useQuery({
    queryKey: queryKeys.tools,
    queryFn: async (): Promise<Tool[]> => {
      const { data, error } = await from("tools")
        .select("*")
        .order("nombre", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Tool[];
    },
  });
}

export function useTool(id: string) {
  return useQuery({
    queryKey: queryKeys.tool(id),
    enabled: !!id,
    queryFn: async (): Promise<Tool | null> => {
      const { data, error } = await from("tools").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data ?? null) as Tool | null;
    },
  });
}

export function useCommands(toolId: string) {
  return useQuery({
    queryKey: queryKeys.commands(toolId),
    enabled: !!toolId,
    queryFn: async (): Promise<Command[]> => {
      const { data, error } = await from("commands")
        .select("*")
        .eq("tool_id", toolId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Command[];
    },
  });
}

export function useExercises(toolId: string) {
  return useQuery({
    queryKey: queryKeys.exercises(toolId),
    enabled: !!toolId,
    queryFn: async (): Promise<Exercise[]> => {
      const { data, error } = await from("exercises")
        .select("*")
        .eq("tool_id", toolId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Exercise[];
    },
  });
}

// Todos los ejercicios (todas las herramientas). Útil para el tracker global y
// la sesión de repaso.
export function useAllExercises() {
  return useQuery({
    queryKey: ["exercises", "all"] as const,
    queryFn: async (): Promise<Exercise[]> => {
      const { data, error } = await from("exercises")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Exercise[];
    },
  });
}

// Todo el progreso del usuario autenticado. RLS garantiza que solo vea lo suyo.
export function useProgress() {
  return useQuery({
    queryKey: queryKeys.progress,
    queryFn: async (): Promise<Progress[]> => {
      const { data, error } = await from("progress").select("*");
      if (error) throw error;
      return (data ?? []) as Progress[];
    },
  });
}

// Fila agregada del leaderboard (una por usuario y herramienta). Viene de la
// función SQL security-definer get_leaderboard, que expone solo conteos + XP,
// nunca el detalle ejercicio por ejercicio de otros usuarios.
export interface LeaderboardRow {
  user_id: string;
  nombre: string | null;
  tool_id: string;
  vistos: number;
  dominados: number;
  xp: number;
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"] as const,
    queryFn: async (): Promise<LeaderboardRow[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc("get_leaderboard");
      if (error) throw error;
      return (data ?? []) as LeaderboardRow[];
    },
  });
}

export interface RecordAttemptInput {
  userId: string;
  exercise: Exercise;
  prev: Progress | null;
  acerto: boolean;
}

// Registra un intento: calcula el nuevo estado de repetición espaciada y hace
// upsert en `progress` por (user_id, exercise_id).
export function useRecordAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, exercise, prev, acerto }: RecordAttemptInput) => {
      const next = computeNextProgress(prev, acerto);
      const row = {
        user_id: userId,
        exercise_id: exercise.id,
        veces_visto: next.veces_visto,
        veces_fallado: next.veces_fallado,
        ultima_vez: next.ultima_vez,
        proxima_vez: next.proxima_vez,
        estado: next.estado,
      };
      const { data, error } = await from("progress")
        .upsert(row, { onConflict: "user_id,exercise_id" })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as Progress;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.progress });
    },
  });
}
