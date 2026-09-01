import { useListPendingVehicles } from "@/hooks/useQueries";
import AdminPage from "@/pages/AdminPage";
import { renderWithProviders } from "@/test/render";
import { VehicleStatus } from "@/types";
import type { AdminOverview, DriverView, FeeStatementEntry } from "@/types";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const approveVehicleMock = vi.fn();
const rejectVehicleMock = vi.fn();
const pendingVehiclesMock = vi.fn();

const overview: AdminOverview = {
  totalDrivers: 1n,
  pendingVehicles: 1n,
  completedRides: 1n,
  feeBalance: 0.88,
};

const pendingDriver: DriverView = {
  id: "aaaaa-aa" as never,
  name: "Carlos Lima",
  createdAt: 0n,
  completedRides: 0n,
  vehicle: {
    brand: "Toyota",
    model: "Corolla",
    color: "Prata",
    year: 2020n,
    plate: "ABC-1234",
    status: VehicleStatus.pending,
  },
};

const feeEntry: FeeStatementEntry = {
  rideId: 1n,
  customerId: "bbbbb-bb" as never,
  driverId: "aaaaa-aa" as never,
  fare: 17.5,
  fee: 0.88,
  completedAt: 1000n,
};

vi.mock("@/hooks/useQueries", () => ({
  useGetAdminOverview: () => ({ data: overview, isLoading: false }),
  useGetFeeBalance: () => ({ data: 0.88, isLoading: false }),
  useGetFeeStatement: () => ({ data: [feeEntry], isLoading: false }),
  useListDrivers: () => ({ data: [pendingDriver], isLoading: false }),
  useListPendingVehicles: () => pendingVehiclesMock(),
  useApproveVehicle: () => ({ mutate: approveVehicleMock, isPending: false }),
  useRejectVehicle: () => ({ mutate: rejectVehicleMock, isPending: false }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    profile: null,
    isAdmin: true,
    clear: vi.fn(),
  }),
}));

beforeEach(() => {
  approveVehicleMock.mockReset();
  rejectVehicleMock.mockReset();
  pendingVehiclesMock.mockReset();
  pendingVehiclesMock.mockReturnValue({
    data: [pendingDriver],
    isLoading: false,
  });
});

describe("AdminPage", () => {
  it("shows the overview with drivers, pending vehicles, completed rides and fee balance", () => {
    renderWithProviders(<AdminPage />);

    // "Motoristas" appears both as an overview card label and a section title.
    expect(screen.getAllByText("Motoristas").length).toBeGreaterThan(0);
    expect(screen.getByText("Veículos pendentes")).toBeInTheDocument();
    expect(screen.getByText("Corridas concluídas")).toBeInTheDocument();
    expect(screen.getByText("Saldo da taxa (5%)")).toBeInTheDocument();
    expect(screen.getByText("R$ 0,88")).toBeInTheDocument();
  });

  it("approves and rejects a pending vehicle", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);

    // The driver appears in both the pending-vehicles and drivers lists.
    expect(screen.getAllByText("Carlos Lima").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ABC-1234").length).toBeGreaterThan(0);

    await user.click(screen.getByTestId("approve_vehicle_button.1"));
    expect(approveVehicleMock).toHaveBeenCalledWith(
      pendingDriver.id,
      expect.anything(),
    );

    await user.click(screen.getByTestId("reject_vehicle_button.1"));
    expect(rejectVehicleMock).toHaveBeenCalledWith(
      pendingDriver.id,
      expect.anything(),
    );
  });

  it("shows the fee statement with the 5% fee per ride", () => {
    renderWithProviders(<AdminPage />);

    expect(screen.getByText("Corrida #1")).toBeInTheDocument();
    expect(screen.getByText("+R$ 0,88")).toBeInTheDocument();
  });

  it("shows an empty state when there are no pending vehicles", () => {
    pendingVehiclesMock.mockReturnValue({ data: [], isLoading: false });

    renderWithProviders(<AdminPage />);

    expect(screen.getByText("Nenhum veículo pendente")).toBeInTheDocument();
  });
});
