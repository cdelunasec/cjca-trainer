UPDATE public.commands SET
  comando = replace(replace(comando, '<IP>', '10.10.10.10'), '<ip>', '10.10.10.10'),
  descripcion = replace(replace(descripcion, '<IP>', '10.10.10.10'), '<ip>', '10.10.10.10');

UPDATE public.exercises SET
  enunciado = replace(replace(enunciado, '<IP>', '10.10.10.10'), '<ip>', '10.10.10.10'),
  pista = replace(replace(pista, '<IP>', '10.10.10.10'), '<ip>', '10.10.10.10'),
  explicacion = replace(replace(explicacion, '<IP>', '10.10.10.10'), '<ip>', '10.10.10.10'),
  respuestas_aceptadas = (
    SELECT array_agg(DISTINCT replace(replace(v, '<IP>', '10.10.10.10'), '<ip>', '10.10.10.10'))
    FROM unnest(respuestas_aceptadas) AS v
  );