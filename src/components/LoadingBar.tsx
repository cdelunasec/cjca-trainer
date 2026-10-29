// Barra de carga superior (estilo "barra" del mockup de diseño). Se alimenta
// del estado real de react-query: mientras haya queries en vuelo, la barra
// avanza; al terminar, se completa y se desvanece. Nada de delays falsos.

import { useIsFetching } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

export function LoadingBar() {
  const fetching = useIsFetching();
  const [progress, setProgress] = useState(0); // 0..1
  const [visible, setVisible] = useState(false);
  const prevActive = useRef(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const active = fetching > 0;
    if (active === prevActive.current) return;
    prevActive.current = active;

    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (active) {
      setVisible(true);
      setProgress(0.08);
      // avance "trickle" hacia ~75% mientras carga
      timers.current.push(window.setTimeout(() => setProgress(0.75), 120));
    } else {
      setProgress(1);
      timers.current.push(window.setTimeout(() => setVisible(false), 260));
      timers.current.push(window.setTimeout(() => setProgress(0), 540));
    }

    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, [fetching]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px]">
      <div
        className="h-full rounded-r-full"
        style={{
          width: `${progress * 100}%`,
          opacity: visible ? 1 : 0,
          background: "linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 60%, white))",
          boxShadow: "0 0 10px color-mix(in srgb, var(--primary) 55%, transparent)",
          transition:
            "width 0.28s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",
        }}
      />
    </div>
  );
}
