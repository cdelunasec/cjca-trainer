UPDATE public.exercises
SET respuestas_aceptadas = ARRAY(
  SELECT v
  FROM unnest(respuestas_aceptadas) AS v
  WHERE rtrim(v) LIKE '%;'
)
WHERE EXISTS (
  SELECT 1
  FROM unnest(respuestas_aceptadas) AS v
  WHERE rtrim(v) LIKE '%;'
);