// Pantalla de bienvenida para la app instalada (PWA).
//
// Solo aparece cuando la app se abre desde el icono del teléfono
// (display-mode: standalone o navigator.standalone en iOS). Reproduce una
// animación corta con el logo en alta calidad y se desvanece, siguiendo el
// mismo easing "Apple" del resto de la app.

import { useEffect, useState } from "react";

function isStandalone() {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean })
    .standalone;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    window.matchMedia?.("(display-mode: fullscreen)").matches === true ||
    iosStandalone === true
  );
}

export function AppSplash() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!isStandalone()) return;
    // Solo en el arranque real de la app, no en cada navegación.
    if (sessionStorage.getItem("cjca-splash") === "1") return;
    sessionStorage.setItem("cjca-splash", "1");

    setVisible(true);
    document.documentElement.style.overflow = "hidden";
    const t1 = setTimeout(() => setLeaving(true), 900);
    const t2 = setTimeout(() => {
      setVisible(false);
      document.documentElement.style.overflow = "";
    }, 1380);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-[420ms] ease-apple"
      style={{ opacity: leaving ? 0 : 1 }}
    >
      <div
        className="flex flex-col items-center gap-5 transition-transform duration-[420ms] ease-apple"
        style={{ transform: leaving ? "scale(1.06)" : "scale(1)" }}
      >
        <span className="anim-pop block size-28 overflow-hidden rounded-[28px] elev-2">
          <img
            src="/icon-512.png"
            width={512}
            height={512}
            alt=""
            className="size-full object-cover"
          />
        </span>
        <p className="anim-enter font-semibold tracking-tight">CJCA Trainer</p>
        <span className="block h-1 w-24 overflow-hidden rounded-full bg-secondary">
          <span className="block h-full w-1/3 rounded-full bg-primary [animation:cjca-splash-bar_1.1s_cubic-bezier(.22,1,.36,1)_infinite]" />
        </span>
      </div>
    </div>
  );
}
