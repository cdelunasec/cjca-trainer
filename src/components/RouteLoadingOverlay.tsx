// Indicador de "Cargando" durante las navegaciones y las cargas de datos.
//
// Se alimenta del estado real del router (navegación pendiente) y de
// react-query (peticiones en vuelo). Aparece con un pequeño retardo para no
// parpadear en cargas instantáneas y usa el mismo lenguaje visual del resto
// de la app (glass + easing Apple + fade).

import { useIsFetching } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const DELAY_MS = 180;

export function RouteLoadingOverlay() {
  const navigating = useRouterState({
    select: (s) => s.isLoading || s.isTransitioning,
  });
  const fetching = useIsFetching();
  const active = navigating || fetching > 0;

  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) {
      setShow(false);
      return;
    }
    const t = window.setTimeout(() => setShow(true), DELAY_MS);
    return () => window.clearTimeout(t);
  }, [active]);

  return (
    <div
      aria-hidden={!show}
      className="pointer-events-none fixed inset-x-0 top-16 z-40 flex justify-center"
    >
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 rounded-full border px-3.5 py-1.5 glass elev-2"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0) scale(1)" : "translateY(-8px) scale(0.96)",
          transition:
            "opacity .28s ease, transform .42s cubic-bezier(.22,1,.36,1)",
        }}
      >
        <span className="size-3.5 animate-spin rounded-full border-2 border-secondary border-t-primary" />
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Cargando
        </span>
      </div>
    </div>
  );
}
