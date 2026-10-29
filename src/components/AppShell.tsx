// Shell autenticado: cabecera glass tipo Apple + guardia de sesión.
//
// Cada ruta autenticada cuelga del layout compartido (src/routes/_layout.tsx),
// así que este shell se monta UNA vez y persiste al navegar: la cabecera no se
// remonta y solo el contenido hace fade (.route-fade).
//
// Animaciones de navegación (según el mockup de diseño de DeLuna):
//  - Pastilla deslizante detrás del tab activo (glide left/width).
//  - Barra de carga superior (LoadingBar) atada al fetching real.

import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LogOut } from "lucide-react";

import logo from "@/assets/cjca-logo.jpg";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LoadingBar } from "@/components/LoadingBar";
import { RouteLoadingOverlay } from "@/components/RouteLoadingOverlay";

const TABS = [
  { to: "/", label: "Inicio", match: (p: string) => p === "/" },
  { to: "/repaso", label: "Repaso", match: (p: string) => p.startsWith("/repaso") },
  { to: "/ranking", label: "Ranking", match: (p: string) => p.startsWith("/ranking") },
];

function Nav({ pathname }: { pathname: string }) {
  const tabRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const [animate, setAnimate] = useState(false);

  const activeTo = TABS.find((t) => t.match(pathname))?.to ?? null;

  useEffect(() => {
    function measure() {
      const el = activeTo ? tabRefs.current[activeTo] : null;
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
      else setPill(null);
    }
    measure();
    const raf = requestAnimationFrame(() => setAnimate(true));
    window.addEventListener("resize", measure);
    // Reobtener medidas cuando las fuentes terminan de cargar (cambia el ancho).
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [activeTo]);

  return (
    <div className="relative flex items-center gap-1">
      <div
        aria-hidden
        className="absolute rounded-full bg-secondary"
        style={{
          top: 0,
          bottom: 0,
          left: pill ? pill.left : 0,
          width: pill ? pill.width : 0,
          opacity: pill ? 1 : 0,
          transition: animate
            ? "left .42s cubic-bezier(.22,1,.36,1), width .42s cubic-bezier(.22,1,.36,1), opacity .2s ease"
            : "opacity .2s ease",
        }}
      />
      {TABS.map((t) => {
        const active = activeTo === t.to;
        return (
          <Link
            key={t.to}
            to={t.to}
            ref={(el: HTMLAnchorElement | null) => {
              tabRefs.current[t.to] = el;
            }}
            className={
              "relative z-10 rounded-full px-3 py-1.5 text-sm transition-colors duration-200 ease-apple active:scale-95 " +
              (active
                ? "font-semibold text-foreground"
                : "font-medium text-muted-foreground hover:text-foreground")
            }
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-[3px] border-secondary border-t-primary" />
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Cargando
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const nombre =
    (user.user_metadata?.["nombre"] as string | undefined) ??
    user.email?.split("@")[0] ??
    "usuario";

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen">
      <LoadingBar />
      <RouteLoadingOverlay />
      <header className="sticky top-0 z-30 border-b glass">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="group flex items-center gap-2.5">
            <span className="block size-8 overflow-hidden rounded-xl elev-1 transition-transform ease-apple group-hover:scale-105">
              <img
                src={logo}
                alt="Logo de CJCA Trainer"
                className="size-full object-cover"
              />
            </span>
            <span className="font-semibold tracking-tight">CJCA Trainer</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Nav pathname={pathname} />
            <span className="mx-1 hidden text-sm text-muted-foreground sm:inline">
              {nombre}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              aria-label="Salir"
              className="text-muted-foreground"
            >
              <LogOut className="size-4" />
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div key={pathname} className="route-fade">
          {children}
        </div>
      </main>
    </div>
  );
}
