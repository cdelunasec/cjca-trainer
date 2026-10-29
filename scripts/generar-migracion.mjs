// Generador de migración de seed para CJCA Trainer.
//
// Lee data/<tool>.json y produce un SQL idempotente en
// supabase/seed-herramientas.sql. Cada herramienta se resuelve por `nombre`: si ya existe, se
// actualiza y se reemplazan sus commands/exercises; si no, se crea. Así el
// mismo SQL sirve para sembrar o para refrescar, sin duplicar herramientas.
//
// Todo literal va con dollar-quoting ($q$...$q$) para evitar cualquier problema
// de escape de comillas. Uso: node scripts/generar-migracion.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "data");
const outFile = join(root, "supabase", "seed-herramientas.sql");

// Orden del brief.
const TOOLS = ["ftp", "smb", "nfs", "dns", "snmp", "mysql", "mssql"];

// Dollar-quote seguro: elige un tag que no aparezca en el contenido.
function dq(value) {
  if (value === null || value === undefined) return "NULL";
  const s = String(value);
  let tag = "q";
  while (s.includes(`$${tag}$`)) tag += "q";
  return `$${tag}$${s}$${tag}$`;
}

function arr(list) {
  if (!Array.isArray(list) || list.length === 0) return "'{}'::text[]";
  return `array[${list.map(dq).join(", ")}]::text[]`;
}

function bloqueHerramienta(j) {
  const t = j.tool;
  const L = [];
  L.push(`-- ===== ${t.nombre} (${j.commands.length} comandos, ${j.exercises.length} ejercicios) =====`);
  L.push("do $seed$");
  L.push("declare t_id uuid;");
  L.push("begin");
  L.push(`  select id into t_id from public.tools where nombre = ${dq(t.nombre)} order by created_at limit 1;`);
  L.push("  if t_id is null then");
  L.push(
    `    insert into public.tools (nombre, protocolo, descripcion) values (${dq(t.nombre)}, ${dq(t.protocolo)}, ${dq(t.descripcion)}) returning id into t_id;`,
  );
  L.push("  else");
  L.push(
    `    update public.tools set protocolo = ${dq(t.protocolo)}, descripcion = ${dq(t.descripcion)} where id = t_id;`,
  );
  L.push("    delete from public.commands where tool_id = t_id;");
  L.push("    delete from public.exercises where tool_id = t_id;");
  L.push("  end if;");

  const cmds = j.commands.map(
    (c) => `    (t_id, ${dq(c.comando)}, ${dq(c.descripcion)})`,
  );
  L.push("  insert into public.commands (tool_id, comando, descripcion) values");
  L.push(cmds.join(",\n") + ";");

  const exs = j.exercises.map(
    (e) =>
      `    (t_id, ${dq(e.enunciado)}, ${arr(e.respuestas_aceptadas)}, ${dq(e.pista)}, ${dq(e.explicacion)})`,
  );
  L.push(
    "  insert into public.exercises (tool_id, enunciado, respuestas_aceptadas, pista, explicacion) values",
  );
  L.push(exs.join(",\n") + ";");

  L.push("end");
  L.push("$seed$;");
  return L.join("\n");
}

const datasets = TOOLS.map((key) =>
  JSON.parse(readFileSync(join(dataDir, `${key}.json`), "utf8")),
);

const sql = datasets.map(bloqueHerramienta).join("\n\n");

const totalCmds = datasets.reduce((n, j) => n + j.commands.length, 0);
const totalExs = datasets.reduce((n, j) => n + j.exercises.length, 0);

const out = `-- Seed de las 7 herramientas del alcance: FTP, SMB, NFS, DNS, SNMP, MySQL, MSSQL
-- (${totalCmds} comandos y ${totalExs} ejercicios). Generado con
-- node scripts/generar-migracion.mjs desde data/*.json.
--
-- Idempotente: cada herramienta se resuelve por nombre; si existe, actualiza y
-- reemplaza sus comandos/ejercicios. Ojo: al refrescar se recrean los
-- ejercicios, así que el progress de práctica se reinicia.
--
-- Aplicar con: npx supabase db query --linked -f supabase/seed-herramientas.sql

${sql}
`;

writeFileSync(outFile, out);
console.log(`OK -> ${outFile}`);
console.log(`Herramientas: ${datasets.length} | comandos: ${totalCmds} | ejercicios: ${totalExs}`);
