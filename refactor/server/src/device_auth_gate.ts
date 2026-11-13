// Zero-dependency Node 26 TypeScript authentication gate for GET /api/devices.
// Resolves ADR 0005 unauthenticated device inventory enumeration using constant-time
// SHA-256 digest comparison (`node:crypto`).
// Methodology: NDH-Meta-Systems (Sealed-Layer Neutral)

import { createHash, timingSafeEqual } from "node:crypto";

export interface DeviceRecord {
  id: string;
  name: string;
  secret_hash_hex: string;
  created_at: string;
  last_seen_at: string;
}

export interface EntitlementRecord {
  email: string;
  plan: string;
  seats: number;
  status: string;
  devices: DeviceRecord[];
}

export type GateOutcome =
  | {
      status: 200;
      body: {
        email: string;
        seats: number;
        used: number;
        devices: Array<Omit<DeviceRecord, "secret_hash_hex">>;
      };
    }
  | {
      status: 400 | 401 | 404;
      body: {
        error:
          | "email_required"
          | "device_secret_required"
          | "invalid_device_secret"
          | "unknown_entitlement";
      };
    };

/** Hashes a raw bearer token with SHA-256 into a fixed 32-byte buffer. */
export function hashDeviceSecret(rawSecret: string): Buffer {
  return createHash("sha256").update(rawSecret, "utf8").digest();
}

/** Extracts the bearer token from an HTTP Authorization header (`Bearer <token>`). */
export function extractBearerSecret(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(authHeader.trim());
  return match ? match[1] : null;
}

/** Constant-time verification checking whether `presentedSecret` matches any registered device on the ledger. */
function isAuthorizedForLedger(
  devices: readonly DeviceRecord[],
  presentedSecret: string
): boolean {
  const candidateDigest = hashDeviceSecret(presentedSecret);
  let matched = false;

  for (const device of devices) {
    if (!/^[0-9a-f]{64}$/i.test(device.secret_hash_hex)) continue;
    const storedDigest = Buffer.from(device.secret_hash_hex, "hex");
    if (
      storedDigest.length === candidateDigest.length &&
      timingSafeEqual(storedDigest, candidateDigest)
    ) {
      matched = true;
    }
  }
  return matched;
}

/**
 * Gated handler for `GET /api/devices?email=...`.
 * Fails closed with `401 device_secret_required` or `401 invalid_device_secret`
 * unless a valid device secret for that household ledger is presented.
 */
export function authorizeDeviceInventory(
  email: string | undefined,
  authHeader: string | undefined,
  ledgerLookup: (normalizedEmail: string) => EntitlementRecord | null
): GateOutcome {
  const normalizedEmail = (email ?? "").trim().toLowerCase();
  if (!normalizedEmail) {
    return { status: 400, body: { error: "email_required" } };
  }

  const bearer = extractBearerSecret(authHeader);
  if (!bearer) {
    return { status: 401, body: { error: "device_secret_required" } };
  }

  const record = ledgerLookup(normalizedEmail);
  if (!record) {
    return { status: 404, body: { error: "unknown_entitlement" } };
  }

  if (!isAuthorizedForLedger(record.devices, bearer)) {
    return { status: 401, body: { error: "invalid_device_secret" } };
  }

  const sanitizedDevices = record.devices.map(({ secret_hash_hex: _omit, ...pub }) => pub);
  return {
    status: 200,
    body: {
      email: record.email,
      seats: record.seats,
      used: sanitizedDevices.length,
      devices: sanitizedDevices,
    },
  };
}
