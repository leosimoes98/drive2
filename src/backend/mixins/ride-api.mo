import Map "mo:core/Map";
import Result "mo:core/Result";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Common "../types/common";
import ProfileTypes "../types/profile";
import AdminTypes "../types/admin";
import Types "../types/ride";
import RideLib "../lib/ride";

mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles : Map.Map<Common.UserId, ProfileTypes.UserProfile>,
  rides : Map.Map<Nat, Types.Ride>,
  nextRideId : { var next : Nat },
  feeState : AdminTypes.FeeState,
) {
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  func toView(ride : Types.Ride) : Types.RideView {
    let customer = profiles.get(ride.customerId);
    let driver = switch (ride.driverId) {
      case (?d) { profiles.get(d) };
      case null { null };
    };
    {
      id = ride.id;
      status = ride.status;
      origin = ride.origin;
      destinationText = ride.destinationText;
      paymentMethod = ride.paymentMethod;
      fare = ride.fare;
      adminFee = ride.adminFee;
      customerId = ride.customerId;
      customerName = switch (customer) {
        case (?c) { c.name };
        case null { "" };
      };
      driverId = ride.driverId;
      driverName = switch (driver) {
        case (?d) { ?d.name };
        case null { null };
      };
      driverVehicle = switch (driver) {
        case (?d) { d.vehicle };
        case null { null };
      };
      createdAt = ride.createdAt;
      acceptedAt = ride.acceptedAt;
      startedAt = ride.startedAt;
      completedAt = ride.completedAt;
    };
  };

  public shared ({ caller }) func estimateFare(originLat : Float, originLng : Float, destinationText : Text) : async Types.FareEstimate {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only signed-in users can estimate fares");
    };
    await RideLib.estimateFare({ lat = originLat; lng = originLng }, destinationText, transform);
  };

  public shared ({ caller }) func requestRide(
    originLat : Float,
    originLng : Float,
    destinationText : Text,
    paymentMethod : Types.PaymentMethod,
  ) : async Result.Result<Types.RideView, Types.RideError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only signed-in users can request a ride");
    };
    switch (profiles.get(caller)) {
      case (null) { #err(#profileRequired) };
      case (?profile) {
        if (profile.role != #customer) {
          #err(#notCustomer);
        } else {
          let origin = { lat = originLat; lng = originLng };
          let fare = await RideLib.estimateFare(origin, destinationText, transform);
          switch (RideLib.requestRide(rides, nextRideId, profile, origin, destinationText, paymentMethod, fare)) {
            case (#err e) { #err(e) };
            case (#ok ride) { #ok(toView(ride)) };
          };
        };
      };
    };
  };

  public query ({ caller }) func getRide(rideId : Nat) : async ?Types.RideView {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only signed-in users can view rides");
    };
    switch (rides.get(rideId)) {
      case (null) { null };
      case (?ride) {
        let isCustomer = ride.customerId == caller;
        let isDriver = switch (ride.driverId) {
          case (?d) { d == caller };
          case null { false };
        };
        if (isCustomer or isDriver or AccessControl.hasPermission(accessControlState, caller, #admin)) {
          ?toView(ride);
        } else {
          null;
        };
      };
    };
  };

  public query ({ caller }) func listMyRides() : async [Types.RideView] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only signed-in users can view their rides");
    };
    switch (profiles.get(caller)) {
      case (null) { [] };
      case (?profile) {
        switch (profile.role) {
          case (#customer) { RideLib.listRidesByCustomer(rides, caller).map(toView) };
          case (#driver) { RideLib.listRidesByDriver(rides, caller).map(toView) };
        };
      };
    };
  };

  public query ({ caller }) func listAvailableRides() : async [Types.RideView] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only signed-in users can view available rides");
    };
    switch (profiles.get(caller)) {
      case (null) { [] };
      case (?profile) {
        if (profile.role != #driver) {
          [];
        } else {
          switch (profile.vehicle) {
            case (null) { [] };
            case (?vehicle) {
              if (vehicle.status != #approved) {
                [];
              } else {
                RideLib.listAvailableRides(rides, caller).map(toView);
              };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func acceptRide(rideId : Nat) : async Result.Result<Types.RideView, Types.RideError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only signed-in users can accept rides");
    };
    switch (profiles.get(caller)) {
      case (null) { #err(#profileRequired) };
      case (?profile) {
        if (profile.role != #driver) {
          #err(#notDriver);
        } else {
          switch (profile.vehicle) {
            case (null) { #err(#driverNotApproved) };
            case (?vehicle) {
              if (vehicle.status != #approved) {
                #err(#driverNotApproved);
              } else {
                switch (RideLib.acceptRide(rides, rideId, profile)) {
                  case (#err e) { #err(e) };
                  case (#ok ride) { #ok(toView(ride)) };
                };
              };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func declineRide(rideId : Nat) : async Result.Result<(), Types.RideError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only signed-in users can decline rides");
    };
    switch (profiles.get(caller)) {
      case (null) { #err(#profileRequired) };
      case (?profile) {
        if (profile.role != #driver) {
          #err(#notDriver);
        } else {
          RideLib.declineRide(rides, rideId, caller);
        };
      };
    };
  };

  public shared ({ caller }) func startRide(rideId : Nat) : async Result.Result<Types.RideView, Types.RideError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only signed-in users can start rides");
    };
    switch (profiles.get(caller)) {
      case (null) { #err(#profileRequired) };
      case (?profile) {
        if (profile.role != #driver) {
          #err(#notDriver);
        } else {
          switch (RideLib.startRide(rides, rideId, caller)) {
            case (#err e) { #err(e) };
            case (#ok ride) { #ok(toView(ride)) };
          };
        };
      };
    };
  };

  public shared ({ caller }) func completeRide(rideId : Nat) : async Result.Result<Types.RideView, Types.RideError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only signed-in users can complete rides");
    };
    switch (profiles.get(caller)) {
      case (null) { #err(#profileRequired) };
      case (?profile) {
        if (profile.role != #driver) {
          #err(#notDriver);
        } else {
          switch (RideLib.completeRide(rides, feeState, rideId, caller)) {
            case (#err e) { #err(e) };
            case (#ok ride) { #ok(toView(ride)) };
          };
        };
      };
    };
  };
};