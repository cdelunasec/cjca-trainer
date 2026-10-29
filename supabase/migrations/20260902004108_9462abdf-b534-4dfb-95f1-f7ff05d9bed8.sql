-- ========= TABLAS =========

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  created_at timestamptz not null default now()
);

create table public.tools (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  protocolo text not null,
  descripcion text,
  created_at timestamptz not null default now()
);

create table public.commands (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.tools (id) on delete cascade,
  comando text not null,
  descripcion text,
  created_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.tools (id) on delete cascade,
  enunciado text not null,
  respuestas_aceptadas text[] not null default '{}',
  pista text,
  explicacion text,
  created_at timestamptz not null default now()
);

create table public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  veces_visto integer not null default 0,
  veces_fallado integer not null default 0,
  ultima_vez timestamptz,
  proxima_vez timestamptz,
  estado text not null default 'aprendiendo',
  unique (user_id, exercise_id)
);

-- ========= GRANTS =========

grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

grant select on public.tools to authenticated;
grant all on public.tools to service_role;

grant select on public.commands to authenticated;
grant all on public.commands to service_role;

grant select on public.exercises to authenticated;
grant all on public.exercises to service_role;

grant select, insert, update, delete on public.progress to authenticated;
grant all on public.progress to service_role;

-- ========= RLS =========

alter table public.profiles enable row level security;
alter table public.tools enable row level security;
alter table public.commands enable row level security;
alter table public.exercises enable row level security;
alter table public.progress enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "tools_read" on public.tools
  for select to authenticated using (true);
create policy "commands_read" on public.commands
  for select to authenticated using (true);
create policy "exercises_read" on public.exercises
  for select to authenticated using (true);

create policy "progress_select_own" on public.progress
  for select to authenticated using (auth.uid() = user_id);
create policy "progress_insert_own" on public.progress
  for insert to authenticated with check (auth.uid() = user_id);
create policy "progress_update_own" on public.progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "progress_delete_own" on public.progress
  for delete to authenticated using (auth.uid() = user_id);

-- ========= TRIGGER DE PERFIL =========

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $func$
begin
  insert into public.profiles (id, nombre)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1))
  );
  return new;
end;
$func$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========= SEED: FTP + SMB =========

do $seed$
declare
  ftp_id uuid;
  smb_id uuid;
