/**
 * cdd-intake-proposal.js — source-side export contract for the Commercial
 * Decision Desk Intake Proposal v0.1 (Evidence Handoff v0.1, owner-authorized).
 *
 * The export is a PROPOSAL for CDD intake — never canonical CDD evidence.
 * It carries the source record's classification (anonymized / representative)
 * visibly, proposes only signals CDD can consume, and leaves every gate,
 * score, recommendation and human decision out of scope.
 *
 * Pure deterministic functions (no I/O, no randomness; the only non-deterministic
 * field is `generatedAt`, stamped at build time and excluded from determinism
 * tests). No API, no backend, no persistence, no network.
 */
export const INTAKE_PROPOSAL = {
  kind: "cdd-intake-proposal",
  schemaVersion: 1,
  sourceSystem: "overseas-lead-discovery",
};

// Signals the source MAY propose to CDD (per handoff: map only these).
export const ALLOWED_SIGNALS = ["BUYER_FIT", "CATEGORY_FIT", "IMPORT_OPENNESS"];

// Source fields explicitly EXCLUDED from CDD decision fields.
export const EXCLUDED_FROM_CDD = [
  "entryBarrier", // lead-entry difficulty, not an opportunity-quality dimension
  "asiaSourcing", // source-specific; no CDD counterpart (kept in source record only)
  "recommendation",
  "momentum",
  "coverage",
  "probability",
  "priorityScore",
  "humanDecision",
  "commercialOutcome",
];

const SIGNAL_SOURCE_FIELD = {
  BUYER_FIT: "buyerFit",
  CATEGORY_FIT: "categoryFit",
  IMPORT_OPENNESS: "importOpenness",
};

const isBlank = (v) => v === undefined || v === null || String(v).trim() === "";

/**
 * Build an intake proposal from one source record (the records.js shape).
 * Deterministic except `generatedAt`.
 */
export function buildIntakeProposal(record = {}, { now = () => new Date().toISOString() } = {}) {
  const name = String(record.name || "").trim();
  const signals = ALLOWED_SIGNALS.map((signal) => {
    const field = SIGNAL_SOURCE_FIELD[signal];
    const value = record[field];
    return {
      signal,
      value: isBlank(value) ? "UNKNOWN" : String(value).trim().toUpperCase(),
      sourceField: field,
    };
  });

  return {
    kind: INTAKE_PROPOSAL.kind,
    schemaVersion: INTAKE_PROPOSAL.schemaVersion,
    sourceSystem: INTAKE_PROPOSAL.sourceSystem,
    sourceRecordId: String(record.id || "").trim(),
    generatedAt: now(),
    sourceDisclosure: {
      classification: "REPRESENTATIVE_ANONYMIZED",
      anonymized: true,
      syntheticElements: true,
      realProspectIdentitiesExposed: false,
      note:
        "Source record is anonymized / representative / synthetic (per demo disclosure): " +
        "company names are fictional, evidence phrasing is reconstructed, real prospect " +
        "identities are not exposed. This proposal must never be represented as real buyer evidence.",
    },
    opportunityProposal: {
      buyer: {
        name,
        type: String(record.type || "UNKNOWN").trim() || "UNKNOWN",
      },
      market: {
        category: String(record.category || "UNKNOWN").trim() || "UNKNOWN",
        importOpenness: isBlank(record.importOpenness)
          ? "UNKNOWN"
          : String(record.importOpenness).trim().toUpperCase(),
      },
      rationale: Array.isArray(record.why) ? record.why.map(String) : [],
      sourceTiers: Array.isArray(record.sources)
        ? [...new Set(record.sources.map((s) => String(s.tier || "UNKNOWN").toUpperCase()).filter(Boolean))]
        : [],
    },
    proposedSignals: signals,
    unknowns: Array.isArray(record.unknown) ? record.unknown.map(String) : [],
    potentialTensions: Array.isArray(record.whyNot)
      ? record.whyNot.map((note) => ({
          note: String(note),
          notCanonicalContradiction: true,
          reviewNote:
            "Candidate tension from source 'why not' evidence — NOT a CDD canonical " +
            "contradiction. CDD must require human review before treating this as a contradiction.",
        }))
      : [],
    humanReviewRequired: true,
    boundary: {
      excludedFromCdd: [...EXCLUDED_FROM_CDD],
      note:
        "Proposal only. CDD must validate, map and require human review before using " +
        "any signal as evidence; nothing here is a recommendation, score or decision.",
    },
  };
}

