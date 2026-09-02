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

  // Função adaptada para login móvel via Internet Identity
  const handleIdentityLogin = async () => {
    if (disabled) return;
    
    // Verifica se está rodando dentro do aplicativo nativo (Android/iOS)
    const isNativeApp = window.hasOwnProperty('Capacitor');

    if (isNativeApp) {
      // No celular, redireciona na mesma janela para a WebView não bloquear o pop-up
      window.location.replace("https://ic0.app");
    } else {
      // No navegador comum do PC, mantém o login padrão do pacote
      login();
    }
  };

  // Função provisória para o clique do Google
  const handleGoogleLogin = () => {
    if (disabled) return;
    
    const isNativeApp = window.hasOwnProperty('Capacitor');
    if (isNativeApp) {
      alert("Para o login do Google no APK, certifique-se de configurar a chave SHA-1 no console do Firebase.");
    } else {
      console.log("Login Google executado no navegador");
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
          <CardContent className="flex flex-col gap-4">
            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={disabled}
              className="w-full bg-[#b8860b] text-white hover:bg-[#99700a] flex items-center justify-center gap-2"
            >
              <FcGoogle className="size-5 bg-white rounded-full p-0.5" />
              Continuar com Google
            </Button>

            <div className="relative flex items-center justify-center text-xs uppercase my-2">
              <span className="absolute inset-x-0 h-px bg-border" />
              <span className="relative bg-card px-2 text-muted-foreground">ou</span>
            </div>

            
              {disabled ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Entrar com Internet Identity"
              )}
            </Button>
            
            <p className="mt-4 text-center text-xs text-muted-foreground">
              O primeiro usuário a entrar se torna o administrador da plataforma.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
