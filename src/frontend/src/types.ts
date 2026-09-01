// Shared application types for Drive2.
// Re-export the generated backend contract so pages import from a single place.
import {
  PaymentMethod,
  ProfileRole,
  RideStatus,
  VehicleStatus,
} from "@/backend";

export type {
  UserProfile,
  Vehicle,
  VehicleInput,
  RideView,
  FareEstimate,
  LatLng,
  DriverView,
  AdminOverview,
  FeeStatementEntry,
  UserId,
  Timestamp,
  Result,
  Result_1,
  Result_2,
  Result_3,
} from "@/backend";

export {
  ProfileRole,
  ProfileError,
  VehicleStatus,
  RideStatus,
  PaymentMethod,
  RideError,
  AdminError,
  UserRole,
} from "@/backend";

// Human-readable labels for the Portuguese UI.
export const PROFILE_ROLE_LABELS: Record<ProfileRole, string> = {
  [ProfileRole.customer]: "Cliente",
  [ProfileRole.driver]: "Motorista",
};

export const RIDE_STATUS_LABELS: Record<RideStatus, string> = {
  [RideStatus.waiting]: "Aguardando",
  [RideStatus.accepted]: "Aceito",
  [RideStatus.in_progress]: "Em andamento",
  [RideStatus.completed]: "Concluída",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.card]: "Cartão",
  [PaymentMethod.cash]: "Dinheiro",
};

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  [VehicleStatus.pending]: "Pendente",
  [VehicleStatus.approved]: "Aprovado",
  [VehicleStatus.rejected]: "Recusado",
};
