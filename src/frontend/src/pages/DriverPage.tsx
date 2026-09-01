import { EmptyState } from "@/components/EmptyState";
import { Layout } from "@/components/Layout";
import { LoadingScreen } from "@/components/LoadingScreen";
import { RideStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  useAcceptRide,
  useCallerProfile,
  useCompleteRide,
  useDeclineRide,
  useListAvailableRides,
  useListMyRides,
  useStartRide,
} from "@/hooks/useQueries";
import { formatCurrency, formatDistance, formatTimestamp } from "@/lib/format";
import {
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
  RideStatus,
  VehicleStatus,
} from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import {
  CarFront,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  CreditCard,
  Flag,
  MapPin,
  Navigation,
  Play,
  Route,
  Wallet,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";

function PaymentIcon({ method }: { method: PaymentMethod }) {
  if (method === PaymentMethod.card) {
    return <CreditCard className="size-4" />;
  }
  return <CircleDollarSign className="size-4" />;
}

export default function DriverPage() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const { data: availableRides, isLoading: availableLoading } =
    useListAvailableRides();
  const { data: myRides, isLoading: myRidesLoading } = useListMyRides();

  const acceptRide = useAcceptRide();
  const declineRide = useDeclineRide();
  const startRide = useStartRide();
  const completeRide = useCompleteRide();

  // Poll for new available rides while the driver is on this screen.
  useEffect(() => {
    const id = setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: ["availableRides"] });
    }, 10000);
    return () => clearInterval(id);
  }, [queryClient]);

  if (profileLoading || availableLoading || myRidesLoading) {
    return (
      <Layout
        title="Drive2"
        subtitle="Motorista"
        navItems={[{ label: "Corridas", to: "/driver", icon: CarFront }]}
      >
        <LoadingScreen label="Carregando corridas…" />
      </Layout>
    );
  }

  const approved = profile?.vehicle?.status === VehicleStatus.approved;

  const activeRide = myRides?.find(
    (ride) =>
      ride.status === RideStatus.accepted ||
      ride.status === RideStatus.in_progress,
  );

  const history = myRides?.filter(
    (ride) => ride.status === RideStatus.completed,
  );

  return (
    <Layout
      title="Drive2"
      subtitle="Motorista"
      navItems={[{ label: "Corridas", to: "/driver", icon: CarFront }]}
    >
      <div className="flex flex-col gap-6">
        {!approved ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <EmptyState
              icon={Clock}
              title="Veículo em análise"
              description="Seu veículo está aguardando aprovação do administrador. Assim que for aprovado, as chamadas disponíveis aparecerão aqui para você aceitar."
            />
          </motion.div>
        ) : (
          <>
            {activeRide ? (
              <motion.section
                data-ocid="active_ride_section"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3"
              >
                <h2 className="font-display text-lg font-bold">
                  Corrida em andamento
                </h2>
                <div className="overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-subtle">
                  <div className="flex items-center justify-between gap-3 border-b border-border bg-primary/10 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-sm font-bold">
                        {activeRide.customerName.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-display text-base font-bold">
                          {activeRide.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground">Cliente</p>
                      </div>
                    </div>
                    <RideStatusBadge status={activeRide.status} />
                  </div>

                  <div className="flex flex-col gap-4 px-5 py-5">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <MapPin className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Destino</p>
                        <p className="truncate font-medium">
                          {activeRide.destinationText}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                      <div className="flex items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <PaymentIcon method={activeRide.paymentMethod} />
                        </span>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Pagamento
                          </p>
                          <p className="font-medium">
                            {PAYMENT_METHOD_LABELS[activeRide.paymentMethod]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Route className="size-4" />
                        </span>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Distância
                          </p>
                          <p className="font-medium">
                            {formatDistance(activeRide.fare.distanceKm)}
                          </p>
                        </div>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-xs text-muted-foreground">Valor</p>
                        <p className="font-display text-2xl font-bold text-primary">
                          {formatCurrency(activeRide.fare.total)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      {activeRide.status === RideStatus.accepted ? (
                        <Button
                          data-ocid="start_ride_button"
                          className="flex-1"
                          size="lg"
                          disabled={startRide.isPending}
                          onClick={() => startRide.mutate(activeRide.id)}
                        >
                          <Play className="size-4" />
                          Iniciar corrida
                        </Button>
                      ) : (
                        <Button
                          data-ocid="complete_ride_button"
                          className="flex-1"
                          size="lg"
                          disabled={completeRide.isPending}
                          onClick={() => completeRide.mutate(activeRide.id)}
                        >
                          <Flag className="size-4" />
                          Concluir corrida
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.section>
            ) : null}

            <motion.section
              data-ocid="available_rides_section"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">
                  Chamadas disponíveis
                </h2>
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {availableRides?.length ?? 0}
                </span>
              </div>

              {!availableRides || availableRides.length === 0 ? (
                <EmptyState
                  icon={Navigation}
                  title="Nenhuma chamada no momento"
                  description="Novas chamadas aparecem aqui automaticamente. Fique atento para aceitar a próxima corrida."
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {availableRides.map((ride, index) => (
                    <motion.div
                      key={ride.id.toString()}
                      data-ocid={`available_ride.${index + 1}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="rounded-2xl border border-border bg-card p-5 shadow-subtle"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-display text-base font-bold">
                            {ride.destinationText}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatDistance(ride.fare.distanceKm)} ·{" "}
                            {formatTimestamp(ride.createdAt)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-display text-xl font-bold text-primary">
                            {formatCurrency(ride.fare.total)}
                          </p>
                          <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                            <PaymentIcon method={ride.paymentMethod} />
                            {PAYMENT_METHOD_LABELS[ride.paymentMethod]}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <MapPin className="size-3.5" />
                        </span>
                        <p className="truncate text-sm text-muted-foreground">
                          {ride.origin.lat.toFixed(4)},{" "}
                          {ride.origin.lng.toFixed(4)}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <Button
                          data-ocid={`accept_ride_button.${index + 1}`}
                          className="flex-1"
                          disabled={acceptRide.isPending}
                          onClick={() => acceptRide.mutate(ride.id)}
                        >
                          <CheckCircle2 className="size-4" />
                          Aceitar
                        </Button>
                        <Button
                          data-ocid={`decline_ride_button.${index + 1}`}
                          variant="outline"
                          className="flex-1"
                          disabled={declineRide.isPending}
                          onClick={() => declineRide.mutate(ride.id)}
                        >
                          <X className="size-4" />
                          Recusar
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>

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
                  title="Nenhuma corrida concluída"
                  description="Suas corridas concluídas aparecerão aqui com o valor e a taxa de 5% descontada."
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {history.map((ride, index) => {
                    const net = ride.fare.total - ride.adminFee;
                    return (
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
                              {formatTimestamp(
                                ride.completedAt ?? ride.createdAt,
                              )}
                            </p>
                          </div>
                          <RideStatusBadge status={ride.status} />
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3">
                          <div className="rounded-xl bg-muted/60 px-3 py-2.5">
                            <p className="text-xs text-muted-foreground">
                              Valor
                            </p>
                            <p className="font-display text-base font-bold">
                              {formatCurrency(ride.fare.total)}
                            </p>
                          </div>
                          <div className="rounded-xl bg-muted/60 px-3 py-2.5">
                            <p className="text-xs text-muted-foreground">
                              Taxa (5%)
                            </p>
                            <p className="font-display text-base font-bold text-warning">
                              −{formatCurrency(ride.adminFee)}
                            </p>
                          </div>
                          <div className="rounded-xl bg-primary/10 px-3 py-2.5">
                            <p className="text-xs text-muted-foreground">
                              Você recebe
                            </p>
                            <p className="font-display text-base font-bold text-primary">
                              {formatCurrency(net)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.section>
          </>
        )}
      </div>
    </Layout>
  );
}
