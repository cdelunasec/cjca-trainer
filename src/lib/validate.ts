// Validación local de respuestas, sin IA. Rápida y offline.
//
// La comparación es flexible con el estilo de escritura, como lo sería una
// terminal real:
//  - El orden de los argumentos no importa (nmap -p21 10.10.10.10 -sV -sC ==
//    nmap -sC -sV 10.10.10.10 -p21).
//  - Mayúsculas/minúsculas indiferentes (-sV == -sv).
//  - -p21 == -p 21, --script=ftp-anon == --script ftp-anon.
//  - Flags combinadas de nmap se expanden: -sCV == -sC -sV == -sV -sC.
//  - //10.10.10.10 == 10.10.10.10 (smbclient -L acepta ambas formas).
//  - Un `sudo` delante o un `$` de prompt copiado no invalidan la respuesta.
//  - Placeholders como <IP> equivalen a la IP de ejemplo.
//
// El `;` final de SQL SÍ se exige a propósito: es parte del comando y conviene
// no agarrar el vicio de omitirlo (show databases != show databases;).

const IP_EJEMPLO = "10.10.10.10";
const PLACEHOLDERS = new Set(["<ip>", "<objetivo>", "<target>", "<host>"]);
// Prefijos que no cambian el comando en la práctica y se ignoran.
const PREFIJOS_IGNORADOS = new Set(["sudo", "$", "#"]);

/**
 * Normaliza una cadena para comparar: recorta los extremos, colapsa cualquier
 * secuencia de espacios en blanco a un solo espacio y pasa a minúsculas.
 */
export function normalize(input: string): string {
  return input.trim().replace(/\s+/g, " ").toLowerCase();
}

function limpiarToken(token: string): string {
  let t = token;
  // //host  ->  host   (smbclient -L admite las dos formas)
  if (t.startsWith("//")) t = t.slice(2);
  // Barra final irrelevante: ./target-nfs/ == ./target-nfs
  if (t.length > 1 && t.endsWith("/")) t = t.slice(0, -1);
  return t;
}

function expandirToken(token: string): string[] {
  const limpio = limpiarToken(token);
  if (PLACEHOLDERS.has(limpio)) return [IP_EJEMPLO];

  // --script=valor  ->  --script valor
  const largo = /^(--[a-z0-9-]+)=(.+)$/.exec(limpio);
  if (largo) return [largo[1]!, largo[2]!];

  // -p21 -> -p 21 ; -p21,22 -> -p 21,22
  const puerto = /^(-p)([0-9].*)$/.exec(limpio);
  if (puerto) return [puerto[1]!, puerto[2]!];

  // -sCV -> -sC -sV  (flags de escaneo combinadas)
  const escaneo = /^-s([a-z]{2,})$/.exec(limpio);
  if (escaneo) return escaneo[1]!.split("").map((c) => `-s${c}`);

  return [limpio];
}

/**
 * Convierte un comando en una forma canónica: el binario primero y el resto de
 * argumentos expandidos y ordenados alfabéticamente, de modo que el orden en
 * que se escriban no importe.
 */
export function canonical(command: string): string {
  // Ojo: NO se recorta el `;` final; en SQL es parte del comando. Solo se pega
  // al token anterior, para que "show databases ;" == "show databases;".
  let tokens = normalize(command).replace(/\s+;/g, ";").split(" ").filter(Boolean);

  // Ignorar prefijos irrelevantes (sudo, prompt copiado).
  while (tokens.length > 1 && PREFIJOS_IGNORADOS.has(tokens[0]!)) {
    tokens = tokens.slice(1);
  }
  if (tokens.length === 0) return "";

  const [bin, ...resto] = tokens as [string, ...string[]];
  const expandidos = resto.flatMap(expandirToken);
  return [limpiarToken(bin), ...expandidos.sort()].join(" ");
}

/** Distancia de edición (Levenshtein). Para detectar erratas de una o dos letras. */
function distancia(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const fila = [i];
    for (let j = 1; j <= n; j++) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
      fila[j] = Math.min(prev[j]! + 1, fila[j - 1]! + 1, prev[j - 1]! + coste);
    }
    prev = fila;
  }
  return prev[n]!;
}

export interface Errata {
  /** Lo que escribió el usuario. */
  escrito: string;
  /** Lo que debía escribir. */
  esperado: string;
}

/**
 * Si la respuesta falló por una errata (un solo token mal escrito, tipo
 * `fpt-anon` en vez de `ftp-anon`), devuelve ese par para poder señalarlo.
 * No la da por buena: en una terminal real ese comando también falla.
 */
export function detectarErrata(userInput: string, aceptadas: string[]): Errata | null {
  const tokensUsuario = canonical(userInput).split(" ").filter(Boolean);
  if (tokensUsuario.length === 0) return null;

  let mejor: (Errata & { dist: number }) | null = null;

  for (const variante of aceptadas) {
    const tokensOk = canonical(variante).split(" ").filter(Boolean);
    if (tokensOk.length !== tokensUsuario.length) continue;

    // Quita los tokens que coinciden; debe sobrar exactamente uno de cada lado.
    const sobranUsuario = [...tokensUsuario];
    const sobranOk: string[] = [];
    for (const t of tokensOk) {
      const i = sobranUsuario.indexOf(t);
      if (i >= 0) sobranUsuario.splice(i, 1);
      else sobranOk.push(t);
    }
    if (sobranUsuario.length !== 1 || sobranOk.length !== 1) continue;

    const escrito = sobranUsuario[0]!;
    const esperado = sobranOk[0]!;
    const d = distancia(escrito, esperado);
    // Tolerancia proporcional: en tokens cortos exigimos 1 sola letra de diferencia.
    const limite = Math.min(2, Math.max(1, Math.floor(esperado.length / 3)));
    if (d > 0 && d <= limite && (!mejor || d < mejor.dist)) {
      mejor = { escrito, esperado, dist: d };
    }
  }

  return mejor ? { escrito: mejor.escrito, esperado: mejor.esperado } : null;
}

/**
 * Devuelve true si la respuesta del usuario coincide con alguna de las variantes
 * aceptadas. Una respuesta vacía nunca es correcta.
 */
export function isCorrect(userInput: string, aceptadas: string[]): boolean {
  const plano = normalize(userInput);
  if (plano === "") return false;
  const canon = canonical(userInput);
  if (canon === "") return false;
  return aceptadas.some(
    (variante) => normalize(variante) === plano || canonical(variante) === canon,
  );
}
