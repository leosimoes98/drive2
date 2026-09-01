import {
  useCallerProfile,
  useListAvailableRides,
  useListMyRides,
} from "@/hooks/useQueries";
import DriverPage from "@/pages/DriverPage";
import { renderWithProviders } from "@/test/render";
import { PaymentMethod, RideStatus, VehicleStatus } from "@/types";
import type { FareEstimate, RideView, UserProfile } from "@/types";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const acceptRideMock = vi.fn();
const declineRideMock = vi.fn();
const startRideMock = vi.fn();
const completeRideMock = vi.fn();
const callerProfileMock = vi.fn();
const availableRidesMock = vi.fn();
const myRidesMock = vi.fn();

const fare: FareEstimate = {
  distanceKm: 5,
  baseFare: 5,
  perKmRate: 2.5,
  total: 17.5,
};

const approvedProfile: UserProfile = {
  id: "aaaaa-aa" as never,
  name: "Carlos Lima",
  role: "driver" as never,
  createdAt: 0n,
  vehicle: {
    brand: "Toyota",
    model: "Corolla",
    color: "Prata",
    year: 2020n,
    plate: "ABC-1234",
    status: VehicleStatus.approved,
  },
};

const pendingProfile: UserProfile = {
  ...approvedProfile,
  vehicle: {
    ...approvedProfile.vehicle!,
    status: VehicleStatus.pending,
  },
};

const waitingRide: RideView = {
  id: 1n,
  customerId: "bbbbb-bb" as never,
  customerName: "Ana Souza",
  status: RideStatus.waiting,
  origin: { lat: -23.55, lng: -46.63 },
  destinationText: "Av. Paulista",
  paymentMethod: PaymentMethod.card,
  fare,
  adminFee: 0.875,
  createdAt: 0n,
};

vi.mock("@/hooks/useQueries", () => ({
  useCallerProfile: () => callerProfileMock(),
  useListAvailableRides: () => availableRidesMock(),
  useListMyRides: () => myRidesMock(),
  useAcceptRide: () => ({ mutate: acceptRideMock, isPending: false }),
  useDeclineRide: () => ({ mutate: declineRideMock, isPending: false }),
  useStartRide: () => ({ mutate: startRideMock, isPending: false }),
  useCompleteRide: () => ({ mutate: completeRideMock, isPending: false }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    profile: approvedProfile,
    isAdmin: false,
    clear: vi.fn(),
  }),
}));

beforeEach(() => {
  acceptRideMock.mockReset();
  declineRideMock.mockReset();
  startRideMock.mockReset();
  completeRideMock.mockReset();
  callerProfileMock.mockReset();
  availableRidesMock.mockReset();
  myRidesMock.mockReset();
  callerProfileMock.mockReturnValue({
    data: approvedProfile,
    isLoading: false,
  });
  availableRidesMock.mockReturnValue({ data: [waitingRide], isLoading: false });
  myRidesMock.mockReturnValue({ data: [], isLoading: false });
});

describe("DriverPage", () => {
  it("shows available rides with origin, destination, value and payment method", () => {
    renderWithProviders(<DriverPage />);

    expect(screen.getByText("Av. Paulista")).toBeInTheDocument();
    expect(screen.getByText("R$ 17,50")).toBeInTheDocument();
    expect(screen.getByText("Cartão")).toBeInTheDocument();
    expect(screen.getByText(/-23\.5500, -46\.6300/)).toBeInTheDocument();
  });

  it("accepts and declines a ride", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DriverPage />);

    await user.click(screen.getByTestId("accept_ride_button.1"));
    expect(acceptRideMock).toHaveBeenCalledWith(1n);

    await user.click(screen.getByTestId("decline_ride_button.1"));
    expect(declineRideMock).toHaveBeenCalledWith(1n);
  });

  it("blocks the ride queue while the vehicle is pending approval", () => {
    callerProfileMock.mockReturnValue({
      data: pendingProfile,
      isLoading: false,
    });

    renderWithProviders(<DriverPage />);

    expect(screen.getByText("Veículo em análise")).toBeInTheDocument();
    expect(
      screen.queryByTestId("available_rides_section"),
    ).not.toBeInTheDocument();
  });

  it("starts and completes an accepted ride", async () => {
    const acceptedRide: RideView = {
      ...waitingRide,
      status: RideStatus.accepted,
      driverId: "aaaaa-aa" as never,
      driverName: "Carlos Lima",
    };

    myRidesMock.mockReturnValue({ data: [acceptedRide], isLoading: false });
    availableRidesMock.mockReturnValue({ data: [], isLoading: false });

    const user = userEvent.setup();
    renderWithProviders(<DriverPage />);

    await user.click(screen.getByTestId("start_ride_button"));
    expect(startRideMock).toHaveBeenCalledWith(1n);

    // After starting, the ride is in progress and the complete button appears.
    myRidesMock.mockReturnValue({
      data: [{ ...acceptedRide, status: RideStatus.in_progress }],
      isLoading: false,
    });
    renderWithProviders(<DriverPage />);

    await user.click(screen.getByTestId("complete_ride_button"));
    expect(completeRideMock).toHaveBeenCalledWith(1n);
  });

  it("shows the driver history with the 5% fee deducted", () => {
    const completedRide: RideView = {
      ...waitingRide,
      id: 2n,
      status: RideStatus.completed,
      driverId: "aaaaa-aa" as never,
      driverName: "Carlos Lima",
      completedAt: 1000n,
    };

    myRidesMock.mockReturnValue({ data: [completedRide], isLoading: false });
    availableRidesMock.mockReturnValue({ data: [], isLoading: false });

    renderWithProviders(<DriverPage />);

    expect(screen.getByText("R$ 17,50")).toBeInTheDocument();
    expect(screen.getByText("−R$ 0,88")).toBeInTheDocument();
    // 17.50 - 0.875 = 16.625, which formats to 16.63.
    expect(screen.getByText("R$ 16,63")).toBeInTheDocument();
  });
});
