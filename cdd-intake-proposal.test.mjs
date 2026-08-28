// cdd-intake-proposal.test.mjs — schema validation + determinism tests for the
// CDD Intake Proposal v0.1 source-side export (Evidence Handoff v0.1).
// Node-only. Determinism excludes `generatedAt` by contract.
import { readFileSync } from "node:fs";
import { records } from "./records.js";
import {
  buildIntakeProposal,
  validateIntakeProposal,
  ALLOWED_SIGNALS,
  EXCLUDED_FROM_CDD,
} from "./cdd-intake-proposal.js";

const results = [];
const check = (name, cond, detail = "") => {
  results.push([name, !!cond]);
  console.log((cond ? "PASS " : "FAIL ") + name + (cond ? "" : "  | " + detail));
};

const FIXED_NOW = () => "2026-08-26T00:00:00.000Z";
const loadFixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
const withoutGeneratedAt = (p) => { const { generatedAt, ...rest } = p; return rest; };

// 1. both fixtures validate against contract v0.1
for (const f of ["cdd-intake-proposal-r6-unknown-heavy.json", "cdd-intake-proposal-r1-potential-tension.json"]) {
  const v = validateIntakeProposal(loadFixture(f));
  check(`fixture ${f} validates`, v.valid, v.errors.join("; "));
}

// 2. fixture vs build-from-record consistency (fixtures are true snapshots)
{
  const r6 = records.find((r) => r.id === "R6");
  const r1 = records.find((r) => r.id === "R1");
  const builtR6 = buildIntakeProposal(r6, { now: FIXED_NOW });
  const builtR1 = buildIntakeProposal(r1, { now: FIXED_NOW });
  check("fixture R6 == build(R6) except generatedAt",
    JSON.stringify(withoutGeneratedAt(loadFixture("cdd-intake-proposal-r6-unknown-heavy.json"))) ===
    JSON.stringify(withoutGeneratedAt(builtR6)));
  check("fixture R1 == build(R1) except generatedAt",
    JSON.stringify(withoutGeneratedAt(loadFixture("cdd-intake-proposal-r1-potential-tension.json"))) ===
    JSON.stringify(withoutGeneratedAt(builtR1)));
}

// 3. determinism — same input, same output (excluding generatedAt)
{
  const a = buildIntakeProposal(records[0], { now: FIXED_NOW });
  const b = buildIntakeProposal(records[0], { now: FIXED_NOW });
  check("deterministic build (two runs identical, minus generatedAt)",
    JSON.stringify(withoutGeneratedAt(a)) === JSON.stringify(withoutGeneratedAt(b)));
  const c = buildIntakeProposal(records[0], { now: () => "2026-09-01T00:00:00.000Z" });
  check("only generatedAt differs when clock differs",
    JSON.stringify(withoutGeneratedAt(a)) === JSON.stringify(withoutGeneratedAt(c)));
}

// 4. every record in the source can build + validate (no record breaks the contract)
{
  let allOk = true;
  const detail = [];
  for (const r of records) {
    const v = validateIntakeProposal(buildIntakeProposal(r, { now: FIXED_NOW }));
    if (!v.valid) { allOk = false; detail.push(`${r.id}: ${v.errors.join("; ")}`); }
  }
  check("all 8 source records build + validate", allOk, detail.join(" | "));
}

// 5. contract literals + truth boundary
{
  const p = buildIntakeProposal(records[0], { now: FIXED_NOW });
  check("kind literal", p.kind === "cdd-intake-proposal");
  check("schemaVersion 1", p.schemaVersion === 1);
  check("sourceSystem literal", p.sourceSystem === "overseas-lead-discovery");
  check("humanReviewRequired true", p.humanReviewRequired === true);
  check("sourceDisclosure preserves anonymized/synthetic truth",
    p.sourceDisclosure.classification === "REPRESENTATIVE_ANONYMIZED" &&
    p.sourceDisclosure.anonymized === true &&
    p.sourceDisclosure.syntheticElements === true &&
    p.sourceDisclosure.realProspectIdentitiesExposed === false);
  check("boundary lists all excluded fields",
    JSON.stringify(p.boundary.excludedFromCdd) === JSON.stringify(EXCLUDED_FROM_CDD));
}

