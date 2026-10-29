import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

// Layout persistente para las rutas autenticadas. El shell (cabecera + guardia)
// se monta una sola vez aquí y sobrevive a la navegación entre secciones; solo
// cambia el <Outlet />, lo que da una transición fluida sin re-montar el header.
export const Route = createFileRoute("/_layout")({
  component: LayoutRoute,
});

function LayoutRoute() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
