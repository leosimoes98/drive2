import Common "./common";
import ProfileTypes "./profile";

module {
  public type PaymentMethod = { #card; #cash };
  public type RideStatus = { #waiting; #accepted; #in_progress; #completed };
  public type FareEstimate = {
    distanceKm : Float;
    baseFare : Float;
    perKmRate : Float;
    total : Float;
  };
  public type Ride = {
    id : Nat;
    customerId : Common.UserId;
    driverId : ?Common.UserId;
    origin : Common.LatLng;
    destinationText : Text;
    paymentMethod : PaymentMethod;
    fare : FareEstimate;
    status : RideStatus;
    createdAt : Common.Timestamp;
    acceptedAt : ?Common.Timestamp;
    startedAt : ?Common.Timestamp;
    completedAt : ?Common.Timestamp;
    adminFee : Float;
    declinedBy : [Common.UserId];
  };
  public type RideView = {
    id : Nat;
    status : RideStatus;
    origin : Common.LatLng;
    destinationText : Text;
    paymentMethod : PaymentMethod;
    fare : FareEstimate;
    adminFee : Float;
    customerId : Common.UserId;
    customerName : Text;
    driverId : ?Common.UserId;
    driverName : ?Text;
    driverVehicle : ?ProfileTypes.Vehicle;
    createdAt : Common.Timestamp;
    acceptedAt : ?Common.Timestamp;
    startedAt : ?Common.Timestamp;
    completedAt : ?Common.Timestamp;
  };
  public type RideError = {
    #notFound;
    #profileRequired;
    #notCustomer;
    #notDriver;
    #driverNotApproved;
    #notAvailable;
    #wrongStatus;
    #unauthorized;
  };
};