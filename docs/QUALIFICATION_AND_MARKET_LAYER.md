# Qualification tiers and the market layer

## Tiers (`qualification.js`)

Deterministic rules with no weights and no score, in the same spirit as the Commercial Decision Desk gates. The worst applicable tier wins.

| Tier | When |
|---|---|
| EXCLUDE | a compliance gate; LOW buyer fit (not a buyer); import openness NO |
| HOLD | weak category fit; Asia sourcing explicitly NO |
| VERIFY_FIRST | import openness or Asia sourcing UNKNOWN; partial category fit; no PRIMARY source; buyer fit not strong |
| ENGAGE_FIRST | every gate above is clear |

- **Entry barrier is not a gate.** It says how hard the door is to open, so it only orders accounts inside a tier (LOW before MEDIUM before HIGH).
- A tier is a reading order for people, not a probability of winning the account. It never enters the Commercial Decision Desk intake proposal (the contract excludes scores and recommendations).
- Lesser flags are still reported (`otherFlags`), so a held account still shows its unknown Asia sourcing.

## Market layer (`markets.js`)

For each representative country: the KINDS of checks a seller usually clears before quoting into that market (per seed category), general payment practice, and a reminder to check trade remedies by HS code and origin.

- **Domain learning, not verified fact.** No duty rate, no current legal status, no guarantee. Tests fail if a percentage, a duty figure or a promise of clearance appears in any market text.
- It **never changes a tier**: `qualification.test.mjs` re-qualifies every record with the market removed and expects the same tier.
- A category that touches no seed category gets no invented checks.
- The country on a record is a **representative label** for the archetype, not a real company's location.
- `SANCTIONED` is an unnamed placeholder for a comprehensively sanctioned jurisdiction, not a real country. It carries no checks and no currency.

## Examples

R1-R8 are the shortlisted archetypes (basis `REPRESENTATIVE`). R9-R12 are **synthetic screened-out archetypes** (basis `SYNTHETIC_ARCHETYPE`) added to show what screening rejects: a manufacturer, a regional-sourcing retailer, a partial-category distributor, and a compliance-gated buyer. They are not drawn from the 44-candidate pool and make no claim about it.

## Export

The Commercial Decision Desk intake proposal contract (`schemaVersion` 1) is unchanged. Accounts in the EXCLUDE tier are not offered for export.

## Tests

`node qualification.test.mjs`, `node markets.test.mjs`, `node cdd-intake-proposal.test.mjs`.

## Bring your own product and market (`own-list.js`)

The decision-maker brings a product category, a target market and up to 20 candidate companies, and answers a few plain questions about each. `qualification.js` sorts them with the same rules as the sample list; `markets.js` lists what to check for that product in that market.

- Nothing searches the web, scores, predicts, stores, uploads or sends. The list lives in memory on the page.
- Every answer can be "查無公開資料" / "Not public". An unknown answer is never read as a yes. An unknown category fit cannot reach ENGAGE_FIRST (raised to VERIFY_FIRST in `own-list.js`; the shared rules are unchanged).
- The angle worksheet (supplier change, personnel change, bundle vs product update) is a reading aid and never changes a tier.
- A category outside the seed list gets no market checks.
- Wording rules are enforced by `own-list.test.mjs`: no UNKNOWN, PASS, HOLD or WHY NOT in the copy, no reply or conversion numbers, no mention of third-party list tools.

Tests: `node own-list.test.mjs`.

### The take-away list brief (`own-brief.js`)

The same mode ends with a one-page brief built from what the decision-maker entered: product and market, summary counts, each company with its tier, reasons, angle and next step, what to check in the market, what to do before reaching out, and what the brief does not mean. It can be printed or saved as PDF (only the brief prints) or downloaded as Markdown.

- Pure functions, no network, no storage, no clock (the page passes the date in). The tiers come from `own-list.js`, so the brief cannot disagree with the page.
- It states no reply rate, no order number and no score; a tier is a reading order. The payment-risk line stays "a preliminary check, not a credit report".
- A company name cannot break the Markdown table. A category outside the seed list gets no market checks.

Tests: `node own-brief.test.mjs`.
