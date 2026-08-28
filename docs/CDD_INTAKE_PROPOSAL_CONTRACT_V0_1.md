# CDD × Overseas Lead Discovery — Intake Proposal Contract v0.1

**Status:** source-side design delivered (Evidence Handoff v0.1, owner-authorized).
**Scope:** `overseas-lead-discovery-demo` only. No CDD integration was performed;
this document defines the contract for Codex's CDD import slice.

---

## 1. Purpose and boundary

The export is a **proposal for CDD intake** — never canonical CDD evidence.
It takes one qualified source record, preserves its classification
(anonymized / representative / synthetic) **visibly**, and proposes only the
signals CDD can consume. Everything else — scores, recommendation, gates,
human decision, commercial outcome — is **out of scope by design**.

> Export = "here is a candidate and what the source believes, with its
> uncertainties". Import = "the human decides whether any of it becomes CDD
> evidence". The handoff never crosses that line.

## 2. Contract (schemaVersion 1)

| Field | Type | Rules |
|---|---|---|
| `kind` | literal | `"cdd-intake-proposal"` |
| `schemaVersion` | literal | `1` |
| `sourceSystem` | literal | `"overseas-lead-discovery"` |
| `sourceRecordId` | string | source record id (e.g. `R6`), non-blank |
| `generatedAt` | ISO timestamp | stamped at build; **excluded from determinism tests** |
| `sourceDisclosure` | object | truth boundary (below) |
| `opportunityProposal` | object | buyer / market / rationale / sourceTiers |
| `proposedSignals` | array | exactly `BUYER_FIT`, `CATEGORY_FIT`, `IMPORT_OPENNESS` |
| `unknowns` | array | source unknowns, verbatim |
| `potentialTensions` | array | candidate tensions, **not** canonical contradictions |
| `humanReviewRequired` | boolean | always `true` |
| `boundary` | object | excluded-from-CDD list + note |

`sourceDisclosure` is mandatory and must state, on every export:
`classification: "REPRESENTATIVE_ANONYMIZED"`, `anonymized: true`,
`syntheticElements: true`, `realProspectIdentitiesExposed: false`, plus a note.
**An export that loses this classification is invalid.**

## 3. Mapping table — source field → proposed CDD field → excluded / reason

| Source field (records.js) | Proposed CDD field | Mapped? | Reason |
|---|---|---|---|
| `buyerFit` | `BUYER_FIT` signal | ✅ map | CDD Buyer Fit dimension |
| `categoryFit` | `CATEGORY_FIT` signal | ✅ map | CDD Category/Product Fit dimension |
| `importOpenness` | `IMPORT_OPENNESS` signal + `market.importOpenness` | ✅ map | CDD Import Openness dimension |
| `why[]` | `opportunityProposal.rationale` | ✅ map | verbatim reasoning with tier tags |
| `sources[].tier` | `opportunityProposal.sourceTiers` | ✅ map | PRIMARY / SUPPORTING / VERIFICATION_REQUIRED only |
| `unknown[]` | `unknowns` | ✅ map | verbatim, never filled in |
| `whyNot[]` | `potentialTensions` | ⚠️ as candidate | flagged `notCanonicalContradiction: true`; **not** a CDD contradiction |
| `entryBarrier` | — | ❌ **excluded** | lead-entry difficulty, not an opportunity-quality dimension; must not enter CDD decision fields |
| `asiaSourcing` | — | ❌ **excluded** | source-specific; no CDD counterpart (remains in source record only) |
| `type` / `category` | `buyer.type` / `market.category` | ✅ map | descriptive context only |
| `name` | `buyer.name` | ✅ map | fictional/anonymized name, covered by disclosure |
| recommendation / momentum / coverage / probability / priorityScore / humanDecision / commercialOutcome | — | ❌ **excluded** | the source has no such authority; any value here would be invented |

## 4. Do-not-map discipline (enforced by tests)

- `entryBarrier` never appears in `opportunityProposal` or any decision field.
- `whyNot` is exported as `potentialTensions` with
  `notCanonicalContradiction: true` and a human-review note — it is **never**
  registered as a CDD canonical contradiction by the source.
- No recommendation, Momentum, Coverage, probability, priority score, human
  decision, or commercial outcome is produced by the export.
- `asiaSourcing` is deliberately not proposed as a signal (no CDD counterpart).

## 5. Fixtures (two, both from existing anonymized records)

| Fixture | Source | Purpose |
|---|---|---|
| `fixtures/cdd-intake-proposal-r6-unknown-heavy.json` | R6 Delphi Textile Distributors | UNKNOWN-heavy but commercially plausible: strong buyer/category fit + import YES, with unresolved unknowns (Asia sourcing, finished-curtains-vs-fabric) |
| `fixtures/cdd-intake-proposal-r1-potential-tension.json` | R1 Norcliff Flooring Group | potential-tension case: self-production vs Asian sourcing (contradictory evidence) surfaced as a tension for human review, not a contradiction |

Fixtures are true snapshots of `buildIntakeProposal(record)` — the tests assert
fixture == build(record) modulo `generatedAt`.

## 6. What CDD MUST require the human to review (import-side obligations)

1. **Truth boundary survives import.** Every proposal imported into CDD must
   carry its `REPRESENTATIVE_ANONYMIZED` classification; it must never be
   presented as real buyer evidence.
2. **Signals are proposals, not evidence.** Before any proposed signal
   (`BUYER_FIT` / `CATEGORY_FIT` / `IMPORT_OPENNESS`) becomes a CDD evidence
   dimension, a human must confirm it against CDD's evidence vocabulary and
   decide its level — the source proposes, the human assigns.
3. **Every `potentialTension` requires a human decision** on whether it rises
   to a CDD canonical contradiction. The source explicitly does not decide
   this; CDD must not promote a tension silently.
4. **Every `unknowns` entry stays UNKNOWN** in CDD unless the human resolves it
   with evidence. The import must not infer values.
5. **Nothing in this export authorizes action.** Human decision and commercial
   outcome remain entirely with the CDD human workflow.

## 7. Validation

```bash
node cdd-intake-proposal.test.mjs
```

Checks (35): both fixtures validate; fixture == build(record) modulo
`generatedAt`; determinism (two runs identical, only `generatedAt` differs
with a different clock); all 8 source records build + validate; contract
literals; truth boundary preserved; no forbidden field leaks; validation
fails closed on every violation class (wrong kind / version / system, missing
disclosure, `anonymized:false`, `humanReviewRequired:false`, unknown signal,
tension flag dropped, `humanDecision` / `recommendation` leak, `entryBarrier`
leak, non-object); R6 unknowns verbatim; R1 tension flagged non-canonical.

**Result: 35/35 PASS** · deterministic · no network · no persistence.
