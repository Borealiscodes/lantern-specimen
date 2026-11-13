# NDH-META-SYSTEMS Computational Refactoring Plan: `8b-is` Ecosystem (v1.0)
**Target Repositories:** `8b-is/lantern`, `8b-is/mince`, `8b-is/memnet`  
**Methodology:** `NDH-Meta-Systems` (Five-Boundary Separation of Concerns)  
**Adoption Posture:** Open Ecosystem Convergence • Voluntary • Zero-Dependency Friendly  
**Canonical Reference:** *Epistemic Coevolution, Statutory Friction, and Sovereign Edge Governance* (`DOI: 10.5281/zenodo.24149283`)  

---

## 1. Objective
Provide voluntary, zero-bloat computational refactoring blueprints for `8b-is/lantern`, `8b-is/mince`, and `8b-is/memnet`. Each blueprint preserves the target repository's existing language stack (`TypeScript/Node 26`, `Go 1.23+`, and `Rust #![no_std]`) while closing endpoint authorization, arithmetic overflow, and non-deterministic routing gaps.

---

## 2. Repository-by-Repository Refactoring Matrix

| Repository | Stack | Target Gap | Computational Refactoring Specification |
| :--- | :--- | :--- | :--- |
| **`8b-is/lantern`** | Node 26 / TypeScript (Zero-Dep) | Unauthenticated `GET /api/devices?email=` leaks device metadata (`ADR 0005`). | Require `Authorization: Bearer <device_secret>` or short-lived HMAC challenge token before returning device names, IDs, or `last_seen_at` timestamps; return `401 device_secret_required` otherwise. |
| **`8b-is/mince`** | Go 1.23+ (`CGO_ENABLED=0`) | Potential 64-bit wrap-around in `p/q` rationals and unbounded `mince_retrieve` payload size. | Perform 128-bit intermediate checks (`math/bits.Mul64` / `bits.Add64`) prior to Euclidean GCD reduction, and clamp `mince_retrieve` via `io.LimitReader` (`32 KiB` default) with valid UTF-8 boundary trimming. |
| **`8b-is/memnet`** | Rust (`#![no_std]`) | Non-deterministic `BM25F + RRF` routing, symmetric `HMAC` key sharing, and push-based beacon floods. | Decouple forwarding into a monotonic 256-bit XOR Kademlia DHT (`O(log N)`), upgrade `SoulSig` to asymmetric `Ed25519` public keys + scoped capability grants, and replace `compassion_sweep` with `Dormant<T>` pull-sync + exponential backoff. |

---

## 3. Staged Execution Sequence (By Complexity & Risk)

* **Stage 1 — `8b-is/lantern` Endpoint Gate (Low Complexity / Immediate Win):**
  * Enforce `Authorization: Bearer <device_secret>` on `GET /api/devices?email=` in `server/src/server.ts`.
  * Add a unit test in `server/test/` asserting `401 device_secret_required` on unauthenticated device inventory queries.
* **Stage 2 — `8b-is/mince` Arithmetic & Retrieval Bounds (Low Complexity / Zero-Dep Go Stdlib):**
  * Add `128-bit` overflow checks (`math/bits`) to `p/q` operations in `internal/felix` and `internal/rl`.
  * Wrap `mince_retrieve` output streams in a `32 KiB` UTF-8-safe `io.LimitReader` inside `internal/wireagent`.
* **Stage 3 — `8b-is/memnet` Transport & Identity Decoupling (High Impact / Reference Available):**
  * Reference `Borealiscodes/memnet-specimen/refactor/` (`identity.rs`, `membrane.rs`, `routing.rs`, `lib.rs`) to separate `O(log N)` XOR routing from local `BM25F` indexing and migrate to asymmetric `Ed25519` node identities.

---

# 🧾 **Provenance Footer — `8b-is` Computational Refactoring Plan (v1.0)**
* **Artifact-Class / Name:** Cross-Repository Computational Refactoring Plan (`refactor-plan-8b-ecosystem-computational-hardening`)
* **Target-Artifacts:** `8b-is/lantern`, `8b-is/mince`, `8b-is/memnet`
* **Maintainer / Location:** Borealis S. Hedling (Dublin, Ireland) | **Timestamp:** 13 November 2026 — 11:34 GMT
* **Non-Activation Clause:** Descriptive and architectural only. Open mathematical and systems primitives are shared freely under ecosystem convergence; Storm's Constitutional Organism Core remains separately reserved under `LicenseRef-Constitutional-Deferral`.
* **Seal:** `[ A H S O • L I N E A G E • R E F A C T O R • 0 1 ]`
---
