import { EmptyState } from "@/components/EmptyState";
import { Layout } from "@/components/Layout";
import { LoadingScreen } from "@/components/LoadingScreen";
import { RideStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useEstimateFare,
  useListMyRides,
  useRequestRide,
} from "@/hooks/useQueries";
import { formatCurrency, formatDistance, formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
  RideError,
  RideStatus,
} from "@/types";
import type { FareEstimate, LatLng, RideView } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import {
  CarFront,
  CircleDollarSign,
  CreditCard,
  History,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const RIDE_ERROR_LABELS: Record<RideError, string> = {
  [RideError.notFound]: "Corrida não encontrada.",
  [RideError.profileRequired]:
    "Complete seu perfil antes de chamar uma corrida.",
  [RideError.notCustomer]: "Apenas clientes podem chamar corridas.",
  [RideError.notDriver]: "Ação disponível apenas para motoristas.",
  [RideError.driverNotApproved]: "Seu veículo ainda não foi aprovado.",
  [RideError.notAvailable]: "Esta corrida não está mais disponível.",
  [RideError.wrongStatus]: "A corrida está em um estado inválido.",
  [RideError.unauthorized]: "Você não tem permissão para esta ação.",
};

function PaymentIcon({ method }: { method: PaymentMethod }) {
  if (method === PaymentMethod.card) {
    return <CreditCard className="size-4" />;
  }
  return <CircleDollarSign className="size-4" />;
}

function StatusLegend() {
  const items: { label: string; dot: string }[] = [
    { label: "Aguardando", dot: "bg-warning" },
    { label: "Aceito", dot: "bg-primary" },
    { label: "Em andamento", dot: "bg-primary" },
    { label: "Concluída", dot: "bg-success" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {items.map((item) => (
        <span
          key={item.label}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span className={cn("size-2 rounded-full", item.dot)} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function FareSummary({ fare }: { fare: FareEstimate }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Valor estimado</span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <Route className="size-3.5" />
          {formatDistance(fare.distanceKm)}
        </span>
      </div>
      <p className="font-display text-4xl font-bold tracking-tight text-primary">
        {formatCurrency(fare.total)}
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span>Taxa base {formatCurrency(fare.baseFare)}</span>
        <span>
          {formatCurrency(fare.perKmRate)}/km ·{" "}
          {formatDistance(fare.distanceKm)}
        </span>
      </div>
    </div>
  );
}

function ActiveRideCard({ ride }: { ride: RideView }) {
  const vehicle = ride.driverVehicle;
  return (
    <div className="overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-subtle">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-primary/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-sm font-bold">
            {ride.driverName ? ride.driverName.charAt(0).toUpperCase() : "?"}
          </span>
          <div>
            <p className="font-display text-base font-bold">
              {ride.driverName ?? "Buscando motorista…"}
            </p>
            <p className="text-xs text-muted-foreground">Motorista</p>
          </div>
        </div>
        <RideStatusBadge status={ride.status} />
      </div>

      <div className="flex flex-col gap-4 px-5 py-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <MapPin className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Destino</p>
            <p className="truncate font-medium">{ride.destinationText}</p>
          </div>
        </div>

        {vehicle ? (
          <div className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <CarFront className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">
                {vehicle.brand} {vehicle.model}
              </p>
              <p className="text-xs text-muted-foreground">
                {vehicle.color} · {vehicle.year.toString()}
              </p>
            </div>
            <span className="ml-auto shrink-0 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-primary">
              {vehicle.plate}
            </span>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <PaymentIcon method={ride.paymentMethod} />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Pagamento</p>
              <p className="font-medium">
                {PAYMENT_METHOD_LABELS[ride.paymentMethod]}
              </p>
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">Valor</p>
            <p className="font-display text-2xl font-bold text-primary">
              {formatCurrency(ride.fare.total)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerPage() {
  const queryClient = useQueryClient();
  const { data: myRides, isLoading } = useListMyRides();
  const estimateFare = useEstimateFare();
  const requestRide = useRequestRide();

  const [destination, setDestination] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.card,
  );
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "error" | "ready"
  >("idle");

  // Capture the customer's current location as the ride origin.
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("error");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus("ready");
      },
      () => setLocationStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  // Auto-estimate the fare once a destination is entered and origin is known.
  useEffect(() => {
    if (!origin || !destination.trim()) return;
    const timer = setTimeout(() => {
      estimateFare.mutate({
        originLat: origin.lat,
        originLng: origin.lng,
        destinationText: destination.trim(),
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [destination, origin, estimateFare.mutate]);

  // Poll for ride status updates while on this screen.
  useEffect(() => {
    const id = setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: ["myRides"] });
    }, 5000);
    return () => clearInterval(id);
  }, [queryClient]);

  const activeRide = myRides?.find(
    (ride) => ride.status !== RideStatus.completed,
  );

  const history = myRides?.filter(
    (ride) => ride.status === RideStatus.completed,
  );

  const canEstimate = !!origin && destination.trim().length > 0;
  const canConfirm = canEstimate && !!estimateFare.data;

  const handleConfirm = () => {
    if (!origin || !destination.trim()) return;
    requestRide.mutate(
      {
        originLat: origin.lat,
        originLng: origin.lng,
        destinationText: destination.trim(),
        paymentMethod,
      },
      {
        onSuccess: (result) => {
          if (result.__kind__ === "ok") {
            setDestination("");
            toast.success("Corrida solicitada! Aguardando motorista.");
          } else {
            toast.error(
              RIDE_ERROR_LABELS[result.err] ??
                "Não foi possível solicitar a corrida.",
            );
          }
        },
        onError: () => {
          toast.error("Erro ao solicitar a corrida. Tente novamente.");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <Layout
        title="Drive2"
        subtitle="Cliente"
        navItems={[
          { label: "Chamar corrida", to: "/customer", icon: Navigation },
          { label: "Histórico", to: "/customer", icon: History },
        ]}
      >
        <LoadingScreen label="Carregando…" />
      </Layout>
    );
  }

  return (
    <Layout
      title="Drive2"
      subtitle="Cliente"
      navItems={[
        { label: "Chamar corrida", to: "/customer", icon: Navigation },
        { label: "Histórico", to: "/customer", icon: History },
      ]}
    >
      <div className="flex flex-col gap-6">
        {activeRide ? (
          <motion.section
            data-ocid="active_ride_section"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3"
          >
            <h2 className="font-display text-lg font-bold">Sua corrida</h2>
            <ActiveRideCard ride={activeRide} />
            <StatusLegend />
          </motion.section>
        ) : (
          <motion.section
            data-ocid="request_ride_section"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-3">
              <h2 className="font-display text-lg font-bold">Chamar corrida</h2>
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-subtle">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <LocateFixed className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Origem</p>
                  {locationStatus === "ready" && origin ? (
                    <p className="truncate font-medium">
                      {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
                    </p>
                  ) : locationStatus === "loading" ? (
                    <p className="font-medium text-muted-foreground">
                      Obtendo localização…
                    </p>
                  ) : (
                    <p className="font-medium text-warning">
                      Localização indisponível
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="destination">Destino</Label>
                <Input
                  id="destination"
                  data-ocid="destination_input"
                  placeholder="Para onde você vai?"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  disabled={locationStatus !== "ready"}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Forma de pagamento</Label>
                <div
                  data-ocid="payment_method_toggle"
                  className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1"
                >
                  {(
                    [
                      [PaymentMethod.card, "Cartão", CreditCard],
                      [PaymentMethod.cash, "Dinheiro", CircleDollarSign],
                    ] as const
                  ).map(([method, label, Icon]) => (
                    <button
                      key={method}
                      type="button"
                      data-ocid={`payment_method_${method}`}
                      onClick={() => setPaymentMethod(method)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        paymentMethod === method
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <Icon className="size-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {estimateFare.data ? (
              <FareSummary fare={estimateFare.data} />
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 px-5 py-6 text-center text-sm text-muted-foreground">
                {canEstimate
                  ? "Calculando o valor estimado…"
                  : "Informe o destino para ver o valor estimado antes de confirmar."}
              </div>
            )}

            <Button
              data-ocid="confirm_ride_button"
              size="lg"
              className="h-12 w-full text-base"
              disabled={!canConfirm || requestRide.isPending}
              onClick={handleConfirm}
            >
              <Navigation className="size-4" />
              {requestRide.isPending ? "Solicitando…" : "Confirmar corrida"}
            </Button>
          </motion.section>
        )}

        <motion.section
          data-ocid="ride_history_section"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3"
        >
          <h2 className="font-display text-lg font-bold">
            Histórico de corridas
          </h2>

          {!history || history.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Nenhuma corrida ainda"
              description="Suas corridas concluídas aparecerão aqui com o valor e a forma de pagamento."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {history.map((ride, index) => (
                <div
                  key={ride.id.toString()}
                  data-ocid={`history_ride.${index + 1}`}
                  className="rounded-2xl border border-border bg-card p-5 shadow-subtle"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-bold">
                        {ride.destinationText}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatTimestamp(ride.completedAt ?? ride.createdAt)}
                      </p>
                    </div>
                    <RideStatusBadge status={ride.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-muted/60 px-3 py-2.5">
                      <p className="text-xs text-muted-foreground">Valor</p>
                      <p className="font-display text-base font-bold text-primary">
                        {formatCurrency(ride.fare.total)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/60 px-3 py-2.5">
                      <p className="text-xs text-muted-foreground">Pagamento</p>
                      <p className="flex items-center gap-1.5 font-medium">
                        <PaymentIcon method={ride.paymentMethod} />
                        {PAYMENT_METHOD_LABELS[ride.paymentMethod]}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </Layout>
  );
}