// 6. do-not-map discipline — forbidden fields absent from the export
{
  const p = buildIntakeProposal(records[0], { now: FIXED_NOW });
  const forbiddenInExport = ["entryBarrier", "asiaSourcing", "recommendation", "momentum", "coverage", "probability", "priorityScore", "humanDecision", "commercialOutcome"];
  const present = forbiddenInExport.filter((k) => k in p || k in (p.opportunityProposal || {}));
  check("no forbidden field leaked into export", present.length === 0, present.join(", "));
  check("entryBarrier not mapped into opportunityProposal", !("entryBarrier" in p.opportunityProposal));
  check("only allowed signals proposed",
    p.proposedSignals.every((s) => ALLOWED_SIGNALS.includes(s.signal)) &&
    new Set(p.proposedSignals.map((s) => s.signal)).size === ALLOWED_SIGNALS.length);
}

// 7. validation fails closed on contract violations
{
  const p = buildIntakeProposal(records[0], { now: FIXED_NOW });
  check("rejects wrong kind", !validateIntakeProposal({ ...p, kind: "cdd-memo" }).valid);
  check("rejects wrong schemaVersion", !validateIntakeProposal({ ...p, schemaVersion: 2 }).valid);
  check("rejects wrong sourceSystem", !validateIntakeProposal({ ...p, sourceSystem: "elsewhere" }).valid);
  check("rejects missing sourceDisclosure", !validateIntakeProposal({ ...p, sourceDisclosure: undefined }).valid);
  check("rejects anonymized=false", !validateIntakeProposal({ ...p, sourceDisclosure: { ...p.sourceDisclosure, anonymized: false } }).valid);
  check("rejects humanReviewRequired=false", !validateIntakeProposal({ ...p, humanReviewRequired: false }).valid);
  check("rejects unknown signal", !validateIntakeProposal({ ...p, proposedSignals: [{ signal: "FANCY_SCORE", value: "HIGH" }] }).valid);
  check("rejects non-canonical tension flag dropped",
    !validateIntakeProposal({ ...p, potentialTensions: [{ note: "x" }] }).valid);
  check("rejects leak of humanDecision", !validateIntakeProposal({ ...p, humanDecision: "GO" }).valid);
  check("rejects leak of recommendation", !validateIntakeProposal({ ...p, recommendation: "PURSUE" }).valid);
  check("rejects entryBarrier in opportunityProposal",
    !validateIntakeProposal({ ...p, opportunityProposal: { ...p.opportunityProposal, entryBarrier: "HIGH" } }).valid);
  check("rejects non-object", !validateIntakeProposal(null).valid);
}

// 8. unknown-heavy fixture semantics (R6) — unknowns preserved, not invented
{
  const f = loadFixture("cdd-intake-proposal-r6-unknown-heavy.json");
  check("R6 unknowns preserved verbatim",
    JSON.stringify(f.unknowns) === JSON.stringify(["Asia sourcing", "Whether it buys finished curtains or fabric only"]));
  check("R6 no invented signals (asiaSourcing stays out of signals)",
    !f.proposedSignals.some((s) => s.signal === "ASIA_SOURCING"));
  check("R6 plausible commercial core intact",
    f.opportunityProposal.market.importOpenness === "YES" &&
    f.proposedSignals.find((s) => s.signal === "BUYER_FIT").value === "HIGH");
}

// 9. potential-tension fixture semantics (R1) — tension flagged, not canonical
{
  const f = loadFixture("cdd-intake-proposal-r1-potential-tension.json");
  const tension = f.potentialTensions[0];
  check("R1 has a potential tension", !!tension);
  check("R1 tension marked notCanonicalContradiction",
    tension && tension.notCanonicalContradiction === true);
  check("R1 tension carries human review note", !!tension && !!/CDD must require human review/.test(tension.reviewNote || ""));
  check("R1 rationale verbatim", f.opportunityProposal.rationale[0] ===
    "Group structure built around importing and co-producing rigid-core flooring with overseas manufacturing partners (PRIMARY)");
}

const failed = results.filter(([, ok]) => !ok);
console.log(`\nCDD INTAKE PROPOSAL RESULT: ${results.length - failed.length}/${results.length} PASS`);
process.exitCode = failed.length ? 1 : 0;
