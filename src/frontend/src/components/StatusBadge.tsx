import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  RIDE_STATUS_LABELS,
  RideStatus,
  VEHICLE_STATUS_LABELS,
  VehicleStatus,
} from "@/types";

const rideStatusStyles: Record<RideStatus, string> = {
  [RideStatus.waiting]: "bg-warning/15 text-warning border-warning/30",
  [RideStatus.accepted]: "bg-primary/15 text-primary border-primary/30",
  [RideStatus.in_progress]: "bg-primary/15 text-primary border-primary/30",
  [RideStatus.completed]:
    "bg-secondary text-secondary-foreground border-border",
};

const vehicleStatusStyles: Record<VehicleStatus, string> = {
  [VehicleStatus.pending]: "bg-warning/15 text-warning border-warning/30",
  [VehicleStatus.approved]: "bg-success/15 text-success border-success/30",
  [VehicleStatus.rejected]:
    "bg-destructive/15 text-destructive border-destructive/30",
};

export function RideStatusBadge({ status }: { status: RideStatus }) {
  return (
    <Badge
      data-ocid="ride_status_badge"
      variant="outline"
      className={cn("border", rideStatusStyles[status])}
    >
      {RIDE_STATUS_LABELS[status]}
    </Badge>
  );
}

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  return (
    <Badge
      data-ocid="vehicle_status_badge"
      variant="outline"
      className={cn("border", vehicleStatusStyles[status])}
    >
      {VEHICLE_STATUS_LABELS[status]}
    </Badge>
  );
}
