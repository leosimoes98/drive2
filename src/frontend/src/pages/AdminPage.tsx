import { EmptyState } from "@/components/EmptyState";
import { Layout } from "@/components/Layout";
import { VehicleStatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useApproveVehicle,
  useGetAdminOverview,
  useGetFeeBalance,
  useGetFeeStatement,
  useListDrivers,
  useListPendingVehicles,
  useRejectVehicle,
} from "@/hooks/useQueries";
import { formatCurrency, formatTimestamp, shortPrincipal } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DriverView, FeeStatementEntry, UserId } from "@/types";
import {
  Car,
  Check,
  CircleDollarSign,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

function OverviewCard({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card
      data-ocid="overview_card"
      className={cn(
        "gap-3 rounded-2xl p-4 shadow-sm",
        accent && "border-primary/40 bg-primary/10",
      )}
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-xl",
          accent
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p
          className={cn(
            "truncate font-display text-2xl font-bold",
            accent && "text-primary",
          )}
        >
          {value}
        </p>
      </div>
    </Card>
  );
}

function VehicleDetail({ driver }: { driver: DriverView }) {
  const v = driver.vehicle;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span className="font-semibold text-foreground">
        {v.brand} {v.model}
      </span>
      <span className="text-muted-foreground">{v.color}</span>
      <span className="text-muted-foreground">{Number(v.year)}</span>
      <Badge
        data-ocid="vehicle_plate"
        variant="outline"
        className="font-mono uppercase"
      >
        {v.plate}
      </Badge>
    </div>
  );
}

