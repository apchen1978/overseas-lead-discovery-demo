// The live method must reproduce the recorded answers for every shipped record: tier, reasons,
// market checks and the CDD intake proposal. Two reason codes are renamed relative to the
// pre-refactor recording (NO_ASIA_SOURCING -> NO_ORIGIN_SOURCING, ASIA_UNKNOWN -> ORIGIN_UNKNOWN);
// the recording was updated for exactly that and nothing else.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { snapshot } from "./golden/snapshot.mjs";

const golden = JSON.parse(readFileSync(new URL("./golden/before-after.json", import.meta.url), "utf8"));
assert.deepStrictEqual(snapshot(), golden, "method output must equal the recorded golden");
console.log("Lead Discovery golden test: 1/1 PASS (12 records: tier, reasons, market checks, CDD proposal)");
