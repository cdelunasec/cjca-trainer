import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import logo from "@/assets/cjca-logo.jpg";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Pestaña controlada para animar la transición Entrar <-> Registrarse:
  // el panel entrante se desliza desde el lado correcto y la tarjeta ajusta
  // su altura de forma suave en vez de dar un salto.
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [dir, setDir] = useState<"left" | "right">("right");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const firstRender = useRef(true);

  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tab]);

  useEffect(() => {
    firstRender.current = false;
  }, []);

  function changeTab(next: string) {
    const value = next === "signup" ? "signup" : "signin";
    if (value === tab) return;
    setDir(value === "signup" ? "right" : "left");
    setTab(value);
  }

  // Ya autenticado → a inicio.
  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error("No se pudo entrar", { description: error });
      return;
    }
    toast.success("Bienvenido de vuelta");
    navigate({ to: "/" });
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const nombre = String(form.get("nombre") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(email, password, nombre);
    setSubmitting(false);
    if (error) {
      toast.error("No se pudo registrar", { description: error });
      return;
    }
    toast.success("Cuenta creada", {
      description: "Si no entras directo, revisa tu correo o inicia sesión.",
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="anim-enter w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 size-12 overflow-hidden rounded-2xl elev-2">
            <img
              src={logo}
              alt="Logo de CJCA Trainer"
              className="size-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">CJCA Trainer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Práctica de comandos para la certificación CJCA.
          </p>
        </div>

        <Card className="rounded-2xl border elev-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Accede a tu cuenta</CardTitle>
            <CardDescription>Tu progreso es solo tuyo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={changeTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Registrarse</TabsTrigger>
              </TabsList>

              <div
                className="relative mt-4 overflow-hidden transition-[height] duration-[380ms] ease-apple"
                style={{ height: height ?? undefined }}
              >
                <div
                  ref={panelRef}
                  key={tab}
                  className={
                    "pb-1 " +
                    (firstRender.current
                      ? ""
                      : dir === "right"
                        ? "slide-from-right"
                        : "slide-from-left")
                  }
                >
                  {tab === "signin" ? (
                    <>
                      <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signin-email">Correo</Label>
                          <Input
                            id="signin-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="tu@correo.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signin-password">Contraseña</Label>
                          <Input
                            id="signin-password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={submitting}>
                          {submitting ? "Entrando..." : "Entrar"}
                        </Button>
                      </form>
                    </>
                  ) : (
                    <>
                      <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-nombre">Nombre</Label>
                          <Input
                            id="signup-nombre"
                            name="nombre"
                            type="text"
                            autoComplete="name"
                            required
                            placeholder="DeLuna"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Correo</Label>
                          <Input
                            id="signup-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="tu@correo.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Contraseña</Label>
                          <Input
                            id="signup-password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            placeholder="Mínimo 6 caracteres"
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={submitting}>
                          {submitting ? "Creando cuenta..." : "Crear cuenta"}
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
