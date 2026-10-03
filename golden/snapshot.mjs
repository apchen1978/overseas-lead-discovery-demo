import { records } from "../records.js";
import { qualify, rankRecords, summarize } from "../qualification.js";
import { marketFor, MARKETS } from "../markets.js";
import { categoryKeysFor } from "../category-map.js";
import { buildIntakeProposal } from "../cdd-intake-proposal.js";

const strip = (v) => JSON.parse(JSON.stringify(v));

export function snapshot() {
  const regionOf = (r) => MARKETS[r.market?.country]?.region;
  const out = { perRecord: {}, ranked: rankRecords(records).map(({ record, q }) => ({ id: record.id, q })), summary: summarize(records, regionOf) };
  for (const r of records) {
    let proposal;
    try { proposal = buildIntakeProposal(r, { now: () => "2026-10-03T00:00:00.000Z" }); } catch (e) { proposal = { error: String(e.message) }; }
    out.perRecord[r.id] = { q: qualify(r), market: marketFor(r, categoryKeysFor(r.category)), proposal };
  }
  return strip(out);
}
