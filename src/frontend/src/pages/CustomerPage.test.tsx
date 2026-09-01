import { useListMyRides } from "@/hooks/useQueries";
import CustomerPage from "@/pages/CustomerPage";
import { renderWithProviders } from "@/test/render";
import { PaymentMethod, RideStatus } from "@/types";
import type { FareEstimate, RideView } from "@/types";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const estimateFareMock = vi.fn();
const requestRideMock = vi.fn();
const listMyRidesMock = vi.fn();

const fare: FareEstimate = {
  distanceKm: 5,
  baseFare: 5,
  perKmRate: 2.5,
  total: 17.5,
};

vi.mock("@/hooks/useQueries", () => ({
  useListMyRides: () => listMyRidesMock(),
  useEstimateFare: () => ({
    mutate: estimateFareMock,
    data: fare,
    isPending: false,
  }),
  useRequestRide: () => ({
    mutate: requestRideMock,
    isPending: false,
  }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    profile: { name: "Ana Souza" },
    isAdmin: false,
    clear: vi.fn(),
  }),
}));

// Provide a fixed geolocation so the origin is "ready" and the destination
// input is enabled.
const geolocationMock = {
  getCurrentPosition: vi.fn((success: PositionCallback) =>
    success({
      coords: { latitude: -23.55, longitude: -46.63 },
    } as GeolocationPosition),
  ),
};

beforeEach(() => {
  estimateFareMock.mockReset();
  requestRideMock.mockReset();
  listMyRidesMock.mockReset();
  listMyRidesMock.mockReturnValue({ data: [], isLoading: false });
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: geolocationMock,
  });
});

describe("CustomerPage", () => {
  it("shows the estimated fare and confirms a ride with the chosen payment method", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CustomerPage />);

    // Origin is captured from geolocation.
    expect(await screen.findByText(/-23\.5500, -46\.6300/)).toBeInTheDocument();

    // Enter a destination; the fare summary is already provided by the mock.
    await user.type(screen.getByTestId("destination_input"), "Av. Paulista");

    // The estimated value is displayed.
    expect(screen.getByText("R$ 17,50")).toBeInTheDocument();

    // Switch to cash payment.
    await user.click(screen.getByTestId("payment_method_cash"));

    await user.click(screen.getByTestId("confirm_ride_button"));

    expect(requestRideMock).toHaveBeenCalledTimes(1);
    const [input] = requestRideMock.mock.calls[0];
    expect(input.destinationText).toBe("Av. Paulista");
    expect(input.paymentMethod).toBe(PaymentMethod.cash);
    expect(input.originLat).toBe(-23.55);
    expect(input.originLng).toBe(-46.63);
  });

  it("shows an active ride with the driver name, vehicle and plate", () => {
    const activeRide: RideView = {
      id: 1n,
      customerId: "aaaaa-aa" as never,
      customerName: "Ana Souza",
      status: RideStatus.accepted,
      origin: { lat: -23.55, lng: -46.63 },
      destinationText: "Shopping",
      paymentMethod: PaymentMethod.card,
      fare,
      adminFee: 0.875,
      createdAt: 0n,
      driverName: "Carlos Lima",
      driverVehicle: {
        brand: "Toyota",
        model: "Corolla",
        color: "Prata",
        year: 2020n,
        plate: "ABC-1234",
        status: "approved" as never,
      },
    };

    listMyRidesMock.mockReturnValue({ data: [activeRide], isLoading: false });

    renderWithProviders(<CustomerPage />);

    expect(screen.getByText("Carlos Lima")).toBeInTheDocument();
    expect(screen.getByText("Toyota Corolla")).toBeInTheDocument();
    expect(screen.getByText("ABC-1234")).toBeInTheDocument();
  });

  it("shows the ride history with value and payment method", () => {
    const completedRide: RideView = {
      id: 2n,
      customerId: "aaaaa-aa" as never,
      customerName: "Ana Souza",
      status: RideStatus.completed,
      origin: { lat: -23.55, lng: -46.63 },
      destinationText: "Aeroporto",
      paymentMethod: PaymentMethod.card,
      fare,
      adminFee: 0.875,
      createdAt: 0n,
      completedAt: 1000n,
    };

    listMyRidesMock.mockReturnValue({
      data: [completedRide],
      isLoading: false,
    });

    renderWithProviders(<CustomerPage />);

    expect(screen.getByText("Aeroporto")).toBeInTheDocument();
    // The fare appears in the estimate summary and in the history card.
    expect(screen.getAllByText("R$ 17,50").length).toBeGreaterThan(0);
    // "Cartão" appears both as a payment-method button and in the history card.
    expect(screen.getAllByText("Cartão").length).toBeGreaterThan(0);
  });
});
