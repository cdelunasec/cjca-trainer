import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, Copy } from "lucide-react";

import { PracticePanel } from "@/components/PracticePanel";
import { useCommands, useExercises, useTool } from "@/lib/queries";
import type { Command } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_layout/tools/$toolId")({
  component: ToolDetail,
});

function ToolDetail() {
  const { toolId } = Route.useParams();
  const { data: tool, isLoading: loadingTool } = useTool(toolId);
  const { data: commands, isLoading: loadingCmds } = useCommands(toolId);
  const { data: exercises, isLoading: loadingEx } = useExercises(toolId);

  return (
    <div className="anim-enter space-y-6">
      <div>
        <Link
          to="/"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors ease-apple hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Herramientas
        </Link>
        {loadingTool ? (
          <Skeleton className="h-9 w-44" />
        ) : tool ? (
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{tool.nombre}</h1>
              <span className="rounded-full border bg-secondary px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {tool.protocolo}
              </span>
            </div>
            {tool.descripcion && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {tool.descripcion}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Herramienta no encontrada.</p>
        )}
      </div>

      <Tabs defaultValue="practica">
        <TabsList className="rounded-full">
          <TabsTrigger value="practica" className="rounded-full">
            Práctica
          </TabsTrigger>
          <TabsTrigger value="cheatsheet" className="rounded-full">
            Cheatsheet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="practica" className="mt-5">
          {loadingEx ? (
            <Skeleton className="h-56 w-full rounded-2xl" />
          ) : (
            <PracticePanel exercises={exercises ?? []} scope={toolId} />
          )}
        </TabsContent>

        <TabsContent value="cheatsheet" className="mt-5">
          {loadingCmds ? (
            <Skeleton className="h-56 w-full rounded-2xl" />
          ) : (commands?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border bg-card py-12 text-center text-sm text-muted-foreground elev-1">
              Aún no hay comandos para esta herramienta. Se cargarán por tandas.
            </div>
          ) : (
            <div className="space-y-2.5">
              {commands!.map((cmd, i) => (
                <CommandRow key={cmd.id} command={cmd} index={i} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CommandRow({ command, index }: { command: Command; index: number }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command.comando);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard no disponible; se ignora en silencio
    }
  }

  return (
    <div
      className="anim-enter group flex items-start justify-between gap-3 rounded-xl border bg-card p-3 elev-1 ease-apple transition-all hover:elev-2"
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      <div className="min-w-0 flex-1">
        <code className="flex items-start gap-2 overflow-x-auto whitespace-pre rounded-lg bg-muted/50 px-3 py-2 font-mono text-sm">
          <span className="select-none text-primary/70">$</span>
          <span>{command.comando}</span>
        </code>
        {command.descripcion && (
          <p className="mt-1.5 px-1 text-sm text-muted-foreground">
            {command.descripcion}
          </p>
        )}
      </div>
      <button
        onClick={copy}
        aria-label="Copiar comando"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors ease-apple hover:bg-secondary hover:text-foreground"
      >
        {copied ? (
          <Check className="size-4 anim-pop text-success" />
        ) : (
          <Copy className="size-4" />
        )}
      </button>
    </div>
  );
}
