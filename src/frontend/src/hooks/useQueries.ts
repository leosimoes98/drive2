import { createActor } from "@/backend";
import type { PaymentMethod, ProfileRole, UserId, VehicleInput } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ---- Profile & auth ----

export function useCallerProfile() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerUserRole() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["callerUserRole"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateProfile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      role: ProfileRole;
      name: string;
      vehicle: VehicleInput | null;
    }) => {
      if (!actor) throw new Error("Backend não está pronto");
      return actor.createProfile(input.role, input.name, input.vehicle);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useUpdateProfile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Backend não está pronto");
      return actor.updateProfile(name);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useUpdateVehicle() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vehicle: VehicleInput) => {
      if (!actor) throw new Error("Backend não está pronto");
      return actor.updateVehicle(vehicle);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

// ---- Rides ----

export function useEstimateFare() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (input: {
      originLat: number;
      originLng: number;
      destinationText: string;
    }) => {
      if (!actor) throw new Error("Backend não está pronto");
      return actor.estimateFare(
        input.originLat,
        input.originLng,
        input.destinationText,
      );
    },
  });
}

export function useRequestRide() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      originLat: number;
      originLng: number;
      destinationText: string;
      paymentMethod: PaymentMethod;
    }) => {
      if (!actor) throw new Error("Backend não está pronto");
      return actor.requestRide(
        input.originLat,
        input.originLng,
        input.destinationText,
        input.paymentMethod,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myRides"] });
      void queryClient.invalidateQueries({ queryKey: ["availableRides"] });
    },
  });
}

export function useGetRide(rideId: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["ride", rideId?.toString()],
    queryFn: async () => {
      if (!actor || rideId === null) return null;
      return actor.getRide(rideId);
    },
    enabled: !!actor && !isFetching && rideId !== null,
  });
}

export function useListMyRides() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["myRides"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMyRides();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListAvailableRides() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["availableRides"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAvailableRides();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAcceptRide() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rideId: bigint) => {
      if (!actor) throw new Error("Backend não está pronto");
      return actor.acceptRide(rideId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["availableRides"] });
      void queryClient.invalidateQueries({ queryKey: ["myRides"] });
    },
  });
}

export function useDeclineRide() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rideId: bigint) => {
      if (!actor) throw new Error("Backend não está pronto");
      return actor.declineRide(rideId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["availableRides"] });
    },
  });
}

export function useStartRide() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rideId: bigint) => {
      if (!actor) throw new Error("Backend não está pronto");
      return actor.startRide(rideId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myRides"] });
      void queryClient.invalidateQueries({ queryKey: ["availableRides"] });
    },
  });
}

export function useCompleteRide() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rideId: bigint) => {
      if (!actor) throw new Error("Backend não está pronto");
      return actor.completeRide(rideId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myRides"] });
      void queryClient.invalidateQueries({ queryKey: ["availableRides"] });
      void queryClient.invalidateQueries({ queryKey: ["adminOverview"] });
      void queryClient.invalidateQueries({ queryKey: ["feeBalance"] });
      void queryClient.invalidateQueries({ queryKey: ["feeStatement"] });
    },
  });
}

// ---- Admin ----

export function useGetAdminOverview() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["adminOverview"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAdminOverview();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListDrivers() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listDrivers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListPendingVehicles() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["pendingVehicles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPendingVehicles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useApproveVehicle() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (driverId: UserId) => {
      if (!actor) throw new Error("Backend não está pronto");
      return actor.approveVehicle(driverId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pendingVehicles"] });
      void queryClient.invalidateQueries({ queryKey: ["drivers"] });
      void queryClient.invalidateQueries({ queryKey: ["adminOverview"] });
    },
  });
}

export function useRejectVehicle() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (driverId: UserId) => {
      if (!actor) throw new Error("Backend não está pronto");
      return actor.rejectVehicle(driverId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pendingVehicles"] });
      void queryClient.invalidateQueries({ queryKey: ["drivers"] });
      void queryClient.invalidateQueries({ queryKey: ["adminOverview"] });
    },
  });
}

export function useGetFeeBalance() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["feeBalance"],
    queryFn: async () => {
      if (!actor) return 0;
      return actor.getFeeBalance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetFeeStatement() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["feeStatement"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFeeStatement();
    },
    enabled: !!actor && !isFetching,
  });
}
