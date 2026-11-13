// Zero-dependency Node 26 test suite verifying the GET /api/devices auth gate.
// Methodology: NDH-Meta-Systems (Sealed-Layer Neutral)

import test from "node:test";
import assert from "node:assert/strict";
import {
  authorizeDeviceInventory,
  hashDeviceSecret,
  type EntitlementRecord,
} from "../src/device_auth_gate.ts";

const VALID_SECRET = "dev_secret_synthetic_9f8a7b6c5d4e3f2a1b0c";

function sampleLedger(email: string): EntitlementRecord | null {
  if (email !== "family@example.test") return null;
  return {
    email: "family@example.test",
    plan: "family",
    seats: 5,
    status: "active",
    devices: [
      {
        id: "dev_01",
        name: "Living Room TV",
        secret_hash_hex: hashDeviceSecret(VALID_SECRET).toString("hex"),
        created_at: "2026-11-01T10:00:00Z",
        last_seen_at: "2026-11-13T11:00:00Z",
      },
    ],
  };
}

test("rejects missing or blank email with 400 email_required", () => {
  const res = authorizeDeviceInventory("   ", `Bearer ${VALID_SECRET}`, sampleLedger);
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: "email_required" });
});

test("rejects unauthenticated requests with 401 device_secret_required", () => {
  const res = authorizeDeviceInventory("family@example.test", undefined, sampleLedger);
  assert.equal(res.status, 401);
  assert.deepEqual(res.body, { error: "device_secret_required" });
});

test("rejects unknown household email with 404 unknown_entitlement", () => {
  const res = authorizeDeviceInventory(
    "nobody@example.test",
    `Bearer ${VALID_SECRET}`,
    sampleLedger
  );
  assert.equal(res.status, 404);
  assert.deepEqual(res.body, { error: "unknown_entitlement" });
});

test("rejects wrong device secret with 401 invalid_device_secret", () => {
  const res = authorizeDeviceInventory(
    "family@example.test",
    "Bearer wrong_token_value",
    sampleLedger
  );
  assert.equal(res.status, 401);
  assert.deepEqual(res.body, { error: "invalid_device_secret" });
});

test("returns sanitized device inventory on valid Bearer secret", () => {
  const res = authorizeDeviceInventory(
    "FAMILY@EXAMPLE.TEST",
    `Bearer ${VALID_SECRET}`,
    sampleLedger
  );
  assert.equal(res.status, 200);
  if (res.status === 200) {
    assert.equal(res.body.used, 1);
    assert.equal(res.body.devices[0].id, "dev_01");
    assert.equal(res.body.devices[0].name, "Living Room TV");
    assert.equal("secret_hash_hex" in res.body.devices[0], false);
  }
});
