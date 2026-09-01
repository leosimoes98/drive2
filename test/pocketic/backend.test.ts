import { PocketIc, createIdentity } from "@dfinity/pic";
import type { DeferredActor } from "@dfinity/pic";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

// The first caller to `_initialize_access_control` becomes #admin; every
// subsequent caller becomes #user. The installing principal is the owner.
// `createIdentity` is re-exported by @dfinity/pic and yields a deterministic
// principal per seed, so no direct @icp-sdk/core import is needed here.
const ADMIN = createIdentity("drive2-admin").getPrincipal();
const CUSTOMER = createIdentity("drive2-customer").getPrincipal();
const DRIVER = createIdentity("drive2-driver").getPrincipal();

let pic: PocketIc | undefined;
let actor: _SERVICE;
let deferredActor: DeferredActor<_SERVICE>;

const vehicleInput = {
  brand: "Toyota",
  model: "Corolla",
  color: "Prata",
  year: 2020n,
  plate: "ABC-1234",
};

// `requestRide` (and `estimateFare`) geocode the destination via an HTTP
// outcall to geocoding-api.open-meteo.com. In PocketIC that outcall never
// resolves on its own, so a normal actor call would hang and time out after
// 100 rounds. This helper uses the deferred actor: it submits the call without
// awaiting it, lets the replica queue the HTTPS outcall, mocks it with a valid
// geocoding response, and only then awaits the submitted call's result.
async function requestRideMocked(
  originLat: number,
  originLng: number,
  destinationText: string,
  paymentMethod: { card: null } | { cash: null },
) {
  deferredActor.setPrincipal(CUSTOMER);
  const execute = await deferredActor.requestRide(originLat, originLng, destinationText, paymentMethod);
  // Let the replica process the submitted message and queue the HTTPS outcall.
  await pic!.tick(2);
  for (let i = 0; i < 200; i++) {
    const outcalls = await pic!.getPendingHttpsOutcalls();
    if (outcalls.length > 0) {
      const outcall = outcalls[0];
      const body = new TextEncoder().encode(
        JSON.stringify({ results: [{ latitude: -23.55, longitude: -46.63 }] }),
      );
      await pic!.mockPendingHttpsOutcall({
        requestId: outcall.requestId,
        subnetId: outcall.subnetId,
        response: { type: "success", statusCode: 200, headers: [], body },
      });
      break;
    }
    await pic!.tick();
  }
  return execute();
}

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  const installed = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
    sender: ADMIN,
  });
  actor = installed.actor;
  deferredActor = pic.createDeferredActor(idlFactory, installed.canisterId);

  // Register the owner as #admin (first initializer).
  actor.setPrincipal(ADMIN);
  await actor._initialize_access_control();
});

afterAll(async () => {
  await pic?.tearDown();
});

