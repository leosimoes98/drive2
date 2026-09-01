import Map "mo:core/Map";
import Result "mo:core/Result";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import ProfileTypes "../types/profile";
import RideTypes "../types/ride";
import Types "../types/admin";
import AdminLib "../lib/admin";

mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles : Map.Map<Common.UserId, ProfileTypes.UserProfile>,
  rides : Map.Map<Nat, RideTypes.Ride>,
  feeState : Types.FeeState,
) {
  public query ({ caller }) func getAdminOverview() : async Types.AdminOverview {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    AdminLib.getOverview(profiles, rides, feeState)
  };

  public query ({ caller }) func listDrivers() : async [Types.DriverView] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    AdminLib.listDrivers(profiles).map(func profile = {
      id = profile.id;
      name = profile.name;
      vehicle = profile.vehicle ?? Runtime.trap("Driver has no vehicle");
      completedRides = AdminLib.countCompletedRides(rides, profile.id);
      createdAt = profile.createdAt;
    })
  };

  public query ({ caller }) func listPendingVehicles() : async [Types.DriverView] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    AdminLib.listPendingVehicles(profiles).map(func profile = {
      id = profile.id;
      name = profile.name;
      vehicle = profile.vehicle ?? Runtime.trap("Driver has no vehicle");
      completedRides = AdminLib.countCompletedRides(rides, profile.id);
      createdAt = profile.createdAt;
    })
  };

  public shared ({ caller }) func approveVehicle(driverId : Common.UserId) : async Result.Result<(), Types.AdminError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    AdminLib.approveVehicle(profiles, driverId)
  };

  public shared ({ caller }) func rejectVehicle(driverId : Common.UserId) : async Result.Result<(), Types.AdminError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    AdminLib.rejectVehicle(profiles, driverId)
  };

  public query ({ caller }) func getFeeBalance() : async Float {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    AdminLib.getFeeBalance(feeState)
  };

  public query ({ caller }) func getFeeStatement() : async [Types.FeeStatementEntry] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    AdminLib.getFeeStatement(feeState)
  };
};