begin
  insert into public.tools (nombre, protocolo, descripcion) values
    ('FTP', 'FTP', 'File Transfer Protocol (puerto 21). Enumeracion de acceso anonimo y descarga de archivos.')
    returning id into ftp_id;

  insert into public.tools (nombre, protocolo, descripcion) values
    ('SMB', 'SMB', 'Server Message Block (139/445). Shares, usuarios y sesiones nulas con smbclient, enum4linux, netexec y rpcclient.')
    returning id into smb_id;

  insert into public.commands (tool_id, comando, descripcion) values
    (ftp_id, 'nmap -sV -sC -p21 <ip>', 'Escaneo de version y scripts por defecto sobre el puerto FTP.'),
    (ftp_id, 'nmap -p21 --script ftp-anon <ip>', 'Comprueba si el servidor permite login anonimo.'),
    (ftp_id, 'ftp <ip>', 'Conecta con el cliente FTP. Prueba usuario anonymous y contrasena vacia.'),
    (ftp_id, 'ftp anonymous@<ip>', 'Conecta indicando directamente el usuario anonymous.'),
    (ftp_id, 'wget -r ftp://anonymous:anonymous@<ip>/', 'Descarga recursiva de todo el arbol via FTP anonimo.'),
    (ftp_id, 'get <archivo>', 'Dentro de la sesion FTP: descarga un archivo (usa mget para varios).'),
    (ftp_id, 'binary', 'Dentro de la sesion FTP: modo binario, para no corromper ejecutables.');

  insert into public.commands (tool_id, comando, descripcion) values
    (smb_id, 'nmap -p139,445 -sV -sC <ip>', 'Escaneo de version y scripts por defecto de SMB.'),
    (smb_id, 'nmap -p445 --script smb-enum-shares,smb-enum-users <ip>', 'Enumera shares y usuarios via scripts NSE.'),
    (smb_id, 'smbclient -N -L //<ip>/', 'Lista los shares con sesion nula (sin credenciales).'),
    (smb_id, 'smbclient //<ip>/<share> -N', 'Se conecta a un share concreto sin contrasena.'),
    (smb_id, 'smbmap -H <ip>', 'Muestra los shares y tus permisos (READ/WRITE) sobre cada uno.'),
    (smb_id, 'enum4linux -a <ip>', 'Enumeracion completa: usuarios, grupos, shares y politicas.'),
    (smb_id, $q$netexec smb <ip> -u '' -p ''$q$, 'Comprueba sesion nula con netexec (antes crackmapexec).'),
    (smb_id, 'rpcclient -U "" -N <ip>', 'Abre una sesion RPC nula. Dentro: enumdomusers, querydominfo, netshareenumall.');

  insert into public.exercises (tool_id, enunciado, respuestas_aceptadas, pista, explicacion) values
    (ftp_id,
     'Sospechas que el FTP de 10.10.10.10 permite acceso anonimo. Usa nmap con el script adecuado sobre el puerto 21 para comprobarlo.',
     array['nmap -p21 --script ftp-anon 10.10.10.10','nmap --script ftp-anon -p21 10.10.10.10','nmap -p 21 --script ftp-anon 10.10.10.10','nmap -sV -p21 --script ftp-anon 10.10.10.10'],
     'Script NSE ftp-anon sobre el puerto 21.',
     'El script ftp-anon prueba el login anonymous. Si responde "Anonymous FTP login allowed" puedes entrar sin credenciales.'),
    (ftp_id,
     'El puerto 21 de 10.10.10.10 acepta login anonimo. Conectate con el cliente ftp.',
     array['ftp 10.10.10.10','ftp anonymous@10.10.10.10'],
     'El cliente clasico se llama igual que el protocolo.',
     'ftp 10.10.10.10 abre la sesion; luego usuario anonymous con contrasena vacia. ftp anonymous@10.10.10.10 fija el usuario de una vez.'),
    (ftp_id,
     'Confirmaste FTP anonimo en 10.10.10.10 y quieres descargar TODO de forma recursiva con wget.',
     array['wget -r ftp://anonymous:anonymous@10.10.10.10/','wget -r ftp://anonymous:anonymous@10.10.10.10','wget -m ftp://anonymous:anonymous@10.10.10.10/'],
     'wget recursivo (-r) con las credenciales anonymous dentro de la URL ftp://',
     'La bandera -r descarga recursivamente. Meter anonymous:anonymous en la URL evita el prompt interactivo y te llevas todo el arbol.'),
    (ftp_id,
     'Dentro de una sesion ftp quieres descargar el archivo backup.zip del directorio actual.',
     array['get backup.zip'],
     'Comando de descarga de un solo archivo dentro del cliente ftp.',
     'get <archivo> baja un archivo al directorio local. Para varios usa mget. Recuerda binary antes de bajar binarios.'),
    (ftp_id,
     'Estas en una sesion ftp y vas a descargar un ejecutable. Cambia el modo de transferencia a binario.',
     array['binary','bin'],
     'Un solo comando; lo contrario de ascii.',
     'El modo ASCII altera saltos de linea y corrompe binarios. binary (o bin) fuerza transferencia byte a byte.');

  insert into public.exercises (tool_id, enunciado, respuestas_aceptadas, pista, explicacion) values
    (smb_id,
     'Quieres listar los shares de 10.10.10.20 sin credenciales (sesion nula) usando smbclient.',
     array['smbclient -N -L //10.10.10.20/','smbclient -L //10.10.10.20/ -N','smbclient -L //10.10.10.20 -N','smbclient -N -L //10.10.10.20'],
     'smbclient con -L para listar y -N para no pedir contrasena.',
     '-L lista shares y -N fuerza sesion nula. Si el server lo permite veras ADMIN$, C$ o carpetas personalizadas.'),
    (smb_id,
     'Encontraste un share llamado Data en 10.10.10.20. Conectate a el con smbclient sin contrasena.',
     array['smbclient //10.10.10.20/Data -N','smbclient -N //10.10.10.20/Data'],
     'smbclient //IP/Share -N',
     'Te conectas directo al share. Dentro usas comandos tipo ftp: ls, get, cd. -N evita el prompt de contrasena.'),
    (smb_id,
     'Quieres una enumeracion completa de SMB en 10.10.10.20 (usuarios, grupos, shares, politicas) con enum4linux en modo all.',
     array['enum4linux -a 10.10.10.20'],
     'enum4linux con la bandera de all.',
     '-a corre toda la bateria: usuarios por RID cycling, grupos, shares y politica de contrasenas. Es el primer barrido de SMB.'),
    (smb_id,
     'Comprueba una sesion nula en el SMB de 10.10.10.20 con netexec (usuario y contrasena vacios).',
     array[$q$netexec smb 10.10.10.20 -u '' -p ''$q$, $q$nxc smb 10.10.10.20 -u '' -p ''$q$],
     'netexec (antes crackmapexec), protocolo smb, credenciales vacias.',
     'netexec/nxc valida autenticacion. Con -u vacio y -p vacio comprueba sesion nula; si pasa, enumeras shares y usuarios sin credenciales.'),
    (smb_id,
     'Estas dentro de rpcclient contra el DC y quieres enumerar los usuarios del dominio. Escribe el comando.',
     array['enumdomusers'],
     'Un solo comando de rpcclient que empieza por enum.',
     'enumdomusers lista los usuarios del dominio con sus RIDs. Desde ahi sigues con queryuser <rid> o enumdomgroups. Es el ejemplo del brief.'),
    (smb_id,
     'Antes de enumerar necesitas abrir una sesion RPC nula contra 10.10.10.20 con rpcclient.',
     array[$q$rpcclient -U '' -N 10.10.10.20$q$, 'rpcclient -U "" -N 10.10.10.20', $q$rpcclient -N -U '' 10.10.10.20$q$],
     'rpcclient con -U vacio y -N.',
     '-U vacio (usuario anonimo) y -N (sin password) abren la sesion nula. Dentro corres enumdomusers, querydominfo, netshareenumall.');
end
$seed$;