/**
 * Validate an intake proposal object against contract v0.1.
 * Returns { valid, errors: string[] } — fails closed on any violation.
 */
export function validateIntakeProposal(p) {
  const errors = [];
  const need = (cond, msg) => {
    if (!cond) errors.push(msg);
  };

  need(p && typeof p === "object", "proposal must be an object");
  if (!p || typeof p !== "object") return { valid: false, errors };

  need(p.kind === INTAKE_PROPOSAL.kind, `kind must be "${INTAKE_PROPOSAL.kind}"`);
  need(p.schemaVersion === INTAKE_PROPOSAL.schemaVersion, `schemaVersion must be ${INTAKE_PROPOSAL.schemaVersion}`);
  need(p.sourceSystem === INTAKE_PROPOSAL.sourceSystem, `sourceSystem must be "${INTAKE_PROPOSAL.sourceSystem}"`);
  need(!isBlank(p.sourceRecordId), "sourceRecordId must be present");
  need(!isBlank(p.generatedAt), "generatedAt must be present (ISO timestamp)");

  // sourceDisclosure — the truth boundary must survive export.
  const d = p.sourceDisclosure || {};
  need(typeof d === "object", "sourceDisclosure must be an object");
  need(d.classification === "REPRESENTATIVE_ANONYMIZED", "sourceDisclosure.classification must be REPRESENTATIVE_ANONYMIZED");
  need(d.anonymized === true, "sourceDisclosure.anonymized must be true");
  need(d.syntheticElements === true, "sourceDisclosure.syntheticElements must be true");
  need(d.realProspectIdentitiesExposed === false, "sourceDisclosure.realProspectIdentitiesExposed must be false");
  need(!isBlank(d.note), "sourceDisclosure.note must be present");

  // opportunityProposal
  const op = p.opportunityProposal || {};
  need(typeof op === "object", "opportunityProposal must be an object");
  need(op.buyer && !isBlank(op.buyer.name), "opportunityProposal.buyer.name must be present");
  need(op.market && !isBlank(op.market.category), "opportunityProposal.market.category must be present");
  need(Array.isArray(op.rationale), "opportunityProposal.rationale must be an array");
  need(Array.isArray(op.sourceTiers), "opportunityProposal.sourceTiers must be an array");
  for (const t of op.sourceTiers) {
    need(["PRIMARY", "SUPPORTING", "VERIFICATION_REQUIRED", "UNKNOWN"].includes(t), `sourceTier "${t}" not in allowed tiers`);
  }

  // proposedSignals — only the allowed signal set.
  need(Array.isArray(p.proposedSignals) && p.proposedSignals.length > 0, "proposedSignals must be a non-empty array");
  if (Array.isArray(p.proposedSignals)) {
    const seen = new Set();
    for (const s of p.proposedSignals) {
      need(ALLOWED_SIGNALS.includes(s.signal), `signal "${s.signal}" not in allowed set`);
      seen.add(s.signal);
      need(!isBlank(s.value), `signal ${s.signal} must have a value`);
    }
    need(seen.size === ALLOWED_SIGNALS.length, `proposedSignals must cover exactly ${ALLOWED_SIGNALS.join(", ")}`);
  }

  // unknowns + potentialTensions
  need(Array.isArray(p.unknowns), "unknowns must be an array");
  need(Array.isArray(p.potentialTensions), "potentialTensions must be an array");
  for (const t of p.potentialTensions || []) {
    need(t.notCanonicalContradiction === true, "potentialTension must set notCanonicalContradiction: true");
    need(!isBlank(t.note), "potentialTension must have a note");
  }

  // human decision stays out of the source.
  need(p.humanReviewRequired === true, "humanReviewRequired must be true");
  for (const forbidden of ["recommendation", "humanDecision", "commercialOutcome", "momentum", "coverage", "probability", "priorityScore"]) {
    need(!(forbidden in p), `forbidden field "${forbidden}" must not be present`);
  }
  need(p.boundary && Array.isArray(p.boundary.excludedFromCdd), "boundary.excludedFromCdd must be an array");
  need(!("entryBarrier" in (op || {})), "entryBarrier must not be mapped into opportunityProposal");

  return { valid: errors.length === 0, errors };
}
