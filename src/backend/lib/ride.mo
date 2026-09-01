import Map "mo:core/Map";
import Result "mo:core/Result";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Float "mo:core/Float";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Json "mo:json/lib";
import Common "../types/common";
import ProfileTypes "../types/profile";
import AdminTypes "../types/admin";
import Types "../types/ride";

module {
  let baseFare = 5.0;
  let perKmRate = 2.5;
  let defaultDistanceKm = 5.0;

  func urlEncode(text : Text) : Text {
    let hex = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];
    var out = "";
    for (b in text.encodeUtf8().toArray().values()) {
      let n = b.toNat();
      out := out # "%" # hex[n / 16] # hex[n % 16];
    };
    out;
  };

  func geocodeDestination(destinationText : Text, transform : OutCall.Transform) : async ?Common.LatLng {
    let url = "https://geocoding-api.open-meteo.com/v1/search?name=" # urlEncode(destinationText) # "&count=1&language=pt";
    let body = try {
      await OutCall.httpGetRequest(url, [], transform);
    } catch (_) {
      "";
    };
    switch (Json.parse(body)) {
      case (#err _) { null };
      case (#ok json) {
        switch (Json.getAsFloat(json, "results[0].latitude"), Json.getAsFloat(json, "results[0].longitude")) {
          case (#ok lat, #ok lng) { ?{ lat; lng } };
          case _ { null };
        };
      };
    };
  };

  public func estimateFare(origin : Common.LatLng, destinationText : Text, transform : OutCall.Transform) : async Types.FareEstimate {
    let destination = await geocodeDestination(destinationText, transform);
    let distanceKm = switch (destination) {
      case (?dest) { haversineKm(origin, dest) };
      case null { defaultDistanceKm };
    };
    computeFare(distanceKm);
  };

  public func haversineKm(a : Common.LatLng, b : Common.LatLng) : Float {
    let earthRadiusKm = 6371.0;
    let dLat = (b.lat - a.lat) * Float.pi / 180.0;
    let dLng = (b.lng - a.lng) * Float.pi / 180.0;
    let lat1 = a.lat * Float.pi / 180.0;
    let lat2 = b.lat * Float.pi / 180.0;
    let h = Float.sin(dLat / 2.0) * Float.sin(dLat / 2.0) + Float.cos(lat1) * Float.cos(lat2) * Float.sin(dLng / 2.0) * Float.sin(dLng / 2.0);
    2.0 * earthRadiusKm * Float.arctan2(Float.sqrt(h), Float.sqrt(1.0 - h));
  };

  public func computeFare(distanceKm : Float) : Types.FareEstimate {
    {
      distanceKm = distanceKm;
      baseFare = baseFare;
      perKmRate = perKmRate;
      total = baseFare + perKmRate * distanceKm;
    };
  };

  public func requestRide(
    rides : Map.Map<Nat, Types.Ride>,
    nextRideId : { var next : Nat },
    customer : ProfileTypes.UserProfile,
    origin : Common.LatLng,
    destinationText : Text,
    paymentMethod : Types.PaymentMethod,
    fare : Types.FareEstimate,
  ) : Result.Result<Types.Ride, Types.RideError> {
    let id = nextRideId.next;
    nextRideId.next += 1;
    let ride : Types.Ride = {
      id;
      customerId = customer.id;
      driverId = null;
      origin;
      destinationText;
      paymentMethod;
      fare;
      status = #waiting;
      createdAt = Time.now();
      acceptedAt = null;
      startedAt = null;
      completedAt = null;
      adminFee = fare.total * 0.05;
      declinedBy = [];
    };
    rides.add(id, ride);
    #ok(ride);
  };

  public func acceptRide(
    rides : Map.Map<Nat, Types.Ride>,
    rideId : Nat,
    driver : ProfileTypes.UserProfile,
  ) : Result.Result<Types.Ride, Types.RideError> {
    switch (rides.get(rideId)) {
      case (null) { #err(#notFound) };
      case (?ride) {
        if (ride.status != #waiting) {
          #err(#wrongStatus);
        } else {
          let updated : Types.Ride = {
            ride with
            driverId = ?driver.id;
            status = #accepted;
            acceptedAt = ?Time.now();
          };
          rides.add(rideId, updated);
          #ok(updated);
        };
      };
    };
  };

  public func declineRide(
    rides : Map.Map<Nat, Types.Ride>,
    rideId : Nat,
    driverId : Common.UserId,
  ) : Result.Result<(), Types.RideError> {
    switch (rides.get(rideId)) {
      case (null) { #err(#notFound) };
      case (?ride) {
        if (ride.status != #waiting) {
          #err(#wrongStatus);
        } else {
          let updated : Types.Ride = {
            ride with
            declinedBy = ride.declinedBy.concat([driverId]);
          };
          rides.add(rideId, updated);
          #ok(());
        };
      };
    };
  };

  public func startRide(
    rides : Map.Map<Nat, Types.Ride>,
    rideId : Nat,
    driverId : Common.UserId,
  ) : Result.Result<Types.Ride, Types.RideError> {
    switch (rides.get(rideId)) {
      case (null) { #err(#notFound) };
      case (?ride) {
        if (ride.status != #accepted) {
          #err(#wrongStatus);
        } else {
          switch (ride.driverId) {
            case (null) { #err(#wrongStatus) };
            case (?assigned) {
              if (assigned != driverId) {
                #err(#notDriver);
              } else {
                let updated : Types.Ride = {
                  ride with
                  status = #in_progress;
                  startedAt = ?Time.now();
                };
                rides.add(rideId, updated);
                #ok(updated);
              };
            };
          };
        };
      };
    };
  };

  public func completeRide(
    rides : Map.Map<Nat, Types.Ride>,
    feeState : AdminTypes.FeeState,
    rideId : Nat,
    driverId : Common.UserId,
  ) : Result.Result<Types.Ride, Types.RideError> {
    switch (rides.get(rideId)) {
      case (null) { #err(#notFound) };
      case (?ride) {
        if (ride.status != #in_progress) {
          #err(#wrongStatus);
        } else {
          switch (ride.driverId) {
            case (null) { #err(#wrongStatus) };
            case (?assigned) {
              if (assigned != driverId) {
                #err(#notDriver);
              } else {
                let now = Time.now();
                let updated : Types.Ride = {
                  ride with
                  status = #completed;
                  completedAt = ?now;
                };
                rides.add(rideId, updated);
                feeState.balance += ride.adminFee;
                feeState.entries.add({
                  rideId = rideId;
                  customerId = ride.customerId;
                  driverId = driverId;
                  fare = ride.fare.total;
                  fee = ride.adminFee;
                  completedAt = now;
                });
                #ok(updated);
              };
            };
          };
        };
      };
    };
  };

  public func listAvailableRides(rides : Map.Map<Nat, Types.Ride>, callerId : Common.UserId) : [Types.Ride] {
    rides.values()
      .filter(func ride = ride.status == #waiting and not ride.declinedBy.contains(callerId))
      .toArray();
  };

  public func listRidesByCustomer(rides : Map.Map<Nat, Types.Ride>, customerId : Common.UserId) : [Types.Ride] {
    rides.values().filter(func ride = ride.customerId == customerId).toArray();
  };

  public func listRidesByDriver(rides : Map.Map<Nat, Types.Ride>, driverId : Common.UserId) : [Types.Ride] {
    rides.values().filter(func ride = ride.driverId == ?driverId).toArray();
  };
};