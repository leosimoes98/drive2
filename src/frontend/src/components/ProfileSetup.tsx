import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateProfile } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { ProfileRole } from "@/types";
import { Car, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ProfileSetup() {
  const [role, setRole] = useState<ProfileRole>(ProfileRole.customer);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [color, setColor] = useState("");
  const [year, setYear] = useState("");

  const createProfile = useCreateProfile();

  const isDriver = role === ProfileRole.driver;
  const vehicleComplete =
    brand.trim() && model.trim() && plate.trim() && color.trim() && year.trim();
  const canSubmit = name.trim().length > 0 && (!isDriver || vehicleComplete);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || createProfile.isPending) return;
    const vehicle = isDriver
      ? {
          brand: brand.trim(),
          model: model.trim(),
          plate: plate.trim().toUpperCase(),
          color: color.trim(),
          year: BigInt(Number(year)),
        }
      : null;
    createProfile.mutate(
      { role, name: name.trim(), vehicle },
      {
        onSuccess: (result) => {
          if (result.__kind__ === "err") {
            toast.error("Não foi possível criar o perfil. Tente novamente.");
          }
        },
        onError: () => {
          toast.error("Erro ao criar o perfil. Tente novamente.");
        },
      },
    );
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-display text-2xl font-bold">
            D
          </span>
          <h1 className="font-display text-2xl font-bold">Crie seu perfil</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha como você quer usar o Drive2
          </p>
        </div>

        <Card data-ocid="profile_setup_card" className="shadow-elevated">
          <CardHeader>
            <CardTitle className="text-base">Como você vai usar?</CardTitle>
            <CardDescription>
              Você pode escolher entre pedir corridas ou dirigir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  data-ocid="role_customer"
                  onClick={() => setRole(ProfileRole.customer)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all",
                    role === ProfileRole.customer
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-input",
                  )}
                >
                  <User className="size-6" />
                  <span className="text-sm font-semibold">Cliente</span>
                  <span className="text-xs">Peço corridas</span>
                </button>
                <button
                  type="button"
                  data-ocid="role_driver"
                  onClick={() => setRole(ProfileRole.driver)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all",
                    role === ProfileRole.driver
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-input",
                  )}
                >
                  <Car className="size-6" />
                  <span className="text-sm font-semibold">Motorista</span>
                  <span className="text-xs">Atendo corridas</span>
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  data-ocid="profile_name_input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  autoComplete="name"
                />
              </div>

              {isDriver ? (
                <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Dados do veículo
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="brand">Marca</Label>
                      <Input
                        id="brand"
                        data-ocid="vehicle_brand_input"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="Ex.: Toyota"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Modelo</Label>
                      <Input
                        id="model"
                        data-ocid="vehicle_model_input"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="Ex.: Corolla"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plate">Placa</Label>
                      <Input
                        id="plate"
                        data-ocid="vehicle_plate_input"
                        value={plate}
                        onChange={(e) => setPlate(e.target.value)}
                        placeholder="ABC-1234"
                        maxLength={8}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="color">Cor</Label>
                      <Input
                        id="color"
                        data-ocid="vehicle_color_input"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="Ex.: Prata"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Ano</Label>
                      <Input
                        id="year"
                        data-ocid="vehicle_year_input"
                        value={year}
                        onChange={(e) =>
                          setYear(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="2020"
                        inputMode="numeric"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Seu veículo ficará pendente de aprovação pelo administrador.
                  </p>
                </div>
              ) : null}

              <Button
                type="submit"
                data-ocid="profile_submit_button"
                className="w-full rounded-xl py-6 text-base font-semibold"
                disabled={!canSubmit || createProfile.isPending}
              >
                {createProfile.isPending
                  ? "Criando…"
                  : isDriver
                    ? "Criar perfil de motorista"
                    : "Criar perfil de cliente"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
