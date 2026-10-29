UPDATE public.exercises
SET respuestas_aceptadas = array[$q$nmap -sV -sC -p21 10.10.10.10$q$, $q$nmap -sV -p21 -sC -A 10.10.10.10$q$, $q$nmap -sV -sC -p21 -A 10.10.10.10$q$, $q$nmap -sV -p21 -sC 10.10.10.10$q$, $q$nmap -p21 -sV -sC 10.10.10.10$q$, $q$nmap -sC -sV -p21 10.10.10.10$q$]::text[]
WHERE enunciado = $q$Estas enumerando el objetivo 10.10.10.10. Escanea su puerto 21 para traer la version del servicio y correr los scripts por defecto de nmap. Escribe el comando.$q$;

UPDATE public.exercises
SET respuestas_aceptadas = array[$q$nmap -p21 --script ftp-anon 10.10.10.10$q$, $q$nmap -sV -p21 --script ftp-anon 10.10.10.10$q$, $q$nmap --script ftp-anon -p21 10.10.10.10$q$, $q$nmap -p21 --script=ftp-anon 10.10.10.10$q$]::text[]
WHERE enunciado = $q$Quieres comprobar puntualmente si el FTP de 10.10.10.10 permite login anonimo, corriendo solo ese script de nmap. Escribe el comando.$q$;

UPDATE public.exercises
SET respuestas_aceptadas = array[$q$nmap -p3306 --script mysql-empty-password 10.10.10.10$q$, $q$nmap -sV -p3306 --script mysql-empty-password 10.10.10.10$q$, $q$nmap --script mysql-empty-password -p3306 10.10.10.10$q$, $q$sudo nmap -sV -p3306 --script mysql-empty-password 10.10.10.10$q$]::text[]
WHERE enunciado = $q$Sospechas que el MySQL de 10.10.10.10 permite login sin contrasena y quieres comprobarlo con el script de nmap correspondiente. Escribe el comando.$q$;

UPDATE public.exercises
SET respuestas_aceptadas = array[$q$nmap -p1433 --script ms-sql-info 10.10.10.10$q$, $q$nmap -sV -p1433 --script ms-sql-info 10.10.10.10$q$, $q$nmap --script ms-sql-info -p1433 10.10.10.10$q$, $q$sudo nmap -sV -p1433 --script ms-sql-info 10.10.10.10$q$]::text[]
WHERE enunciado = $q$Quieres identificar la instancia MSSQL de 10.10.10.10 y traer su informacion basica con el script de nmap especifico. Escribe el comando.$q$;