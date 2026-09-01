import Common "./common";

module {
  public type ProfileRole = { #customer; #driver };
  public type VehicleStatus = { #pending; #approved; #rejected };
  public type VehicleInput = {
    brand : Text;
    model : Text;
    plate : Text;
    color : Text;
    year : Nat;
  };
  public type Vehicle = {
    brand : Text;
    model : Text;
    plate : Text;
    color : Text;
    year : Nat;
    status : VehicleStatus;
  };
  public type UserProfile = {
    id : Common.UserId;
    role : ProfileRole;
    name : Text;
    vehicle : ?Vehicle;
    createdAt : Common.Timestamp;
  };
  public type ProfileError = {
    #alreadyExists;
    #notFound;
    #vehicleRequired;
    #notDriver;
    #unauthorized;
  };
};