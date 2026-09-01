import Map "mo:core/Map";
import Result "mo:core/Result";
import Time "mo:core/Time";
import Common "../types/common";
import Types "../types/profile";

module {
  public func createProfile(
    profiles : Map.Map<Common.UserId, Types.UserProfile>,
    caller : Common.UserId,
    role : Types.ProfileRole,
    name : Text,
    vehicle : ?Types.VehicleInput,
  ) : Result.Result<Types.UserProfile, Types.ProfileError> {
    if (profiles.get(caller) != null) {
      return #err(#alreadyExists);
    };
    let vehicleRecord : ?Types.Vehicle = switch (role) {
      case (#driver) {
        switch (vehicle) {
          case (?v) {
            ?{
              brand = v.brand;
              model = v.model;
              plate = v.plate;
              color = v.color;
              year = v.year;
              status = #pending;
            };
          };
          case null { return #err(#vehicleRequired); };
        };
      };
      case (#customer) { null };
    };
    let profile : Types.UserProfile = {
      id = caller;
      role;
      name;
      vehicle = vehicleRecord;
      createdAt = Time.now();
    };
    profiles.add(caller, profile);
    #ok(profile);
  };

  public func getProfile(
    profiles : Map.Map<Common.UserId, Types.UserProfile>,
    userId : Common.UserId,
  ) : ?Types.UserProfile {
    profiles.get(userId);
  };

  public func updateName(
    profiles : Map.Map<Common.UserId, Types.UserProfile>,
    caller : Common.UserId,
    name : Text,
  ) : Result.Result<Types.UserProfile, Types.ProfileError> {
    switch (profiles.get(caller)) {
      case (?profile) {
        let updated : Types.UserProfile = { profile with name };
        profiles.add(caller, updated);
        #ok(updated);
      };
      case null { #err(#notFound) };
    };
  };

  public func updateVehicle(
    profiles : Map.Map<Common.UserId, Types.UserProfile>,
    caller : Common.UserId,
    vehicle : Types.VehicleInput,
  ) : Result.Result<Types.UserProfile, Types.ProfileError> {
    switch (profiles.get(caller)) {
      case (?profile) {
        switch (profile.role) {
          case (#driver) {
            let updated : Types.UserProfile = {
              profile with
              vehicle = ?{
                brand = vehicle.brand;
                model = vehicle.model;
                plate = vehicle.plate;
                color = vehicle.color;
                year = vehicle.year;
                status = #pending;
              };
            };
            profiles.add(caller, updated);
            #ok(updated);
          };
          case (#customer) { #err(#notDriver) };
        };
      };
      case null { #err(#notFound) };
    };
  };

  public func isApprovedDriver(profile : Types.UserProfile) : Bool {
    switch (profile.role) {
      case (#driver) {
        switch (profile.vehicle) {
          case (?v) { v.status == #approved };
          case null { false };
        };
      };
      case (#customer) { false };
    };
  };
};