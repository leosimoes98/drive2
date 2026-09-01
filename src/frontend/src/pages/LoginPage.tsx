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
  const disabled = isInitializing || isLoggingIn;

  const handleLogin = async (provider?: "google") => {
    try {
      if (provider === "google") {
        await login({ provider: "google" });
      } else {
        await login();
      }
    } catch (err) {
      console.error("Erro na autenticação:", err);
    }
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
            <Button
              data-ocid="google_login_button"
              variant="outline"
              className="w-full rounded-xl py-6 text-base font-semibold"
              disabled={disabled}
              onClick={() => handleLogin("google")}
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
              disabled={disabled}
              onClick={() => handleLogin()}
            >
              Entrar com Internet Identity
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
