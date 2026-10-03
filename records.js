/**
 * records.js — anonymized representative records for the Lead Discovery demo.
 *
 * SECURITY: company names are SYNTHETIC / ANONYMIZED. Real prospect identities
 * from the M2/M3 pool are deliberately NOT exposed.
 *
 * Each record maps to a real M3 Top-20 archetype but with a fictional name and
 * reconstructed (not copied verbatim) evidence phrasing. Facts shown are
 * representative of the workflow output, labeled clearly as anonymized.
 *
 * The country on each record is a REPRESENTATIVE label for the archetype and does
 * not identify a real company. R9-R12 are SYNTHETIC ARCHETYPES of screened-out
 * accounts (a manufacturer, a regional-sourcing retailer, a partial-category
 * distributor, a compliance-gated buyer), added to show what screening rejects;
 * they are not drawn from the 44-candidate pool and make no claim about it.
 *
 * Evidence-source strength tiers:
 *   PRIMARY               — official company / regulatory
 *   SUPPORTING            — industry publications / associations / exhibitions
 *   VERIFICATION_REQUIRED — third-party trade databases (needs cross-check)
 *
 * Labels: SIMULATED / REAL / UNKNOWN / VALIDATION PENDING are preserved per field.
 */
export const records = [
  {
    id: "R1",
    market: { country: "GB" },
    basis: "REPRESENTATIVE",
    name: "Norcliff Flooring Group",
    type: "Importer / private-label flooring brand",
    category: "SPC / LVT flooring",
    buyerFit: "HIGH",
    categoryFit: "STRONG",
    importOpenness: "YES",
    originSourcing: "CONFIRMED",
    entryBarrier: "HIGH",
    why: [
      "Group structure built around importing and co-producing rigid-core flooring with overseas manufacturing partners (PRIMARY)",
      "Public product program lists SPC / WPC / LVT as core lines (PRIMARY)",
    ],
    whyNot: [
      "Describes itself as a global manufacturer, so some product may be produced in-house; still purchases Asian-made finished goods (contradictory evidence)",
    ],
    unknown: ["Exact annual purchase volume", "Which specific suppliers are current"],
    sources: [
      { tier: "PRIMARY", note: "Company disclosures", url: "#" },
      { tier: "SUPPORTING", note: "Trade press coverage", url: "#" },
    ],
  },
  {
    id: "R2",
    market: { country: "US" },
    basis: "REPRESENTATIVE",
    name: "Meridian Surfaces International",
    type: "Multi-category distributor / importer",
    category: "SPC / LVT flooring · tile · stone",
    buyerFit: "HIGH",
    categoryFit: "STRONG",
    importOpenness: "YES",
    originSourcing: "CONFIRMED",
    entryBarrier: "HIGH",
    why: [
      "Public profile states products sourced from dozens of countries including China and India (PRIMARY)",
      "Multiple interior-material categories with a dedicated global sourcing team (PRIMARY)",
    ],
    whyNot: ["Large mature buyer — likely has established supplier relationships (entry difficulty, not buyer fit)"],
    unknown: ["Supplier-switching appetite", "Current Asia supplier mix"],
    sources: [
      { tier: "PRIMARY", note: "Company statements", url: "#" },
      { tier: "SUPPORTING", note: "Industry publication", url: "#" },
    ],
  },
  {
    id: "R3",
    market: { country: "US" },
    basis: "REPRESENTATIVE",
    name: "Harborview Hard-Surface Retail Group",
    type: "Large direct-import flooring retailer",
    category: "SPC / LVT flooring",
    buyerFit: "HIGH",
    categoryFit: "STRONG",
    importOpenness: "YES",
    originSourcing: "CONFIRMED",
    entryBarrier: "HIGH",
    why: [
      "Public filing states production is contracted primarily in Asia and Europe, including China-origin click vinyl (PRIMARY / regulatory)",
    ],
    whyNot: ["Extremely large mature buyer that already buys direct — expect existing supplier relationships"],
    unknown: ["Current supplier contracts", "Openness to new Asia suppliers"],
    sources: [
      { tier: "PRIMARY", note: "Regulatory filing (10-K equivalent)", url: "#" },
      { tier: "SUPPORTING", note: "Analyst / trade coverage", url: "#" },
    ],
  },
  {
    id: "R4",
    market: { country: "GB" },
    basis: "REPRESENTATIVE",
    name: "Vantage Wallcoverings & Home",
    type: "Multi-category interior distributor / importer",
    category: "Wallcoverings · flooring · home accessories",
    buyerFit: "HIGH",
    categoryFit: "STRONG",
    importOpenness: "YES",
    originSourcing: "CONFIRMED",
    entryBarrier: "MEDIUM",
    why: [
      "Public profile describes itself as a leading importer/distributor of wall coverings with global reach (PRIMARY)",
      "Operates offices on three continents including China (PRIMARY)",
    ],
    whyNot: ["Has some in-house manufacturing capabilities (partial vertical integration)"],
    unknown: ["Direct China supplier contracts", "Wallcovering vs flooring purchase mix"],
    sources: [
      { tier: "PRIMARY", note: "Company about / global pages", url: "#" },
      { tier: "SUPPORTING", note: "Trade report", url: "#" },
    ],
  },
  {
    id: "R5",
    market: { country: "AU" },
    basis: "REPRESENTATIVE",
    name: "Aster Wallcoverings Import Co.",
    type: "Wallpaper importer / distributor",
    category: "Wallcoverings",
    buyerFit: "HIGH",
    categoryFit: "STRONG",
    importOpenness: "YES",
    originSourcing: "CONFIRMED",
    entryBarrier: "LOW",
    why: [
      "Business model is importing wallpaper; import records appear on third-party trade-intelligence platforms (VERIFICATION_REQUIRED)",
    ],
    whyNot: ["No official website found — contact seeding requires directories (verification gap)"],
    unknown: ["Specific Asia suppliers", "Purchase volume"],
    sources: [
      { tier: "VERIFICATION_REQUIRED", note: "Third-party trade database", url: "#" },
      { tier: "SUPPORTING", note: "Business directory", url: "#" },
    ],
  },
  {
    id: "R6",
    market: { country: "DE" },
    basis: "REPRESENTATIVE",
    name: "Delphi Textile Distributors",
    type: "Wholesale distributor / private-label textiles",
    category: "Window treatments · fabrics",
    buyerFit: "HIGH",
    categoryFit: "STRONG",
    importOpenness: "YES",
    originSourcing: "UNKNOWN",
    entryBarrier: "MEDIUM",
    why: [
      "Trade-only distributor of drapery fabrics and finished window treatments (PRIMARY)",
      "Carries multiple international brands, indicating imported goods (PRIMARY)",
    ],
    whyNot: ["Asia sourcing not confirmed — imports may be European (import openness ≠ Asia sourcing)"],
    unknown: ["Asia sourcing", "Whether it buys finished curtains or fabric only"],
    sources: [
      { tier: "PRIMARY", note: "Company pages", url: "#" },
      { tier: "SUPPORTING", note: "Trade directory", url: "#" },
    ],
  },
  {
    id: "R7",
    market: { country: "CA" },
    basis: "REPRESENTATIVE",
    name: "Northgate Contract Wallcovering",
    type: "Contract wallcovering distributor",
    category: "Wallcoverings (contract)",
    buyerFit: "HIGH",
    categoryFit: "STRONG",
    importOpenness: "UNKNOWN",
    originSourcing: "UNKNOWN",
    entryBarrier: "MEDIUM",
    why: [
      "Contract wallcovering and design solutions distributor with specialty product lines (PRIMARY)",
      "Serves commercial / design trade (SUPPORTING)",
    ],
    whyNot: ["Import openness and Asia sourcing both UNKNOWN — no evidence either way"],
    unknown: ["Import openness", "Asia sourcing", "Purchase authority detail"],
    sources: [
      { tier: "PRIMARY", note: "Company site", url: "#" },
      { tier: "SUPPORTING", note: "Industry directory", url: "#" },
    ],
  },
  {
    id: "R8",
    market: { country: "AE" },
    basis: "REPRESENTATIVE",
    name: "Cascade Home Décor Supply",
    type: "Importer / wholesale home décor",
    category: "Adjacent (home décor / lighting / accessories)",
    buyerFit: "HIGH",
    categoryFit: "WEAK",
    importOpenness: "YES",
    originSourcing: "UNKNOWN",
    entryBarrier: "MEDIUM",
    why: [
      "Registered importer of home décor and accessories (PRIMARY)",
      "Large multi-category catalog (SUPPORTING)",
    ],
    whyNot: [
      "Category fit is WEAK — no core seed category (wallcoverings / window treatments / SPC-LVT); import activity cannot compensate (domain-learning rule)",
    ],
    unknown: ["Whether any seed category is commercially meaningful", "Asia sourcing"],
    sources: [
      { tier: "PRIMARY", note: "Importer registration", url: "#" },
      { tier: "SUPPORTING", note: "Trade directory", url: "#" },
    ],
    flaggedWeak: true,
  },
  {
    id: "R9",
    market: { country: "PL" },
    basis: "SYNTHETIC_ARCHETYPE",
    name: "Halden Surfaces Manufacturing",
    type: "Flooring manufacturer (vertically integrated)",
    category: "SPC / LVT flooring",
    buyerFit: "LOW",
    categoryFit: "STRONG",
    importOpenness: "NO",
    originSourcing: "NO",
    entryBarrier: "HIGH",
    why: [
      "Operates its own extrusion and pressing lines for rigid-core flooring (PRIMARY)",
    ],
    whyNot: [
      "It buys raw materials and machinery, not finished flooring: for these customers it is a competitor, not a buyer (PRIMARY)",
    ],
    unknown: ["Whether it ever subcontracts overflow volume"],
    sources: [
      { tier: "PRIMARY", note: "Company production pages", url: "#" },
      { tier: "SUPPORTING", note: "Trade press coverage", url: "#" },
    ],
  },
  {
    id: "R10",
    market: { country: "FR" },
    basis: "SYNTHETIC_ARCHETYPE",
    name: "Verdane Interiors Retail",
    type: "Regional retail chain with private-label ranges",
    category: "SPC / LVT flooring · wallcoverings",
    buyerFit: "MEDIUM",
    categoryFit: "STRONG",
    importOpenness: "YES",
    originSourcing: "NO",
    entryBarrier: "MEDIUM",
    why: [
      "Runs private-label flooring and wallcovering ranges across a regional store network (PRIMARY)",
    ],
    whyNot: [
      "Its published sourcing policy commits private-label ranges to European-made supply and states a preference against long-distance sourcing (PRIMARY): explicit evidence against Asia sourcing",
    ],
    unknown: ["Whether the policy covers every range or only the flagship line", "Commercial-project purchases outside private label"],
    sources: [
      { tier: "PRIMARY", note: "Published sourcing policy", url: "#" },
      { tier: "SUPPORTING", note: "Trade directory", url: "#" },
    ],
  },
  {
    id: "R11",
    market: { country: "NL" },
    basis: "SYNTHETIC_ARCHETYPE",
    name: "Marlow Coatings & Decor Wholesale",
    type: "Paint, coatings and décor distributor",
    category: "Paints and coatings · wallcoverings (secondary line)",
    buyerFit: "HIGH",
    categoryFit: "PARTIAL",
    importOpenness: "YES",
    originSourcing: "CONFIRMED",
    entryBarrier: "LOW",
    why: [
      "Imports décor products through a major port and lists wallcoverings as a secondary line (PRIMARY)",
      "Asia-origin goods appear in its public product catalogue (PRIMARY)",
    ],
    whyNot: [
      "Wallcoverings are a side line beside paints and coatings, so the commercial weight of the seed category is unclear (partial category fit)",
    ],
    unknown: ["Share of revenue from wallcoverings", "Who owns the wallcovering purchasing decision"],
    sources: [
      { tier: "PRIMARY", note: "Company product catalogue", url: "#" },
      { tier: "SUPPORTING", note: "Industry directory", url: "#" },
    ],
  },
  {
    id: "R12",
    market: { country: "SANCTIONED" },
    basis: "SYNTHETIC_ARCHETYPE",
    complianceGate: "SANCTIONS_JURISDICTION",
    name: "Kestrel Interior Trading",
    type: "Importer / trading company",
    category: "Wallcoverings · window treatments",
    buyerFit: "HIGH",
    categoryFit: "STRONG",
    importOpenness: "YES",
    originSourcing: "CONFIRMED",
    entryBarrier: "LOW",
    why: [
      "Active importer of wallcoverings and window treatments with Asia-origin goods (SUPPORTING)",
    ],
    whyNot: [
      "Its registered address is in a jurisdiction under comprehensive sanctions: not a candidate whatever the fit (compliance gate)",
    ],
    unknown: ["Whether any lawful route exists, which needs legal counsel and is outside this tool"],
    sources: [
      { tier: "SUPPORTING", note: "Trade directory", url: "#" },
      { tier: "PRIMARY", note: "Public registry entry", url: "#" },
    ],
  },
];
