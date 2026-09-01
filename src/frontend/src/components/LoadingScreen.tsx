import { Loader2 } from "lucide-react";

export function LoadingScreen({ label = "Carregando…" }: { label?: string }) {
  return (
    <div
      data-ocid="loading_state"
      className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background text-muted-foreground"
    >
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
