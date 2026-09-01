import List "mo:core/List";
import Map "mo:core/Map";
import Result "mo:core/Result";
import Common "../types/common";
import ProfileTypes "../types/profile";
import RideTypes "../types/ride";
import Types "../types/admin";

module {
  public func listDrivers(profiles : Map.Map<Common.UserId, ProfileTypes.UserProfile>) : [ProfileTypes.UserProfile] {
    let drivers = List.empty<ProfileTypes.UserProfile>();
    for ((_, profile) in profiles.entries()) {
      if (profile.role == #driver) {
        drivers.add(profile);
      };
    };
    drivers.toArray()
  };

  public func listPendingVehicles(profiles : Map.Map<Common.UserId, ProfileTypes.UserProfile>) : [ProfileTypes.UserProfile] {
    let pending = List.empty<ProfileTypes.UserProfile>();
    for ((_, profile) in profiles.entries()) {
      switch (profile.vehicle) {
        case (?vehicle) {
          if (profile.role == #driver and vehicle.status == #pending) {
            pending.add(profile);
          };
        };
        case null {};
      };
    };
    pending.toArray()
  };

  public func approveVehicle(
    profiles : Map.Map<Common.UserId, ProfileTypes.UserProfile>,
    driverId : Common.UserId,
  ) : Result.Result<(), Types.AdminError> {
    switch (profiles.get(driverId)) {
      case (null) { #err(#notFound) };
      case (?profile) {
        switch (profile.vehicle) {
          case (null) { #err(#notPending) };
          case (?vehicle) {
            if (vehicle.status != #pending) {
              #err(#notPending)
            } else {
              let approved : ProfileTypes.Vehicle = { vehicle with status = #approved };
              profiles.add(driverId, { profile with vehicle = ?approved });
              #ok(())
            };
          };
        };
      };
    };
  };

  public func rejectVehicle(
    profiles : Map.Map<Common.UserId, ProfileTypes.UserProfile>,
    driverId : Common.UserId,
  ) : Result.Result<(), Types.AdminError> {
    switch (profiles.get(driverId)) {
      case (null) { #err(#notFound) };
      case (?profile) {
        switch (profile.vehicle) {
          case (null) { #err(#notPending) };
          case (?vehicle) {
            if (vehicle.status != #pending) {
              #err(#notPending)
            } else {
              let rejected : ProfileTypes.Vehicle = { vehicle with status = #rejected };
              profiles.add(driverId, { profile with vehicle = ?rejected });
              #ok(())
            };
          };
        };
      };
    };
  };

  public func countCompletedRides(rides : Map.Map<Nat, RideTypes.Ride>, driverId : Common.UserId) : Nat {
    var count = 0;
    for ((_, ride) in rides.entries()) {
      if (ride.driverId == ?driverId and ride.status == #completed) {
        count += 1;
      };
    };
    count
  };

  public func getOverview(
    profiles : Map.Map<Common.UserId, ProfileTypes.UserProfile>,
    rides : Map.Map<Nat, RideTypes.Ride>,
    feeState : Types.FeeState,
  ) : Types.AdminOverview {
    var totalDrivers = 0;
    var pendingVehicles = 0;
    for ((_, profile) in profiles.entries()) {
      if (profile.role == #driver) {
        totalDrivers += 1;
        switch (profile.vehicle) {
          case (?vehicle) {
            if (vehicle.status == #pending) {
              pendingVehicles += 1;
            };
          };
          case null {};
        };
      };
    };
    var completedRides = 0;
    for ((_, ride) in rides.entries()) {
      if (ride.status == #completed) {
        completedRides += 1;
      };
    };
    {
      totalDrivers;
      pendingVehicles;
      completedRides;
      feeBalance = feeState.balance;
    }
  };

  public func getFeeBalance(feeState : Types.FeeState) : Float {
    feeState.balance
  };

  public func getFeeStatement(feeState : Types.FeeState) : [Types.FeeStatementEntry] {
    feeState.entries.toArray()
  };
};