function PendingVehiclesSection() {
  const { data: pending, isLoading } = useListPendingVehicles();
  const approve = useApproveVehicle();
  const reject = useRejectVehicle();

  const handleApprove = (driverId: UserId) => {
    approve.mutate(driverId, {
      onSuccess: (result) => {
        if (result.__kind__ === "err") {
          toast.error("Não foi possível aprovar o veículo.");
        } else {
          toast.success("Veículo aprovado.");
        }
      },
      onError: () => toast.error("Erro ao aprovar o veículo."),
    });
  };

  const handleReject = (driverId: UserId) => {
    reject.mutate(driverId, {
      onSuccess: (result) => {
        if (result.__kind__ === "err") {
          toast.error("Não foi possível recusar o veículo.");
        } else {
          toast.success("Veículo recusado.");
        }
      },
      onError: () => toast.error("Erro ao recusar o veículo."),
    });
  };

  return (
    <Card
      data-ocid="pending_vehicles_section"
      className="rounded-2xl shadow-sm"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-4 text-primary" />
          Aprovação de veículos
        </CardTitle>
        <CardDescription>
          Veículos aguardando análise. O motorista só atende corridas após a
          aprovação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !pending || pending.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Nenhum veículo pendente"
            description="Quando um motorista cadastrar um veículo, ele aparecerá aqui para aprovação."
          />
        ) : (
          <ul className="space-y-3">
            {pending.map((driver, index) => (
              <li
                key={driver.id.toString()}
                data-ocid={`pending_vehicle_item.${index + 1}`}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-sm font-bold">
                      {driver.name}
                    </p>
                    <VehicleStatusBadge status={driver.vehicle.status} />
                  </div>
                  <VehicleDetail driver={driver} />
                  <p className="text-xs text-muted-foreground">
                    Cadastrado em {formatTimestamp(driver.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    data-ocid={`approve_vehicle_button.${index + 1}`}
                    size="sm"
                    className="flex-1 sm:flex-none"
                    disabled={approve.isPending || reject.isPending}
                    onClick={() => handleApprove(driver.id)}
                  >
                    <Check className="size-4" />
                    Aprovar
                  </Button>
                  <Button
                    data-ocid={`reject_vehicle_button.${index + 1}`}
                    size="sm"
                    variant="outline"
                    className="flex-1 text-destructive sm:flex-none"
                    disabled={approve.isPending || reject.isPending}
                    onClick={() => handleReject(driver.id)}
                  >
                    <X className="size-4" />
                    Recusar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function DriversSection() {
  const { data: drivers, isLoading } = useListDrivers();

  return (
    <Card data-ocid="drivers_section" className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="size-4 text-primary" />
          Motoristas
        </CardTitle>
        <CardDescription>
          Todos os motoristas cadastrados, com status do veículo e corridas
          realizadas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !drivers || drivers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum motorista"
            description="Os motoristas cadastrados aparecerão aqui."
          />
        ) : (
          <ul className="space-y-3">
            {drivers.map((driver, index) => (
              <li
                key={driver.id.toString()}
                data-ocid={`driver_item.${index + 1}`}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-sm font-bold">
                      {driver.name}
                    </p>
                    <VehicleStatusBadge status={driver.vehicle.status} />
                  </div>
                  <VehicleDetail driver={driver} />
                </div>
                <div className="flex shrink-0 items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Corridas:</span>
                  <span className="font-display font-bold text-primary">
                    {Number(driver.completedRides)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function FeeStatementSection() {
  const { data: entries, isLoading } = useGetFeeStatement();

  return (
    <Card data-ocid="fee_statement_section" className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ReceiptText className="size-4 text-primary" />
          Extrato da taxa (5%)
        </CardTitle>
        <CardDescription>
          Taxa de 5% de cada corrida concluída, por corrida.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !entries || entries.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="Nenhuma taxa registrada"
            description="Quando uma corrida for concluída, a taxa de 5% aparecerá aqui."
          />
        ) : (
          <ul className="space-y-2">
            {entries.map((entry, index) => (
              <FeeStatementRow
                key={entry.rideId.toString()}
                entry={entry}
                index={index}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function FeeStatementRow({
  entry,
  index,
}: {
  entry: FeeStatementEntry;
  index: number;
}) {
  return (
    <li
      data-ocid={`fee_statement_item.${index + 1}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3"
    >
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-semibold text-foreground">
          Corrida #{Number(entry.rideId)}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {formatTimestamp(entry.completedAt)} · Motorista{" "}
          {shortPrincipal(entry.driverId.toString())}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs text-muted-foreground">
          {formatCurrency(entry.fare)}
        </p>
        <p className="font-display text-sm font-bold text-primary">
          +{formatCurrency(entry.fee)}
        </p>
      </div>
    </li>
  );
}

export default function AdminPage() {
  const { data: overview, isLoading: overviewLoading } = useGetAdminOverview();
  const { data: feeBalance, isLoading: balanceLoading } = useGetFeeBalance();

  return (
    <Layout
      title="Drive2"
      subtitle="Administrador"
      navItems={[{ label: "Painel", to: "/admin", icon: LayoutDashboard }]}
    >
      <div className="space-y-6">
        <section data-ocid="overview_section" className="space-y-3">
          <h2 className="font-display text-lg font-bold">Visão geral</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <OverviewCard
              icon={Users}
              label="Motoristas"
              value={
                overviewLoading
                  ? "—"
                  : String(Number(overview?.totalDrivers ?? 0))
              }
            />
            <OverviewCard
              icon={ShieldCheck}
              label="Veículos pendentes"
              value={
                overviewLoading
                  ? "—"
                  : String(Number(overview?.pendingVehicles ?? 0))
              }
            />
            <OverviewCard
              icon={Car}
              label="Corridas concluídas"
              value={
                overviewLoading
                  ? "—"
                  : String(Number(overview?.completedRides ?? 0))
              }
            />
            <OverviewCard
              icon={CircleDollarSign}
              label="Saldo da taxa (5%)"
              value={balanceLoading ? "—" : formatCurrency(feeBalance ?? 0)}
              accent
            />
          </div>
        </section>

        <PendingVehiclesSection />
        <DriversSection />
        <FeeStatementSection />
      </div>
    </Layout>
  );
}
