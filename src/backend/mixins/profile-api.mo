import Map "mo:core/Map";
import Result "mo:core/Result";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Types "../types/profile";
import ProfileLib "../lib/profile";

mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles : Map.Map<Common.UserId, Types.UserProfile>,
) {
  public shared ({ caller }) func createProfile(
    role : Types.ProfileRole,
    name : Text,
    vehicle : ?Types.VehicleInput,
  ) : async Result.Result<Types.UserProfile, Types.ProfileError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only signed-in users can create a profile");
    };
    ProfileLib.createProfile(profiles, caller, role, name, vehicle);
  };

  public query ({ caller }) func getCallerProfile() : async ?Types.UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only signed-in users can view their profile");
    };
    ProfileLib.getProfile(profiles, caller);
  };

  public query ({ caller }) func getProfile(userId : Common.UserId) : async ?Types.UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only signed-in users can view profiles");
    };
    ProfileLib.getProfile(profiles, userId);
  };

  public shared ({ caller }) func updateProfile(name : Text) : async Result.Result<Types.UserProfile, Types.ProfileError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only signed-in users can update their profile");
    };
    ProfileLib.updateName(profiles, caller, name);
  };

  public shared ({ caller }) func updateVehicle(vehicle : Types.VehicleInput) : async Result.Result<Types.UserProfile, Types.ProfileError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only signed-in users can update their vehicle");
    };
    ProfileLib.updateVehicle(profiles, caller, vehicle);
  };
};