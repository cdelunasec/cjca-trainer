-- ===== FTP (15 comandos, 9 ejercicios) =====
do $seed$
declare t_id uuid;
begin
  select id into t_id from public.tools where nombre = $q$FTP$q$ order by created_at limit 1;
  if t_id is null then
    insert into public.tools (nombre, protocolo, descripcion) values ($q$FTP$q$, $q$FTP (21/tcp)$q$, $q$File Transfer Protocol. Servicio de transferencia de archivos que corre por defecto en el puerto 21. En enumeracion nos interesa el banner con la version, si permite login anonimo, y el contenido de los directorios accesibles.$q$) returning id into t_id;
  else
    update public.tools set protocolo = $q$FTP (21/tcp)$q$, descripcion = $q$File Transfer Protocol. Servicio de transferencia de archivos que corre por defecto en el puerto 21. En enumeracion nos interesa el banner con la version, si permite login anonimo, y el contenido de los directorios accesibles.$q$ where id = t_id;
    delete from public.commands where tool_id = t_id;
    delete from public.exercises where tool_id = t_id;
  end if;
  insert into public.commands (tool_id, comando, descripcion) values
    (t_id, $q$nmap -sV -p21 -sC -A <IP>$q$, $q$Escaneo completo del puerto 21. Trae version del servicio, corre los scripts por defecto (incluyendo ftp-anon y ftp-syst) y hace deteccion de OS.$q$),
    (t_id, $q$nmap -sV -p21 --script ftp-anon <IP>$q$, $q$Corre solo el script ftp-anon para comprobar si el login anonimo esta permitido.$q$),
    (t_id, $q$nmap -p21 --script ftp-* <IP>$q$, $q$Corre todos los scripts NSE relacionados con FTP contra el objetivo.$q$),
    (t_id, $q$ftp <IP>$q$, $q$Conexion basica al servidor FTP. Luego pide usuario y contrasena de forma interactiva.$q$),
    (t_id, $q$ftp anonymous@<IP>$q$, $q$Conexion al FTP especificando el usuario anonymous directamente. La contrasena suele quedar vacia.$q$),
    (t_id, $q$nc -nv <IP> 21$q$, $q$Se conecta al puerto 21 con netcat para leer el banner del servicio de forma cruda.$q$),
    (t_id, $q$telnet <IP> 21$q$, $q$Conexion cruda al puerto 21 con telnet para capturar el banner.$q$),
    (t_id, $q$openssl s_client -connect <IP>:21 -starttls ftp$q$, $q$Se conecta a un FTP con TLS (FTPS) para leer el banner y el certificado, util cuando el servicio cifra la sesion.$q$),
    (t_id, $q$ls$q$, $q$Dentro de la sesion FTP, lista el contenido del directorio actual.$q$),
    (t_id, $q$ls -la$q$, $q$Dentro de la sesion FTP, lista todo el contenido incluyendo archivos ocultos y permisos.$q$),
    (t_id, $q$cd <directorio>$q$, $q$Dentro de la sesion FTP, cambia al directorio indicado.$q$),
    (t_id, $q$get <archivo>$q$, $q$Dentro de la sesion FTP, descarga el archivo indicado al directorio local.$q$),
    (t_id, $q$put <archivo>$q$, $q$Dentro de la sesion FTP, sube un archivo local al servidor. Solo funciona si el servidor permite escritura.$q$),
    (t_id, $q$binary$q$, $q$Dentro de la sesion FTP, cambia el modo de transferencia a binario para no corromper archivos que no son texto.$q$),
    (t_id, $q$wget -m --no-passive ftp://anonymous:anonymous@<IP>$q$, $q$Descarga de forma recursiva (mirror) todo el contenido accesible del FTP como usuario anonimo.$q$);
  insert into public.exercises (tool_id, enunciado, respuestas_aceptadas, pista, explicacion) values
    (t_id, $q$Quieres escanear el puerto 21 de un objetivo para traer la version del servicio y correr los scripts por defecto de nmap. Escribe el comando.$q$, array[$q$nmap -sV -p21 -sC -A <IP>$q$, $q$nmap -sV -sC -p21 -A <IP>$q$, $q$nmap -sV -p21 -sC <IP>$q$, $q$nmap -p21 -sV -sC <IP>$q$, $q$nmap -sC -sV -p21 <IP>$q$]::text[], $q$Necesitas la bandera de version, la de scripts por defecto y limitar el escaneo al puerto 21.$q$, $q$-sV trae la version del servicio, -sC corre los scripts por defecto (entre ellos ftp-anon y ftp-syst), -p21 limita al puerto de FTP y -A agrega deteccion de OS y traceroute. Es el escaneo tipico para empezar a enumerar un FTP.$q$),
    (t_id, $q$Quieres comprobar puntualmente si el servidor FTP permite login anonimo, corriendo solo ese script de nmap. Escribe el comando.$q$, array[$q$nmap -sV -p21 --script ftp-anon <IP>$q$, $q$nmap -p21 --script ftp-anon <IP>$q$, $q$nmap --script ftp-anon -p21 <IP>$q$, $q$nmap -p21 --script=ftp-anon <IP>$q$]::text[], $q$El script de nmap que revisa el acceso anonimo se llama ftp-anon.$q$, $q$El script ftp-anon intenta un login anonimo y reporta si esta permitido, ademas de listar el directorio si logra entrar. Es mas rapido y silencioso que correr todos los scripts cuando solo te interesa ese dato.$q$),
    (t_id, $q$Encontraste que el FTP permite acceso anonimo. Conectate al servidor especificando el usuario anonymous directamente en el comando. Escribe el comando.$q$, array[$q$ftp anonymous@<IP>$q$, $q$ftp anonymous@<ip>$q$]::text[], $q$El cliente ftp acepta el formato usuario@host igual que ssh.$q$, $q$ftp anonymous@<IP> abre la conexion ya con el usuario anonymous. Cuando pida contrasena la dejas vacia (o pones anonymous) y entras. Tambien vale conectar con solo 'ftp <IP>' y escribir anonymous cuando pida el usuario.$q$),
    (t_id, $q$Prefieres conectarte al FTP sin pasar el usuario en el comando, para que te lo pida de forma interactiva. Escribe el comando de conexion.$q$, array[$q$ftp <IP>$q$, $q$ftp <ip>$q$]::text[], $q$Es la forma mas basica de conexion, solo el binario y el destino.$q$, $q$ftp <IP> abre la sesion y el servidor pide usuario y contrasena de forma interactiva. Para acceso anonimo escribes anonymous como usuario y dejas la contrasena vacia.$q$),
    (t_id, $q$Ya estas dentro de la sesion FTP y quieres ver todo el contenido del directorio actual, incluyendo archivos ocultos. Escribe el comando.$q$, array[$q$ls -la$q$, $q$ls -al$q$, $q$ls -a -l$q$]::text[], $q$Es el mismo flag que usarias en una shell de Linux para ver ocultos y detalle.$q$, $q$Dentro del FTP, ls -la lista todo con permisos y archivos ocultos. Muchos flags de labs estan en archivos que no aparecen con un ls simple, por eso conviene siempre listar con -la.$q$),
    (t_id, $q$Dentro del FTP encontraste el archivo flag.txt y quieres descargarlo a tu maquina. Escribe el comando.$q$, array[$q$get flag.txt$q$]::text[], $q$El comando para bajar un archivo desde el FTP empieza con get.$q$, $q$get flag.txt descarga el archivo al directorio local desde el que abriste la sesion FTP. Luego lo lees en tu maquina con cat flag.txt.$q$),
    (t_id, $q$Quieres leer el banner crudo del servicio FTP conectandote al puerto 21 con netcat. Escribe el comando.$q$, array[$q$nc -nv <IP> 21$q$, $q$nc -nv <ip> 21$q$, $q$nc <IP> 21$q$]::text[], $q$Usa netcat en modo verboso y sin resolver DNS, apuntando al puerto 21.$q$, $q$nc -nv <IP> 21 abre una conexion cruda al puerto 21. -n evita resolucion DNS y -v da salida verbosa. El servidor responde con su banner, que muchas veces revela el software y la version exacta del FTP.$q$),
    (t_id, $q$El FTP corre sobre TLS y quieres leer su banner y certificado. Conectate con openssl haciendo starttls sobre ftp. Escribe el comando.$q$, array[$q$openssl s_client -connect <IP>:21 -starttls ftp$q$, $q$openssl s_client -connect <ip>:21 -starttls ftp$q$]::text[], $q$Es el cliente s_client de openssl, con -connect al puerto 21 y el -starttls apropiado.$q$, $q$openssl s_client -connect <IP>:21 -starttls ftp negocia el cifrado sobre el FTP y te deja leer el banner y el certificado. El certificado a veces filtra nombres de host internos y correos utiles para seguir enumerando.$q$),
    (t_id, $q$Quieres descargar de forma recursiva todo el contenido accesible del FTP como usuario anonimo, en un solo comando. Escribe el comando.$q$, array[$q$wget -m --no-passive ftp://anonymous:anonymous@<IP>$q$, $q$wget -m --no-passive ftp://anonymous:anonymous@<ip>$q$, $q$wget -m ftp://anonymous:anonymous@<IP>$q$]::text[], $q$Usa wget en modo mirror (-m) con credenciales anonymous embebidas en la URL del ftp.$q$, $q$wget -m --no-passive ftp://anonymous:anonymous@<IP> hace un mirror de todo el arbol de directorios accesible. Es util cuando hay muchos archivos y no quieres bajarlos uno por uno. --no-passive fuerza modo activo, que a veces es necesario segun la config del servidor.$q$);
end
$seed$;

-- ===== SMB (11 comandos, 8 ejercicios) =====
do $seed$
declare t_id uuid;
begin
  select id into t_id from public.tools where nombre = $q$SMB$q$ order by created_at limit 1;
  if t_id is null then
    insert into public.tools (nombre, protocolo, descripcion) values ($q$SMB$q$, $q$SMB (139/445 tcp)$q$, $q$Server Message Block. Protocolo de comparticion de archivos, impresoras y recursos en red, muy comun en entornos Windows y en servidores Samba. En enumeracion buscamos shares accesibles, sesiones nulas, usuarios, grupos e informacion del dominio. Herramientas clave: smbclient, rpcclient, smbmap, crackmapexec y enum4linux-ng.$q$) returning id into t_id;
  else
    update public.tools set protocolo = $q$SMB (139/445 tcp)$q$, descripcion = $q$Server Message Block. Protocolo de comparticion de archivos, impresoras y recursos en red, muy comun en entornos Windows y en servidores Samba. En enumeracion buscamos shares accesibles, sesiones nulas, usuarios, grupos e informacion del dominio. Herramientas clave: smbclient, rpcclient, smbmap, crackmapexec y enum4linux-ng.$q$ where id = t_id;
    delete from public.commands where tool_id = t_id;
    delete from public.exercises where tool_id = t_id;
  end if;
  insert into public.commands (tool_id, comando, descripcion) values
    (t_id, $q$nmap -sV -sC -p139,445 <IP>$q$, $q$Escaneo de version y scripts por defecto sobre los puertos de SMB. Trae el banner y datos basicos del servicio.$q$),
    (t_id, $q$nmap -p445 --script smb-os-discovery <IP>$q$, $q$Descubre el sistema operativo, nombre de equipo y dominio a traves de SMB.$q$),
    (t_id, $q$smbclient -N -L //<IP>$q$, $q$Lista los shares del servidor usando sesion nula (-N sin contrasena, -L para listar).$q$),
    (t_id, $q$smbclient -L //<IP> -U <usuario>$q$, $q$Lista los shares autenticandose con un usuario valido.$q$),
    (t_id, $q$smbclient //<IP>/<share>$q$, $q$Se conecta a un share especifico para navegarlo.$q$),
    (t_id, $q$smbclient //<IP>/<share> -N$q$, $q$Se conecta a un share especifico usando sesion nula, sin credenciales.$q$),
    (t_id, $q$smbmap -H <IP>$q$, $q$Enumera los shares del servidor y muestra los permisos de acceso (lectura/escritura) sobre cada uno.$q$),
    (t_id, $q$smbmap -H <IP> -u <usuario> -p <contrasena>$q$, $q$Enumera shares y permisos autenticandose con credenciales.$q$),
    (t_id, $q$rpcclient -U "" <IP>$q$, $q$Abre una sesion RPC con usuario vacio (sesion nula) para interactuar con el servicio y enumerar informacion.$q$),
    (t_id, $q$crackmapexec smb <IP> --shares -u '' -p ''$q$, $q$Enumera los shares usando autenticacion de sesion nula con crackmapexec.$q$),
    (t_id, $q$enum4linux-ng.py <IP> -A$q$, $q$Enumeracion automatica y completa de SMB: usuarios, grupos, shares, politicas de contrasena e informacion del sistema.$q$);
  insert into public.exercises (tool_id, enunciado, respuestas_aceptadas, pista, explicacion) values
    (t_id, $q$Quieres listar todos los shares de un servidor SMB usando una sesion nula, sin credenciales, con smbclient. Escribe el comando.$q$, array[$q$smbclient -N -L //<IP>$q$, $q$smbclient -L //<IP> -N$q$, $q$smbclient -N -L //<IP>/$q$, $q$smbclient -L //<IP>/ -N$q$]::text[], $q$El flag -N usa sesion nula y el flag -L lista los shares.$q$, $q$smbclient -N -L //<IP> pide la lista de shares sin autenticarse. -N fuerza sesion nula (sin contrasena) y -L le dice que solo liste, no que se conecte. Es de lo primero que se prueba, porque muchos servidores exponen shares por sesion nula.$q$),
    (t_id, $q$Descubriste un share llamado 'notes' y quieres conectarte a el usando sesion nula para navegarlo. Escribe el comando.$q$, array[$q$smbclient //<IP>/notes -N$q$, $q$smbclient -N //<IP>/notes$q$]::text[], $q$Es smbclient apuntando directo al share, con el flag de sesion nula.$q$, $q$smbclient //<IP>/notes -N te conecta al share 'notes' sin credenciales. Una vez dentro navegas con ls, cd y descargas con get, igual que en FTP.$q$),
    (t_id, $q$Quieres enumerar los shares de un servidor SMB y ver que permisos de lectura o escritura tienes sobre cada uno, con smbmap. Escribe el comando.$q$, array[$q$smbmap -H <IP>$q$]::text[], $q$smbmap usa el flag -H para indicar el host.$q$, $q$smbmap -H <IP> lista los shares junto con los permisos efectivos (READ, WRITE, NO ACCESS). Es mas util que smbclient -L cuando quieres saber de inmediato donde puedes escribir o leer, no solo que shares existen.$q$),
    (t_id, $q$Quieres abrir una sesion RPC contra el objetivo usando una sesion nula (usuario vacio) para enumerar informacion del dominio. Escribe el comando.$q$, array[$q$rpcclient -U "" <IP>$q$, $q$rpcclient -U '' <IP>$q$, $q$rpcclient -U "" -N <IP>$q$]::text[], $q$Es rpcclient con el flag -U y un usuario entre comillas vacio.$q$, $q$rpcclient -U "" <IP> abre una sesion RPC nula. El usuario vacio entre comillas es lo que produce la sesion nula. Ya dentro puedes correr comandos como enumdomusers, querydominfo o netshareenumall para sacar usuarios, info del dominio y shares.$q$),
    (t_id, $q$Ya estas dentro de rpcclient y quieres enumerar todos los usuarios del dominio. Escribe el comando.$q$, array[$q$enumdomusers$q$]::text[], $q$El comando dentro de rpcclient empieza con enumdom y termina en el plural de usuario en ingles.$q$, $q$enumdomusers lista todas las cuentas de usuario del dominio con su RID. Es una de las razones principales para entrar a rpcclient, porque te da la lista de usuarios que luego puedes usar para ataques de password o para seguir enumerando.$q$),
    (t_id, $q$Dentro de rpcclient quieres ver la informacion general del dominio (nombre, politicas, cantidad de usuarios). Escribe el comando.$q$, array[$q$querydominfo$q$]::text[], $q$El comando junta las palabras query, dom e info.$q$, $q$querydominfo devuelve informacion del dominio o workgroup: nombre del dominio, servidor, total de usuarios y politicas basicas. Ayuda a entender si estas frente a un dominio real o un workgroup local.$q$),
    (t_id, $q$Dentro de rpcclient quieres listar todos los shares disponibles en el servidor. Escribe el comando.$q$, array[$q$netshareenumall$q$, $q$netshareenum$q$]::text[], $q$El comando empieza con netshareenum.$q$, $q$netshareenumall enumera todos los shares del servidor, incluyendo algunos administrativos que no siempre aparecen con smbclient -L. Es util contrastar esta salida con la de otras herramientas para no perderte ningun share.$q$),
    (t_id, $q$Quieres correr una enumeracion completa y automatica de SMB (usuarios, grupos, shares, politicas) con enum4linux-ng. Escribe el comando.$q$, array[$q$enum4linux-ng.py <IP> -A$q$, $q$enum4linux-ng.py -A <IP>$q$, $q$./enum4linux-ng.py <IP> -A$q$, $q$enum4linux-ng <IP> -A$q$]::text[], $q$Es el script enum4linux-ng con el flag -A de enumeracion agresiva o completa.$q$, $q$enum4linux-ng.py <IP> -A hace la pasada completa: junta lo que sacarian rpcclient, smbclient y nmblookup en una sola corrida y te devuelve usuarios, grupos, shares, politicas de contrasena e info del sistema. Es un buen primer barrido antes de ir a mano con rpcclient.$q$);
end
$seed$;

-- ===== NFS (8 comandos, 5 ejercicios) =====
do $seed$
declare t_id uuid;
begin
  select id into t_id from public.tools where nombre = $q$NFS$q$ order by created_at limit 1;
  if t_id is null then
    insert into public.tools (nombre, protocolo, descripcion) values ($q$NFS$q$, $q$NFS (111/2049 tcp)$q$, $q$Network File System. Permite montar y acceder a sistemas de archivos por red como si fueran locales, tipico de entornos Linux y Unix. Corre sobre el portmapper (111) y el propio servicio (2049). En enumeracion buscamos que shares (exports) estan disponibles, los montamos y revisamos su contenido y permisos.$q$) returning id into t_id;
  else
    update public.tools set protocolo = $q$NFS (111/2049 tcp)$q$, descripcion = $q$Network File System. Permite montar y acceder a sistemas de archivos por red como si fueran locales, tipico de entornos Linux y Unix. Corre sobre el portmapper (111) y el propio servicio (2049). En enumeracion buscamos que shares (exports) estan disponibles, los montamos y revisamos su contenido y permisos.$q$ where id = t_id;
    delete from public.commands where tool_id = t_id;
    delete from public.exercises where tool_id = t_id;
  end if;
  insert into public.commands (tool_id, comando, descripcion) values
    (t_id, $q$nmap -sV -p111,2049 <IP>$q$, $q$Escaneo de version sobre los puertos del portmapper y NFS.$q$),
    (t_id, $q$nmap -sV --script nfs* <IP> -p111,2049$q$, $q$Corre todos los scripts NSE de NFS, que listan exports, permisos y estadisticas.$q$),
    (t_id, $q$showmount -e <IP>$q$, $q$Muestra la lista de exports (shares NFS) disponibles en el servidor y quien puede montarlos.$q$),
    (t_id, $q$mkdir target-NFS$q$, $q$Crea un directorio local que servira como punto de montaje para el share NFS.$q$),
    (t_id, $q$mount -t nfs <IP>:/<share> ./target-NFS/ -o nolock$q$, $q$Monta el export NFS del servidor en el directorio local. -o nolock evita problemas de bloqueo de archivos.$q$),
    (t_id, $q$sudo mount -t nfs <IP>:/<share> ./target-NFS/ -o nolock$q$, $q$Monta el export NFS con privilegios, necesario en la mayoria de los sistemas.$q$),
    (t_id, $q$ls -la ./target-NFS/$q$, $q$Lista el contenido del share ya montado, con permisos y archivos ocultos.$q$),
    (t_id, $q$umount ./target-NFS$q$, $q$Desmonta el share NFS del directorio local cuando terminas.$q$);
  insert into public.exercises (tool_id, enunciado, respuestas_aceptadas, pista, explicacion) values
    (t_id, $q$Quieres ver que exports (shares NFS) tiene disponibles un servidor antes de montar nada. Escribe el comando.$q$, array[$q$showmount -e <IP>$q$, $q$showmount -e <ip>$q$]::text[], $q$El comando es showmount con el flag -e de exports.$q$, $q$showmount -e <IP> lista los exports del servidor NFS y desde que hosts se permite montarlos. Es el primer paso, porque te dice que shares existen y a cuales podrias tener acceso antes de intentar el montaje.$q$),
    (t_id, $q$Encontraste un export llamado /var/nfs y quieres montarlo en un directorio local llamado target-NFS, evitando bloqueos de archivos. Escribe el comando de montaje.$q$, array[$q$sudo mount -t nfs <IP>:/var/nfs ./target-NFS/ -o nolock$q$, $q$mount -t nfs <IP>:/var/nfs ./target-NFS/ -o nolock$q$, $q$sudo mount -t nfs <IP>:/var/nfs ./target-NFS -o nolock$q$, $q$mount -t nfs <IP>:/var/nfs ./target-NFS -o nolock$q$]::text[], $q$Es mount con -t nfs, la ruta del share como IP:/ruta, el punto de montaje local y el flag -o nolock.$q$, $q$mount -t nfs <IP>:/var/nfs ./target-NFS/ -o nolock monta el export en tu directorio local. -t nfs indica el tipo de sistema de archivos y -o nolock evita que el cliente intente bloqueos que suelen fallar en labs. Normalmente necesitas sudo. Antes de montar hay que crear el directorio con mkdir.$q$),
    (t_id, $q$Ya montaste el share NFS en ./target-NFS y quieres ver todo su contenido incluyendo archivos ocultos y permisos. Escribe el comando.$q$, array[$q$ls -la ./target-NFS/$q$, $q$ls -la ./target-NFS$q$, $q$ls -la target-NFS/$q$, $q$ls -la target-NFS$q$]::text[], $q$Es un ls -la apuntando al directorio donde montaste el share.$q$, $q$ls -la ./target-NFS/ lista el contenido del share ya montado. Ver los permisos importa en NFS porque a veces los archivos pertenecen a UIDs especificos y puedes necesitar coincidir con ese UID para leerlos, lo que abre trucos de escalada mas adelante.$q$),
    (t_id, $q$Terminaste de revisar el share y quieres desmontarlo del directorio local. Escribe el comando.$q$, array[$q$umount ./target-NFS$q$, $q$sudo umount ./target-NFS$q$, $q$umount target-NFS$q$, $q$sudo umount target-NFS$q$]::text[], $q$El comando para desmontar es umount, sin la n despues de la u.$q$, $q$umount ./target-NFS libera el punto de montaje. Ojo con el nombre del comando, es umount y no unmount, es un error clasico. Conviene desmontar al terminar para dejar limpio el sistema.$q$),
    (t_id, $q$Quieres correr todos los scripts NSE de NFS de nmap contra el objetivo, sobre los puertos del portmapper y el servicio. Escribe el comando.$q$, array[$q$nmap -sV --script nfs* <IP> -p111,2049$q$, $q$nmap --script nfs* -sV -p111,2049 <IP>$q$, $q$nmap -sV --script nfs* -p111,2049 <IP>$q$, $q$nmap -p111,2049 --script nfs* -sV <IP>$q$]::text[], $q$Usa --script con el comodin nfs* y limita a los puertos 111 y 2049.$q$, $q$nmap -sV --script nfs* <IP> -p111,2049 corre todos los scripts de NFS (nfs-ls, nfs-showmount, nfs-statfs). Te da los exports y a veces lista el contenido directamente sin necesidad de montar, util para un vistazo rapido.$q$);
end
$seed$;

-- ===== DNS (7 comandos, 5 ejercicios) =====
do $seed$
declare t_id uuid;
begin
  select id into t_id from public.tools where nombre = $q$DNS$q$ order by created_at limit 1;
  if t_id is null then
    insert into public.tools (nombre, protocolo, descripcion) values ($q$DNS$q$, $q$DNS (53 udp/tcp)$q$, $q$Domain Name System. Traduce nombres de dominio a direcciones IP y guarda distintos tipos de registros (A, NS, MX, TXT, SOA). En enumeracion nos interesa consultar registros, identificar la version del servidor y, sobre todo, intentar una transferencia de zona (AXFR), que si esta mal configurada nos entrega el mapa completo de la infraestructura interna. Herramienta principal: dig.$q$) returning id into t_id;
  else
    update public.tools set protocolo = $q$DNS (53 udp/tcp)$q$, descripcion = $q$Domain Name System. Traduce nombres de dominio a direcciones IP y guarda distintos tipos de registros (A, NS, MX, TXT, SOA). En enumeracion nos interesa consultar registros, identificar la version del servidor y, sobre todo, intentar una transferencia de zona (AXFR), que si esta mal configurada nos entrega el mapa completo de la infraestructura interna. Herramienta principal: dig.$q$ where id = t_id;
    delete from public.commands where tool_id = t_id;
    delete from public.exercises where tool_id = t_id;
  end if;
  insert into public.commands (tool_id, comando, descripcion) values
    (t_id, $q$dig ns <dominio> @<IP>$q$, $q$Consulta los registros NS (nameservers) del dominio contra un servidor DNS especifico.$q$),
    (t_id, $q$dig any <dominio> @<IP>$q$, $q$Pide todos los registros disponibles del dominio en una sola consulta.$q$),
    (t_id, $q$dig soa <dominio> @<IP>$q$, $q$Consulta el registro SOA (Start of Authority), que da datos del servidor autoritativo y los tiempos de la zona.$q$),
    (t_id, $q$dig CH TXT version.bind @<IP>$q$, $q$Consulta la version del servidor DNS usando la clase CHAOS. Puede revelar el software y version de BIND.$q$),
    (t_id, $q$dig axfr <dominio> @<IP>$q$, $q$Intenta una transferencia de zona completa (AXFR). Si el servidor la permite, devuelve todos los registros de la zona.$q$),
    (t_id, $q$dig axfr internal.<dominio> @<IP>$q$, $q$Intenta la transferencia de zona sobre un subdominio interno, que a veces esta permitida aunque la del dominio principal no.$q$),
    (t_id, $q$dnsenum --dnsserver <IP> --enum -p 0 -s 0 -o found.txt -f <wordlist> <dominio>$q$, $q$Fuerza por diccionario subdominios del objetivo apoyandose en un wordlist y guarda los encontrados.$q$);
  insert into public.exercises (tool_id, enunciado, respuestas_aceptadas, pista, explicacion) values
    (t_id, $q$Quieres consultar los nameservers (registros NS) del dominio inlanefreight.htb contra un servidor DNS especifico. Escribe el comando.$q$, array[$q$dig ns inlanefreight.htb @<IP>$q$, $q$dig ns inlanefreight.htb @<ip>$q$, $q$dig NS inlanefreight.htb @<IP>$q$]::text[], $q$Es dig, el tipo de registro ns, el dominio, y el servidor precedido por arroba.$q$, $q$dig ns inlanefreight.htb @<IP> pregunta cuales son los nameservers del dominio al servidor indicado con @. Saber los NS es util porque son los servidores autoritativos, justo contra los que vas a intentar la transferencia de zona.$q$),
    (t_id, $q$El paso clave de la enumeracion DNS: intenta una transferencia de zona completa del dominio inlanefreight.htb contra el servidor DNS. Escribe el comando.$q$, array[$q$dig axfr inlanefreight.htb @<IP>$q$, $q$dig axfr inlanefreight.htb @<ip>$q$, $q$dig AXFR inlanefreight.htb @<IP>$q$]::text[], $q$El tipo de consulta para transferencia de zona es axfr.$q$, $q$dig axfr inlanefreight.htb @<IP> pide la zona completa. AXFR significa Asynchronous Full Transfer Zone. Si el servidor esta mal configurado con allow-transfer any, te devuelve todos los registros: subdominios internos, IPs, hosts. Es una de las fugas de informacion mas jugosas del modulo y casi siempre cae en el examen.$q$),
    (t_id, $q$La transferencia de zona del dominio principal fallo, pero quieres probarla sobre el subdominio interno 'internal.inlanefreight.htb'. Escribe el comando.$q$, array[$q$dig axfr internal.inlanefreight.htb @<IP>$q$, $q$dig axfr internal.inlanefreight.htb @<ip>$q$, $q$dig AXFR internal.inlanefreight.htb @<IP>$q$]::text[], $q$Mismo comando de transferencia de zona, pero con el subdominio interno en vez del dominio raiz.$q$, $q$dig axfr internal.inlanefreight.htb @<IP> prueba la transferencia sobre el subdominio interno. En varios labs la zona del dominio principal esta protegida pero la interna no, asi que cuando el AXFR del dominio raiz falla, siempre vale intentar con los subdominios que hayas descubierto.$q$),
    (t_id, $q$Quieres averiguar la version del servidor DNS usando una consulta TXT de la clase CHAOS a version.bind. Escribe el comando.$q$, array[$q$dig CH TXT version.bind @<IP>$q$, $q$dig ch txt version.bind @<IP>$q$, $q$dig CH TXT version.bind @<ip>$q$]::text[], $q$Necesitas la clase CH (CHAOS), el tipo TXT y el nombre especial version.bind.$q$, $q$dig CH TXT version.bind @<IP> consulta la version del servidor usando la clase CHAOS, una clase especial distinta de la comun (IN). Muchos servidores BIND responden con su version exacta, lo que te ayuda a buscar vulnerabilidades conocidas de esa version.$q$),
    (t_id, $q$Quieres pedir todos los registros disponibles del dominio inlanefreight.htb en una sola consulta. Escribe el comando.$q$, array[$q$dig any inlanefreight.htb @<IP>$q$, $q$dig ANY inlanefreight.htb @<IP>$q$, $q$dig any inlanefreight.htb @<ip>$q$]::text[], $q$El tipo de registro que pide todos a la vez es any.$q$, $q$dig any inlanefreight.htb @<IP> solicita todos los tipos de registro de una. Aunque muchos servidores modernos limitan la respuesta a ANY, sigue siendo una consulta rapida para ver A, MX, NS y TXT juntos sin lanzar varias consultas separadas.$q$);
end
$seed$;

-- ===== SNMP (5 comandos, 4 ejercicios) =====
do $seed$
declare t_id uuid;
begin
  select id into t_id from public.tools where nombre = $q$SNMP$q$ order by created_at limit 1;
  if t_id is null then
    insert into public.tools (nombre, protocolo, descripcion) values ($q$SNMP$q$, $q$SNMP (161 udp)$q$, $q$Simple Network Management Protocol. Usado para monitorear y administrar dispositivos de red. Corre sobre UDP 161. La clave del acceso es la community string, que en las versiones 1 y 2c funciona como una contrasena en texto plano. En enumeracion primero descubrimos la community string valida y luego consultamos los OIDs para sacar informacion del sistema: usuarios, procesos, correos de admin, scripts y mas. Herramientas: snmpwalk, onesixtyone y braa.$q$) returning id into t_id;
  else
    update public.tools set protocolo = $q$SNMP (161 udp)$q$, descripcion = $q$Simple Network Management Protocol. Usado para monitorear y administrar dispositivos de red. Corre sobre UDP 161. La clave del acceso es la community string, que en las versiones 1 y 2c funciona como una contrasena en texto plano. En enumeracion primero descubrimos la community string valida y luego consultamos los OIDs para sacar informacion del sistema: usuarios, procesos, correos de admin, scripts y mas. Herramientas: snmpwalk, onesixtyone y braa.$q$ where id = t_id;
    delete from public.commands where tool_id = t_id;
    delete from public.exercises where tool_id = t_id;
  end if;
  insert into public.commands (tool_id, comando, descripcion) values
    (t_id, $q$nmap -sU -p161 <IP>$q$, $q$Escaneo del puerto 161 sobre UDP para confirmar que el servicio SNMP esta activo.$q$),
    (t_id, $q$snmpwalk -v2c -c <community_string> <IP>$q$, $q$Recorre todos los OIDs del dispositivo usando SNMP version 2c y la community string indicada. Vuelca toda la informacion accesible.$q$),
    (t_id, $q$snmpwalk -v2c -c <community_string> <IP> <OID>$q$, $q$Consulta un OID especifico en vez de recorrer todo el arbol.$q$),
    (t_id, $q$onesixtyone -c <wordlist> <IP>$q$, $q$Fuerza por diccionario la community string del servicio SNMP usando una lista de posibles nombres.$q$),
    (t_id, $q$braa <community_string>@<IP>:.1.3.6.*$q$, $q$Enumera OIDs de forma masiva y rapida una vez que ya tienes la community string valida.$q$);
  insert into public.exercises (tool_id, enunciado, respuestas_aceptadas, pista, explicacion) values
    (t_id, $q$Todavia no conoces la community string del servicio SNMP y quieres descubrirla por fuerza bruta con onesixtyone usando un wordlist. Escribe el comando.$q$, array[$q$onesixtyone -c <wordlist> <IP>$q$, $q$onesixtyone -c <wordlist> <ip>$q$]::text[], $q$onesixtyone usa el flag -c para pasar el archivo de community strings.$q$, $q$onesixtyone -c <wordlist> <IP> prueba muchos nombres de community string a gran velocidad. Como las community strings las nombra el administrador de forma arbitraria (backup, public, private, secret), hay que descubrirlas por diccionario. Sin la community string valida no puedes consultar nada por snmpwalk, por eso este es el primer paso.$q$),
    (t_id, $q$Encontraste que la community string valida es 'backup'. Recorre todos los OIDs del dispositivo usando SNMP version 2c con snmpwalk. Escribe el comando.$q$, array[$q$snmpwalk -v2c -c backup <IP>$q$, $q$snmpwalk -v2c -c backup <ip>$q$, $q$snmpwalk -c backup -v2c <IP>$q$]::text[], $q$snmpwalk necesita la version con -v2c y la community string con -c, seguido del objetivo.$q$, $q$snmpwalk -v2c -c backup <IP> recorre todo el arbol de OIDs usando la community string 'backup' sobre SNMPv2c. Aqui es donde sale el oro: version del OS, hostname, correo del admin, procesos corriendo, scripts custom y parametros de red. Es la consulta central de la enumeracion SNMP.$q$),
    (t_id, $q$Ya tienes la community string 'backup' y quieres enumerar OIDs de forma masiva y rapida con braa. Escribe el comando.$q$, array[$q$braa backup@<IP>:.1.3.6.*$q$, $q$braa backup@<ip>:.1.3.6.*$q$, $q$braa backup@<IP>:.1.*$q$]::text[], $q$braa usa el formato community@IP:OID, con un comodin al final del OID.$q$, $q$braa backup@<IP>:.1.3.6.* consulta OIDs de forma masiva y mucho mas rapida que snmpwalk, porque implementa su propio stack SNMP y consulta en paralelo. Se usa cuando snmpwalk es lento o cuando quieres barrer un rango grande de OIDs de una vez.$q$),
    (t_id, $q$Quieres confirmar que el servicio SNMP esta activo escaneando su puerto, recordando que SNMP corre sobre UDP. Escribe el comando de nmap.$q$, array[$q$nmap -sU -p161 <IP>$q$, $q$nmap -sU -p161 <ip>$q$, $q$sudo nmap -sU -p161 <IP>$q$, $q$nmap -p161 -sU <IP>$q$]::text[], $q$SNMP no es TCP, tienes que usar el tipo de escaneo de UDP en nmap.$q$, $q$nmap -sU -p161 <IP> escanea el puerto 161 sobre UDP. El detalle clave es -sU, porque SNMP usa UDP y un escaneo TCP normal no lo detectaria. Confirmar que el puerto esta abierto es el arranque antes de buscar la community string.$q$);
end
$seed$;

-- ===== MySQL (9 comandos, 5 ejercicios) =====
do $seed$
declare t_id uuid;
begin
  select id into t_id from public.tools where nombre = $q$MySQL$q$ order by created_at limit 1;
  if t_id is null then
    insert into public.tools (nombre, protocolo, descripcion) values ($q$MySQL$q$, $q$MySQL (3306 tcp)$q$, $q$Sistema de gestion de bases de datos relacional de codigo abierto, muy comun en stacks LAMP y LEMP. Corre por defecto en el puerto 3306. En enumeracion buscamos la version, credenciales debiles o por defecto, y una vez dentro exploramos bases de datos, tablas y datos sensibles como credenciales, correos y hashes. Cliente principal: mysql.$q$) returning id into t_id;
  else
    update public.tools set protocolo = $q$MySQL (3306 tcp)$q$, descripcion = $q$Sistema de gestion de bases de datos relacional de codigo abierto, muy comun en stacks LAMP y LEMP. Corre por defecto en el puerto 3306. En enumeracion buscamos la version, credenciales debiles o por defecto, y una vez dentro exploramos bases de datos, tablas y datos sensibles como credenciales, correos y hashes. Cliente principal: mysql.$q$ where id = t_id;
    delete from public.commands where tool_id = t_id;
    delete from public.exercises where tool_id = t_id;
  end if;
  insert into public.commands (tool_id, comando, descripcion) values
    (t_id, $q$nmap -sV -sC -p3306 <IP>$q$, $q$Escaneo de version y scripts por defecto sobre el puerto de MySQL.$q$),
    (t_id, $q$nmap -sV -p3306 --script mysql* <IP>$q$, $q$Corre todos los scripts NSE de MySQL: version, usuarios, bases de datos y chequeo de password vacio.$q$),
    (t_id, $q$nmap -sV -p3306 --script mysql-empty-password <IP>$q$, $q$Comprueba especificamente si alguna cuenta permite login sin contrasena.$q$),
    (t_id, $q$mysql -u <usuario> -p<contrasena> -h <IP>$q$, $q$Se conecta al servidor MySQL con usuario y contrasena. Ojo: no hay espacio entre -p y la contrasena.$q$),
    (t_id, $q$mysql -u root -h <IP>$q$, $q$Intenta conectar como root sin contrasena. Si el servidor lo permite, entra directo.$q$),
    (t_id, $q$show databases;$q$, $q$Dentro de la sesion MySQL, lista todas las bases de datos disponibles.$q$),
    (t_id, $q$use <base_de_datos>;$q$, $q$Dentro de la sesion, selecciona una base de datos para trabajar sobre ella.$q$),
    (t_id, $q$show tables;$q$, $q$Dentro de la base seleccionada, lista todas sus tablas.$q$),
    (t_id, $q$select * from <tabla>;$q$, $q$Dentro de la sesion, muestra todo el contenido de una tabla.$q$);
  insert into public.exercises (tool_id, enunciado, respuestas_aceptadas, pista, explicacion) values
    (t_id, $q$Quieres conectarte a un servidor MySQL con el usuario root y la contrasena 'password'. Recuerda el detalle del flag de contrasena. Escribe el comando.$q$, array[$q$mysql -u root -ppassword -h <IP>$q$, $q$mysql -u root -ppassword -h <ip>$q$, $q$mysql -h <IP> -u root -ppassword$q$]::text[], $q$El usuario va con -u y la contrasena con -p pegada, sin espacio, y el host con -h.$q$, $q$mysql -u root -ppassword -h <IP> conecta al servidor. El detalle que casi todo el mundo falla es que NO hay espacio entre -p y la contrasena. Si escribes -p password, MySQL interpreta 'password' como el nombre de la base de datos y te pide la clave aparte. Con -h indicas el host remoto.$q$),
    (t_id, $q$Sospechas que el servidor MySQL permite login sin contrasena y quieres comprobarlo con el script de nmap correspondiente. Escribe el comando.$q$, array[$q$nmap -sV -p3306 --script mysql-empty-password <IP>$q$, $q$nmap -p3306 --script mysql-empty-password <IP>$q$, $q$nmap --script mysql-empty-password -p3306 <IP>$q$, $q$sudo nmap -sV -p3306 --script mysql-empty-password <IP>$q$]::text[], $q$El script de nmap se llama mysql-empty-password.$q$, $q$nmap -sV -p3306 --script mysql-empty-password <IP> revisa si alguna cuenta, tipicamente root, entra sin contrasena. Es una mala configuracion comun y un camino directo de acceso, por eso conviene probarlo temprano en la enumeracion.$q$),
    (t_id, $q$Ya estas dentro de la sesion MySQL y quieres ver todas las bases de datos disponibles. Escribe el comando.$q$, array[$q$show databases;$q$, $q$SHOW DATABASES;$q$, $q$show databases$q$]::text[], $q$Es una sentencia SQL que muestra las bases de datos, terminada en punto y coma.$q$, $q$show databases; lista todas las bases de datos del servidor. Las de sistema (information_schema, mysql, performance_schema, sys) vienen por defecto, asi que lo interesante son las que no reconozcas, que suelen contener los datos de la aplicacion. No olvides el punto y coma al final.$q$),
    (t_id, $q$Viste una base de datos llamada 'users' y quieres seleccionarla para trabajar sobre ella. Escribe el comando.$q$, array[$q$use users;$q$, $q$USE users;$q$, $q$use users$q$]::text[], $q$La sentencia SQL para seleccionar una base empieza con use.$q$, $q$use users; te posiciona dentro de esa base de datos, de modo que las consultas siguientes aplican sobre ella. Es el paso previo a listar tablas y leer datos.$q$),
    (t_id, $q$Ya estas dentro de una base de datos y quieres listar todas sus tablas. Escribe el comando.$q$, array[$q$show tables;$q$, $q$SHOW TABLES;$q$, $q$show tables$q$]::text[], $q$Es la sentencia hermana de show databases, pero para tablas.$q$, $q$show tables; lista las tablas de la base seleccionada. De aqui identificas cuales pueden tener credenciales, hashes o informacion sensible, para luego leerlas con un select.$q$);
end
$seed$;

-- ===== MSSQL (9 comandos, 5 ejercicios) =====
do $seed$
declare t_id uuid;
begin
  select id into t_id from public.tools where nombre = $q$MSSQL$q$ order by created_at limit 1;
  if t_id is null then
    insert into public.tools (nombre, protocolo, descripcion) values ($q$MSSQL$q$, $q$MSSQL (1433 tcp)$q$, $q$Microsoft SQL Server. Sistema de gestion de bases de datos de Microsoft, corre por defecto en el puerto 1433. La instancia por defecto suele llamarse MSSQLSERVER y las bases de sistema son master, model, msdb y tempdb. En enumeracion buscamos version, credenciales debiles (tipico sa con clave debil o vacia), configuraciones peligrosas como xp_cmdshell, y una vez dentro exploramos bases y tablas. Cliente principal en Linux: mssqlclient.py de Impacket.$q$) returning id into t_id;
  else
    update public.tools set protocolo = $q$MSSQL (1433 tcp)$q$, descripcion = $q$Microsoft SQL Server. Sistema de gestion de bases de datos de Microsoft, corre por defecto en el puerto 1433. La instancia por defecto suele llamarse MSSQLSERVER y las bases de sistema son master, model, msdb y tempdb. En enumeracion buscamos version, credenciales debiles (tipico sa con clave debil o vacia), configuraciones peligrosas como xp_cmdshell, y una vez dentro exploramos bases y tablas. Cliente principal en Linux: mssqlclient.py de Impacket.$q$ where id = t_id;
    delete from public.commands where tool_id = t_id;
    delete from public.exercises where tool_id = t_id;
  end if;
  insert into public.commands (tool_id, comando, descripcion) values
    (t_id, $q$nmap -sV -p1433 --script ms-sql-info <IP>$q$, $q$Escaneo basico que identifica la instancia MSSQL y trae informacion de version y configuracion.$q$),
    (t_id, $q$nmap -sV -p1433 --script ms-sql-ntlm-info <IP>$q$, $q$Fuerza una respuesta NTLM del servidor que revela NetBIOS, nombre DNS y version del OS.$q$),
    (t_id, $q$nmap -sV -p1433 --script ms-sql-empty-password <IP>$q$, $q$Comprueba si alguna cuenta, tipicamente sa, permite login sin contrasena.$q$),
    (t_id, $q$impacket-mssqlclient <usuario>:<contrasena>@<IP>$q$, $q$Se conecta a la instancia MSSQL con el cliente de Impacket usando autenticacion SQL.$q$),
    (t_id, $q$impacket-mssqlclient <usuario>:<contrasena>@<IP> -windows-auth$q$, $q$Se conecta usando autenticacion de Windows en vez de autenticacion SQL.$q$),
    (t_id, $q$mssqlclient.py <usuario>:<contrasena>@<IP>$q$, $q$Misma conexion invocando directamente el script mssqlclient.py de Impacket.$q$),
    (t_id, $q$SELECT @@version;$q$, $q$Dentro de la sesion MSSQL, devuelve la version completa del servidor.$q$),
    (t_id, $q$SELECT name FROM sys.databases;$q$, $q$Dentro de la sesion, lista todas las bases de datos del servidor.$q$),
    (t_id, $q$enable_xp_cmdshell$q$, $q$Comando del propio mssqlclient que intenta habilitar xp_cmdshell para ejecutar comandos del sistema operativo.$q$);
  insert into public.exercises (tool_id, enunciado, respuestas_aceptadas, pista, explicacion) values
    (t_id, $q$Quieres identificar la instancia MSSQL y traer su informacion basica con el script de nmap especifico. Escribe el comando.$q$, array[$q$nmap -sV -p1433 --script ms-sql-info <IP>$q$, $q$nmap -p1433 --script ms-sql-info <IP>$q$, $q$nmap --script ms-sql-info -p1433 <IP>$q$, $q$sudo nmap -sV -p1433 --script ms-sql-info <IP>$q$]::text[], $q$El script se llama ms-sql-info y MSSQL escucha en el puerto 1433.$q$, $q$nmap -sV -p1433 --script ms-sql-info <IP> identifica la instancia MSSQL y devuelve version, nombre de instancia y datos del servidor. Es el arranque de la enumeracion antes de intentar autenticarte.$q$),
    (t_id, $q$Encontraste las credenciales sa con contrasena 'Password1'. Conectate a la instancia MSSQL usando el cliente de Impacket con autenticacion SQL. Escribe el comando.$q$, array[$q$impacket-mssqlclient sa:Password1@<IP>$q$, $q$mssqlclient.py sa:Password1@<IP>$q$, $q$impacket-mssqlclient sa:Password1@<ip>$q$, $q$python3 mssqlclient.py sa:Password1@<IP>$q$]::text[], $q$El cliente es mssqlclient de Impacket y el formato de credenciales es usuario:contrasena@IP.$q$, $q$impacket-mssqlclient sa:Password1@<IP> abre una sesion contra la instancia usando autenticacion SQL. La cuenta sa es el administrador del sistema en MSSQL, asi que si entras con ella tienes control total. En Linux es el cliente estandar para MSSQL porque no dependes de herramientas de Windows.$q$),
    (t_id, $q$Las credenciales son de dominio y necesitas autenticacion de Windows en vez de SQL. Conectate con el cliente de Impacket usando el flag apropiado. Escribe el comando (usuario sql_svc, clave Secret123, dominio ya incluido en el usuario si aplica).$q$, array[$q$impacket-mssqlclient sql_svc:Secret123@<IP> -windows-auth$q$, $q$mssqlclient.py sql_svc:Secret123@<IP> -windows-auth$q$, $q$impacket-mssqlclient sql_svc:Secret123@<ip> -windows-auth$q$]::text[], $q$Es la misma conexion de Impacket pero agregando el flag -windows-auth al final.$q$, $q$impacket-mssqlclient sql_svc:Secret123@<IP> -windows-auth usa autenticacion de Windows en lugar de la autenticacion SQL nativa. El flag -windows-auth es necesario cuando las credenciales son de cuentas del dominio o locales de Windows y no logins propios de SQL Server.$q$),
    (t_id, $q$Ya estas dentro de la sesion MSSQL y quieres ver la version completa del servidor. Escribe la consulta.$q$, array[$q$SELECT @@version;$q$, $q$select @@version;$q$, $q$SELECT @@VERSION;$q$, $q$select @@version$q$]::text[], $q$Es un SELECT sobre la variable global de version, que lleva doble arroba.$q$, $q$SELECT @@version; devuelve la version completa de SQL Server, incluyendo edicion y sistema operativo. @@version es una variable global del servidor, por eso lleva el doble arroba. Es lo primero que se consulta al entrar para saber contra que estas.$q$),
    (t_id, $q$Dentro de la sesion quieres listar todas las bases de datos del servidor consultando la vista de sistema. Escribe la consulta.$q$, array[$q$SELECT name FROM sys.databases;$q$, $q$select name from sys.databases;$q$, $q$SELECT name FROM sys.databases$q$, $q$select name from sys.databases$q$]::text[], $q$Haz un SELECT del campo name sobre la vista sys.databases.$q$, $q$SELECT name FROM sys.databases; lista todas las bases de datos. Las de sistema (master, model, msdb, tempdb) siempre estan, asi que lo interesante son las bases personalizadas que aparezcan, que contienen los datos reales. En el examen suelen pedir justo el nombre de la base no predeterminada.$q$);
end
$seed$;
