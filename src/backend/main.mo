import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import ListEntity "mo:caffeineai-oql/ListEntity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import IntValue "mo:caffeineai-oql/IntValue";
import FloatValue "mo:caffeineai-oql/FloatValue";
import Common "types/common";
import ProfileTypes "types/profile";
import RideTypes "types/ride";
import AdminTypes "types/admin";
import ProfileApi "mixins/profile-api";
import RideApi "mixins/ride-api";
import AdminApi "mixins/admin-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let profiles : Map.Map<Common.UserId, ProfileTypes.UserProfile>;
  let rides : Map.Map<Nat, RideTypes.Ride>;
  let nextRideId : { var next : Nat };
  let feeState : AdminTypes.FeeState;

  include MixinAuthorization(accessControlState, null);
  include ProfileApi(accessControlState, profiles);
  include RideApi(accessControlState, profiles, rides, nextRideId, feeState);
  include AdminApi(accessControlState, profiles, rides, feeState);

  // Sample principal used only to seed OQL schema discovery (values are ignored).
  transient let samplePrincipal = Principal.fromText("aaaaa-aa");

  include Expose({
    entities = [
      profiles.toEntityManual("profile", "UserProfile", "id")
        .sample({ id = samplePrincipal; role = #customer; name = ""; vehicle = null; createdAt = 0 })
        .payload("id", func p = p.id)
        .payload("role", func p = switch (p.role) { case (#customer) "customer"; case (#driver) "driver" })
        .payload("name", func p = p.name)
        .payload("vehicleStatus", func p = switch (p.vehicle) { case (null) "none"; case (?v) switch (v.status) { case (#pending) "pending"; case (#approved) "approved"; case (#rejected) "rejected" } })
        .payload("vehiclePlate", func p = switch (p.vehicle) { case (null) ""; case (?v) v.plate })
        .payload("createdAt", func p = p.createdAt)
        .ownedBy("id")
        .controllerOrScoped()
        .build(),
      rides.toEntityManual("ride", "Ride", "id")
        .sample({ id = 0; customerId = samplePrincipal; driverId = null; origin = { lat = 0.0; lng = 0.0 }; destinationText = ""; paymentMethod = #card; fare = { distanceKm = 0.0; baseFare = 0.0; perKmRate = 0.0; total = 0.0 }; status = #waiting; createdAt = 0; acceptedAt = null; startedAt = null; completedAt = null; adminFee = 0.0; declinedBy = [] })
        .payload("id", func r = r.id)
        .payload("customerId", func r = r.customerId)
        .payload("driverId", func r = switch (r.driverId) { case (null) ""; case (?d) d.toText() })
        .payload("originLat", func r = r.origin.lat)
        .payload("originLng", func r = r.origin.lng)
        .payload("destinationText", func r = r.destinationText)
        .payload("paymentMethod", func r = switch (r.paymentMethod) { case (#card) "card"; case (#cash) "cash" })
        .payload("distanceKm", func r = r.fare.distanceKm)
        .payload("fareTotal", func r = r.fare.total)
        .payload("status", func r = switch (r.status) { case (#waiting) "waiting"; case (#accepted) "accepted"; case (#in_progress) "in_progress"; case (#completed) "completed" })
        .payload("createdAt", func r = r.createdAt)
        .payload("acceptedAt", func r = switch (r.acceptedAt) { case (null) 0; case (?t) t })
        .payload("startedAt", func r = switch (r.startedAt) { case (null) 0; case (?t) t })
        .payload("completedAt", func r = switch (r.completedAt) { case (null) 0; case (?t) t })
        .payload("adminFee", func r = r.adminFee)
        .controllerOnly()
        .build(),
      feeState.entries.toEntity("feeStatement", "FeeStatementEntry", "rideId")
        .sample({ rideId = 0; customerId = samplePrincipal; driverId = samplePrincipal; fare = 0.0; fee = 0.0; completedAt = 0 })
        .controllerOnly()
        .build(),
    ];
  });

  include ApiDocMixin();
};
