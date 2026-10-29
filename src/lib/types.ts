// Tipos de dominio de CJCA Trainer.
//
// NO confundir con `src/integrations/supabase/types.ts`, que se regenera
// tras cada migración. Estos son tipos propios, estables, que la app usa para
// tipar consultas y componentes. Cuando se aplique el schema del Paso 2 y se
// regenere el archivo autogenerado, estos tipos deben seguir coincidiendo con
// las columnas descritas en el brief.

export interface Tool {
  id: string;
  nombre: string;
  protocolo: string;
  descripcion: string | null;
  created_at?: string;
}

export interface Command {
  id: string;
  tool_id: string;
  comando: string;
  descripcion: string | null;
  created_at?: string;
}

export interface Exercise {
  id: string;
  tool_id: string;
  enunciado: string;
  respuestas_aceptadas: string[];
  pista: string | null;
  explicacion: string | null;
  created_at?: string;
}

// Estado de repetición espaciada. Es una escalera ordenada (Leitner): un
// ejercicio sube un peldaño al acertarse y cae a `aprendiendo` al fallarse.
// Ver `spaced.ts`. Un ejercicio sin fila en `progress` se considera "nuevo".
export type EstadoProgreso =
  | "aprendiendo"
  | "repaso_1"
  | "repaso_2"
  | "repaso_3"
  | "dominado";

export interface Progress {
  id: string;
  user_id: string;
  exercise_id: string;
  veces_visto: number;
  veces_fallado: number;
  ultima_vez: string | null; // ISO timestamp
  proxima_vez: string | null; // ISO timestamp; cuándo vuelve a salir
  estado: EstadoProgreso;
}
