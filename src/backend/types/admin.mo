import List "mo:core/List";
import Common "./common";
import ProfileTypes "./profile";

module {
  public type FeeStatementEntry = {
    rideId : Nat;
    customerId : Common.UserId;
    driverId : Common.UserId;
    fare : Float;
    fee : Float;
    completedAt : Common.Timestamp;
  };
  public type FeeState = {
    var balance : Float;
    entries : List.List<FeeStatementEntry>;
  };
  public type AdminOverview = {
    totalDrivers : Nat;
    pendingVehicles : Nat;
    completedRides : Nat;
    feeBalance : Float;
  };
  public type DriverView = {
    id : Common.UserId;
    name : Text;
    vehicle : ProfileTypes.Vehicle;
    completedRides : Nat;
    createdAt : Common.Timestamp;
  };
  public type AdminError = {
    #notFound;
    #notPending;
    #unauthorized;
  };
};