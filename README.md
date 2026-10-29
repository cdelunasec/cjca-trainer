# CJCA Trainer

Entrenador para la certificación CJCA de HackTheBox. Cada servicio de la fase de enumeración
(DNS, FTP, SMB, NFS, SMTP, IMAP/POP3, SNMP, MySQL, MSSQL, Oracle TNS, IPMI) tiene sus
herramientas, comandos y ejercicios, con repaso, progreso por usuario y ranking.

Stack: TanStack Start, React 19, TypeScript, Tailwind 4 y shadcn/ui, con Supabase para
auth y datos.

## Correrlo

```bash
npm install
cp .env.example .env   # VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

El contenido de cada servicio vive en `data/*.json` y las tablas en `supabase/migrations`.

Se publica en Cloudflare Workers con `npm run deploy`: https://cjca-trainer.pwnotes.workers.dev
