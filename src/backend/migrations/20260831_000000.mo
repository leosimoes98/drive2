import List "mo:core/List";
import Map "mo:core/Map";

module {
  type UserRole = { #admin; #user; #guest };
  type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  type ProfileRole = { #customer; #driver };
  type VehicleStatus = { #pending; #approved; #rejected };
  type Vehicle = {
    brand : Text;
    model : Text;
    plate : Text;
    color : Text;
    year : Nat;
    status : VehicleStatus;
  };
  type UserProfile = {
    id : Principal;
    role : ProfileRole;
    name : Text;
    vehicle : ?Vehicle;
    createdAt : Int;
  };

  type PaymentMethod = { #card; #cash };
  type RideStatus = { #waiting; #accepted; #in_progress; #completed };
  type FareEstimate = {
    distanceKm : Float;
    baseFare : Float;
    perKmRate : Float;
    total : Float;
  };
  type LatLng = { lat : Float; lng : Float };
  type Ride = {
    id : Nat;
    customerId : Principal;
    driverId : ?Principal;
    origin : LatLng;
    destinationText : Text;
    paymentMethod : PaymentMethod;
    fare : FareEstimate;
    status : RideStatus;
    createdAt : Int;
    acceptedAt : ?Int;
    startedAt : ?Int;
    completedAt : ?Int;
    adminFee : Float;
    declinedBy : [Principal];
  };

  type FeeStatementEntry = {
    rideId : Nat;
    customerId : Principal;
    driverId : Principal;
    fare : Float;
    fee : Float;
    completedAt : Int;
  };
  type FeeState = {
    var balance : Float;
    entries : List.List<FeeStatementEntry>;
  };

  type OldActor = {};
  type NewActor = {
    accessControlState : AccessControlState;
    profiles : Map.Map<Principal, UserProfile>;
    rides : Map.Map<Nat, Ride>;
    nextRideId : { var next : Nat };
    feeState : FeeState;
  };

  public func migration(_old : OldActor) : NewActor {
    {
      accessControlState = {
        var adminAssigned = false;
        userRoles = Map.empty();
      };
      profiles = Map.empty();
      rides = Map.empty();
      nextRideId = { var next = 0 };
      feeState = {
        var balance = 0.0;
        entries = List.empty();
      };
    };
  };
};