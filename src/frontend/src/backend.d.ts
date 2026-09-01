import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface RideView {
    id: bigint;
    customerName: string;
    status: RideStatus;
    completedAt?: Timestamp;
    driverId?: UserId;
    startedAt?: Timestamp;
    paymentMethod: PaymentMethod;
    driverVehicle?: Vehicle;
    adminFee: number;
    fare: FareEstimate;
    createdAt: Timestamp;
    origin: LatLng;
    destinationText: string;
    customerId: UserId;
    acceptedAt?: Timestamp;
    driverName?: string;
}
export type Timestamp = bigint;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export type Result_2 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: AdminError;
};
export interface HttpRequestResult {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export interface Result__1 {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export interface FeeStatementEntry {
    fee: number;
    completedAt: Timestamp;
    driverId: UserId;
    fare: number;
    rideId: bigint;
    customerId: UserId;
}
export interface Vehicle {
    status: VehicleStatus;
    model: string;
    color: string;
    year: bigint;
    brand: string;
    plate: string;
}
export type Result_1 = {
    __kind__: "ok";
    ok: RideView;
} | {
    __kind__: "err";
    err: RideError;
};
export type Result_4 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface TransformationInput {
    context: Uint8Array;
    response: HttpRequestResult;
}
export interface Cell {
    value: Value;
    name: string;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface VehicleInput {
    model: string;
    color: string;
    year: bigint;
    brand: string;
    plate: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface AdminOverview {
    completedRides: bigint;
    totalDrivers: bigint;
    feeBalance: number;
    pendingVehicles: bigint;
}
export interface HttpHeader {
    value: string;
    name: string;
}
export interface LatLng {
    lat: number;
    lng: number;
}
export type UserId = Principal;
export type Result = {
    __kind__: "ok";
    ok: UserProfile;
} | {
    __kind__: "err";
    err: ProfileError;
};
export type Result_3 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: RideError;
};
export interface DriverView {
    id: UserId;
    completedRides: bigint;
    name: string;
    createdAt: Timestamp;
    vehicle: Vehicle;
}
export interface FareEstimate {
    total: number;
    perKmRate: number;
    distanceKm: number;
    baseFare: number;
}
export interface UserProfile {
    id: UserId;
    name: string;
    createdAt: Timestamp;
    role: ProfileRole;
    vehicle?: Vehicle;
}
export enum AdminError {
    notFound = "notFound",
    unauthorized = "unauthorized",
    notPending = "notPending"
}
export enum PaymentMethod {
    card = "card",
    cash = "cash"
}
export enum ProfileError {
    alreadyExists = "alreadyExists",
    notDriver = "notDriver",
    vehicleRequired = "vehicleRequired",
    notFound = "notFound",
    unauthorized = "unauthorized"
}
export enum ProfileRole {
    customer = "customer",
    driver = "driver"
}
export enum RideError {
    profileRequired = "profileRequired",
    driverNotApproved = "driverNotApproved",
    notAvailable = "notAvailable",
    notCustomer = "notCustomer",
    notDriver = "notDriver",
    wrongStatus = "wrongStatus",
    notFound = "notFound",
    unauthorized = "unauthorized"
}
export enum RideStatus {
    in_progress = "in_progress",
    completed = "completed",
    accepted = "accepted",
    waiting = "waiting"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VehicleStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export interface backendInterface {
    acceptRide(rideId: bigint): Promise<Result_1>;
    approveVehicle(driverId: UserId): Promise<Result_2>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    completeRide(rideId: bigint): Promise<Result_1>;
    createProfile(role: ProfileRole, name: string, vehicle: VehicleInput | null): Promise<Result>;
    declineRide(rideId: bigint): Promise<Result_3>;
    estimateFare(originLat: number, originLng: number, destinationText: string): Promise<FareEstimate>;
    execute(qJson: string): Promise<Result__1>;
    getAdminOverview(): Promise<AdminOverview>;
    getApiDoc(): Promise<string>;
    getCallerProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFeeBalance(): Promise<number>;
    getFeeStatement(): Promise<Array<FeeStatementEntry>>;
    getProfile(userId: UserId): Promise<UserProfile | null>;
    getRide(rideId: bigint): Promise<RideView | null>;
    isCallerAdmin(): Promise<boolean>;
    listAvailableRides(): Promise<Array<RideView>>;
    listDrivers(): Promise<Array<DriverView>>;
    listMyRides(): Promise<Array<RideView>>;
    listPendingVehicles(): Promise<Array<DriverView>>;
    rejectVehicle(driverId: UserId): Promise<Result_2>;
    requestRide(originLat: number, originLng: number, destinationText: string, paymentMethod: PaymentMethod): Promise<Result_1>;
    schema(): Promise<string>;
    startRide(rideId: bigint): Promise<Result_1>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateProfile(name: string): Promise<Result>;
    updateVehicle(vehicle: VehicleInput): Promise<Result>;
}
