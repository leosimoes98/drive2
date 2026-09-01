mixin () {
  public query func getApiDoc() : async Text {
    "# Drive2 Backend API\n" #
    "\n" #
    "## Purpose\n" #
    "\n" #
    "Drive2 is a ride-hailing platform with three roles: **customer**, **driver** and **admin** (the platform owner). " #
    "Customers request rides and pay by card or cash; approved drivers accept and complete rides; the admin approves " #
    "vehicles and tracks the 5% fee on every completed ride. All users sign in with their Google account through the " #
    "platform's Internet Identity SSO.\n" #
    "\n" #
    "## Authentication\n" #
    "\n" #
    "Every domain endpoint requires a signed-in (non-anonymous) caller. There is no password; sign-in is handled by " #
    "the authorization extension:\n" #
    "\n" #
    "- `_internet_identity_sign_in_start() : async Blob` — starts an Internet Identity sign-in and returns a challenge blob.\n" #
    "- `_internet_identity_sign_in_finish() : async Result.Result<(), Verify.Error>` — completes the sign-in and registers the caller.\n" #
    "- `_initialize_access_control() : async ()` — registers the caller for role-based access.\n" #
    "\n" #
    "**Registration prerequisite.** Before any role-guarded call (guarded queries included), a direct API caller must " #
    "register once by calling `_initialize_access_control()` as a signed-in caller (the app's frontend does this " #
    "automatically during sign-in). The **first** caller to initialize becomes `#admin`; every subsequent caller " #
    "becomes `#user`. Anonymous callers are ignored and never registered.\n" #
    "\n" #
    "**Unregistered / anonymous callers.** On any guarded endpoint:\n" #
    "\n" #
    "- an anonymous caller traps with `Unauthorized: Only signed-in users can <action>` (or `Unauthorized: Only " #
    "admins can perform this action` on admin endpoints);\n" #
    "- a signed-in but unregistered caller traps with `User is not registered`.\n" #
    "\n" #
    "A caller can be unregistered even when the app appears to know it: registration happens only when a caller signs " #
    "in through the app's own frontend, so a principal that never did so is unregistered even if it belongs to the " #
    "app's owner, and a signed-in caller derived against a different origin is a different principal than the one the " #
    "frontend registered.\n" #
    "\n" #
    "**Identity derivation.** The app's frontend pins an Internet Identity derivation origin, published at " #
    "`/.well-known/ii-derivation-origin` when available. An agent already holding the user's Internet Identity " #
    "authorization derives the correct per-app principal against that origin, for example " #
    "`icp identity link web <name> --app <host>`. Such a delegation acts with the user's full authority in this app " #
    "until it expires.\n" #
    "\n" #
    "## Authorization\n" #
    "\n" #
    "Roles are `#admin`, `#user` and `#guest` (anonymous). `#admin` can call every endpoint; `#user` can call the " #
    "customer/driver endpoints; `#guest` (anonymous) can call none of the guarded endpoints.\n" #
    "\n" #
    "- **Customer/driver endpoints** (require `#user`): `createProfile`, `getCallerProfile`, `getProfile`, " #
    "`updateProfile`, `updateVehicle`, `estimateFare`, `requestRide`, `getRide`, `listMyRides`, `listAvailableRides`, " #
    "`acceptRide`, `declineRide`, `startRide`, `completeRide`.\n" #
    "- **Admin endpoints** (require `#admin`): `assignCallerUserRole`, `getAdminOverview`, `listDrivers`, " #
    "`listPendingVehicles`, `approveVehicle`, `rejectVehicle`, `getFeeBalance`, `getFeeStatement`.\n" #
    "- `getCallerUserRole` and `isCallerAdmin` are readable by any caller (anonymous resolves to `#guest` / `false`).\n" #
    "- `transform` is the IC HTTP outcall transformation callback required by the fare geocoding outcall; it is " #
    "public protocol plumbing, not an application endpoint.\n" #
    "- `schema` and `execute` (OQL) enforce per-entity authorization: `profile` is `controllerOrScoped` (the agent " #
    "reads all, each user only their own), while `ride` and `feeStatement` are `controllerOnly` (agent only).\n" #
    "\n" #
    "## Units and encodings\n" #
    "\n" #
    "- **Currency:** BRL. Fares are `Float` values in Brazilian Reais. Base fare is 5.0 BRL and the per-km rate is " #
    "2.5 BRL/km.\n" #
    "- **Distance:** kilometres (`Float`). `FareEstimate.total = baseFare + perKmRate * distanceKm`.\n" #
    "- **Timestamps:** `Int` nanoseconds since the Unix epoch (`Time.now()`), e.g. `createdAt`, `acceptedAt`, " #
    "`startedAt`, `completedAt`, and `completedAt` on fee statements.\n" #
    "- **Identifiers:** `UserId` is a `Principal` (canonical text form); ride ids are `Nat` assigned sequentially.\n" #
    "- **Optional values:** `?T` — e.g. `driverId` is `null` until a driver accepts, `vehicle` is `null` for " #
    "customers, and `acceptedAt`/`startedAt`/`completedAt` are `null` until the corresponding transition.\n" #
    "- **Variants:** `ProfileRole { #customer; #driver }`, `VehicleStatus { #pending; #approved; #rejected }`, " #
    "`PaymentMethod { #card; #cash }`, `RideStatus { #waiting; #accepted; #in_progress; #completed }`.\n" #
    "\n" #
    "## Lifecycle\n" #
    "\n" #
    "A ride moves through exactly four statuses:\n" #
    "\n" #
    "`#waiting` → `#accepted` → `#in_progress` → `#completed`\n" #
    "\n" #
    "- `requestRide` creates a ride in `#waiting` (customer).\n" #
    "- `acceptRide` moves it to `#accepted` and sets `driverId` + `acceptedAt` (approved driver).\n" #
    "- `startRide` moves it to `#in_progress` and sets `startedAt` (assigned driver only).\n" #
    "- `completeRide` moves it to `#completed`, sets `completedAt`, and records the 5% admin fee (assigned driver only).\n" #
    "\n" #
    "Each transition is guarded: a ride can only move from the exact preceding status, and only the assigned driver " #
    "(or the customer who created it, for reads) may act on it. `declineRide` keeps the ride in `#waiting` and " #
    "appends the driver to `declinedBy` so that driver no longer sees it in `listAvailableRides`.\n" #
    "\n" #
    "## Polling\n" #
    "\n" #
    "Drivers poll `listAvailableRides()` to discover new requests. It returns rides in `#waiting` that the caller " #
    "has not declined. There is no push notification; poll at a reasonable interval.\n" #
    "\n" #
    "## Mutation retry safety\n" #
    "\n" #
    "- `requestRide` is **not idempotent**: every successful call creates a new ride. Do not retry blindly; a retry " #
    "after success produces a duplicate ride.\n" #
    "- `acceptRide`, `declineRide`, `startRide`, `completeRide` are guarded by status: a retry after success returns " #
    "`#err(#wrongStatus)` and has no effect, so the fee is recorded exactly once.\n" #
    "- `createProfile` returns `#err(#alreadyExists)` on a second call for the same principal.\n" #
    "- `approveVehicle` / `rejectVehicle` return `#err(#notPending)` once the vehicle is no longer pending.\n" #
    "- `updateVehicle` resets the vehicle to `#pending`, requiring re-approval.\n" #
    "\n" #
    "## Errors\n" #
    "\n" #
    "Domain endpoints return `Result` with typed error variants:\n" #
    "\n" #
    "- `ProfileError`: `#alreadyExists`, `#notFound`, `#vehicleRequired`, `#notDriver`, `#unauthorized`.\n" #
    "- `RideError`: `#notFound`, `#profileRequired`, `#notCustomer`, `#notDriver`, `#driverNotApproved`, " #
    "`#notAvailable`, `#wrongStatus`, `#unauthorized`.\n" #
    "- `AdminError`: `#notFound`, `#notPending`, `#unauthorized`.\n" #
    "\n" #
    "Authorization failures trap (the messages are quoted above); do not branch on trap messages — check the role " #
    "first via `getCallerUserRole` / `isCallerAdmin`.\n" #
    "\n" #
    "## Non-obvious gotchas\n" #
    "\n" #
    "- **Fare geocoding fallback:** `estimateFare` and `requestRide` geocode the destination via an HTTP outcall to " #
    "`geocoding-api.open-meteo.com`. If the outcall fails, the destination cannot be parsed, or coordinates are " #
    "missing, the distance falls back to **5 km** and the fare is computed from that.\n" #
    "- **Card payment is recorded in-app only:** choosing `#card` stores the payment method on the ride; no real " #
    "card charge is processed by this backend. Cash is paid to the driver.\n" #
    "- **5% admin fee:** `adminFee = fare.total * 0.05` is computed at request time and stored on the ride; it is " #
    "added to the fee balance and recorded as a `FeeStatementEntry` only when the ride is completed.\n" #
    "- **Vehicle approval gates drivers:** a driver only sees and accepts rides after their vehicle is `#approved`; " #
    "otherwise `listAvailableRides` returns `[]` and `acceptRide` returns `#err(#driverNotApproved)`.\n" #
    "- **`transform`** must be exposed for the fare geocoding outcall to work; it is the IC HTTP transformation callback.\n"
  };
};