describe("Drive2 backend public API", () => {
  it("registers the first initializer as admin and answers empty-state reads", async () => {
    actor.setPrincipal(ADMIN);
    expect(await actor.isCallerAdmin()).toBe(true);
    expect(await actor.getCallerUserRole()).toEqual({ admin: null });
    // Empty state before any profile or ride exists.
    expect(await actor.getAdminOverview()).toEqual({
      totalDrivers: 0n,
      pendingVehicles: 0n,
      completedRides: 0n,
      feeBalance: 0,
    });
    expect(await actor.getFeeBalance()).toBe(0);
    expect(await actor.getFeeStatement()).toEqual([]);
    expect(await actor.listDrivers()).toEqual([]);
    expect(await actor.listPendingVehicles()).toEqual([]);
  });

  it("creates a customer profile and a driver profile with a pending vehicle", async () => {
    // Customer registers as #user and creates a profile without a vehicle.
    actor.setPrincipal(CUSTOMER);
    await actor._initialize_access_control();
    const customerResult = await actor.createProfile({ customer: null }, "Ana Souza", []);
    expect(customerResult).toMatchObject({ ok: { name: "Ana Souza", role: { customer: null } } });

    // Driver registers as #user and creates a profile with a vehicle (pending).
    actor.setPrincipal(DRIVER);
    await actor._initialize_access_control();
    const driverResult = await actor.createProfile({ driver: null }, "Carlos Lima", [vehicleInput]);
    expect(driverResult).toMatchObject({
      ok: {
        name: "Carlos Lima",
        role: { driver: null },
        vehicle: [{ status: { pending: null }, plate: "ABC-1234" }],
      },
    });

    // The driver's vehicle shows up as pending for the admin.
    actor.setPrincipal(ADMIN);
    const pending = await actor.listPendingVehicles();
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({ name: "Carlos Lima" });
  });

  it("lets the admin approve the vehicle, then the driver sees available rides", async () => {
    actor.setPrincipal(ADMIN);
    const approve = await actor.approveVehicle(DRIVER);
    expect(approve).toEqual({ ok: null });

    // A customer requests a ride (waiting).
    actor.setPrincipal(CUSTOMER);
    const request = await requestRideMocked(-23.55, -46.63, "Av. Paulista", { card: null });
    expect(request.ok).toBeDefined();
    const rideId = request.ok!.id;

    // The approved driver now sees the waiting ride.
    actor.setPrincipal(DRIVER);
    const available = await actor.listAvailableRides();
    expect(available.map((r) => r.id)).toContain(rideId);
  });

  it("drives a ride through accept, start and complete, recording the 5% fee", async () => {
    // Customer requests a fresh ride.
    actor.setPrincipal(CUSTOMER);
    const request = await requestRideMocked(-23.55, -46.63, "Shopping", { cash: null });
    expect(request.ok).toBeDefined();
    const rideId = request.ok!.id;

    // Driver accepts, starts and completes it.
    actor.setPrincipal(DRIVER);
    const accept = await actor.acceptRide(rideId);
    expect(accept.ok).toBeDefined();
    expect(accept.ok!.status).toEqual({ accepted: null });

    const start = await actor.startRide(rideId);
    expect(start.ok).toBeDefined();
    expect(start.ok!.status).toEqual({ in_progress: null });

    const complete = await actor.completeRide(rideId);
    expect(complete.ok).toBeDefined();
    expect(complete.ok!.status).toEqual({ completed: null });

    // The 5% fee is recorded: adminFee = fare.total * 0.05.
    const adminFee = complete.ok!.adminFee;
    expect(adminFee).toBeCloseTo(complete.ok!.fare.total * 0.05, 5);

    // Admin sees the fee balance and a statement entry for this ride.
    actor.setPrincipal(ADMIN);
    expect(await actor.getFeeBalance()).toBeCloseTo(adminFee, 5);
    const statement = await actor.getFeeStatement();
    expect(statement).toHaveLength(1);
    expect(statement[0]).toMatchObject({ rideId, driverId: DRIVER, fee: adminFee });

    const overview = await actor.getAdminOverview();
    expect(overview.completedRides).toBe(1n);
    expect(overview.feeBalance).toBeCloseTo(adminFee, 5);
  });

  it("does not let an unapproved driver accept a ride", async () => {
    // A second driver registers but is never approved.
    const unapproved = createIdentity("drive2-unapproved").getPrincipal();
    actor.setPrincipal(unapproved);
    await actor._initialize_access_control();
    await actor.createProfile({ driver: null }, "Pedro", [
      { brand: "Honda", model: "Civic", color: "Preto", year: 2019n, plate: "XYZ-9999" },
    ]);

    actor.setPrincipal(CUSTOMER);
    const request = await requestRideMocked(-23.55, -46.63, "Parque", { card: null });
    const rideId = request.ok!.id;

    actor.setPrincipal(unapproved);
    const accept = await actor.acceptRide(rideId);
    expect(accept).toEqual({ err: { driverNotApproved: null } });
    // The unapproved driver sees no available rides.
    expect(await actor.listAvailableRides()).toEqual([]);
  });
});
