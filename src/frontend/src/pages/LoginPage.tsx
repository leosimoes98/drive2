import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

export function LoginPage() {
  const { login, isInitializing, isLoggingIn } = useInternetIdentity();
  const [status, setStatus] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setStatus("Iniciando login Google...");
    try {
      await login({ provider: "google" });
      setStatus("Aguardando retorno do login...");
    } catch (err: any) {
      alert("Erro ao logar: " + (err?.message || JSON.stringify(err)));
      setStatus("Erro: " + (err?.message || "falha desconhecida"));
    }
  };

  const handleIILogin = async () => {
    setStatus("Iniciando Internet Identity...");
    try {
      await login();
      setStatus("Aguardando retorno do login...");
    } catch (err: any) {
      alert("Erro ao logar: " + (err?.message || JSON.stringify(err)));
      setStatus("Erro: " + (err?.message || "falha desconhecida"));
    }
  };

  const handleOpenBrowserTest = () => {
    window.location.href = "https://identity.ic0.app";
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-display text-3xl font-bold shadow-elevated">
            D
          </span>
          <h1 className="font-display text-3xl font-bold">Drive2</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Peça uma corrida, dirija ou gerencie sua frota
          </p>
        </div>

        <Card data-ocid="login_card" className="shadow-elevated">
          <CardHeader>
            <CardTitle className="text-base">Entrar</CardTitle>
            <CardDescription>
              Use sua conta Google para acessar o Drive2.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {status && (
              <div className="rounded-lg bg-blue-500/15 p-2 text-center text-xs font-semibold text-blue-600">
                {status}
              </div>
            )}

            <Button
              data-ocid="google_login_button"
              variant="outline"
              className="w-full rounded-xl py-6 text-base font-semibold"
              disabled={isInitializing || isLoggingIn}
              onClick={handleGoogleLogin}
            >
              {isLoggingIn ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <FcGoogle className="size-5" />
              )}
              Continuar com Google
            </Button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              data-ocid="ii_login_button"
              variant="ghost"
              className="w-full rounded-xl py-5 text-sm"
              disabled={isInitializing || isLoggingIn}
              onClick={handleIILogin}
            >
              Entrar com Internet Identity
            </Button>

            <Button
              variant="secondary"
              className="mt-2 w-full text-xs"
              onClick={handleOpenBrowserTest}
            >
              Testar Navegação Direta (Abrir Identity)
            </Button>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          O primeiro usuário a entrar se torna o administrador da plataforma.
        </p>
      </div>
    </div>
  );
}
