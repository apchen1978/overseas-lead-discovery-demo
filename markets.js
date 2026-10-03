/**
 * markets.js — market layer for the Lead Discovery demo.
 *
 * DOMAIN LEARNING, NOT VERIFIED FACT. Each entry lists the KINDS of checks a seller
 * usually has to clear before quoting into a market, and general payment practice.
 * It states no duty rate, no current legal status and no guarantee that a rule still
 * applies; every item must be verified for the exact product, HS code, origin and
 * year before it is relied on. The market layer never changes a fit signal or a
 * tier by itself: it tells the reader what still has to be checked.
 *
 * Company names in records.js are fictional; the country on a record is a
 * REPRESENTATIVE label for the archetype and does not identify a real company.
 */

export const MARKET_BASIS = "DOMAIN_LEARNING";

const EU_CHECKS = {
  flooring: [
    { zh: "建築產品法規（CPR）下的 CE 標示與性能聲明（彈性地板適用的調和標準）", en: "CE marking and declaration of performance under the Construction Products Regulation (harmonised standard for resilient floor coverings)" },
    { zh: "REACH 對部分塑化劑（鄰苯二甲酸酯）與其他物質的限制", en: "REACH restrictions on certain plasticisers (phthalates) and other substances in vinyl" },
    { zh: "各國室內空氣排放標示（例如法國 A+、德國 AgBB 體系）", en: "National indoor-air emission labelling (for example the French A+ class, the German AgBB scheme)" },
  ],
  wallcoverings: [
    { zh: "工程專案常要求的室內裝修材料防火等級（EN 13501-1 Euroclass）", en: "Fire classification for interior finishes that projects often require (EN 13501-1 Euroclass)" },
    { zh: "REACH 與化學品限制、依產品確認", en: "REACH and other chemical restrictions, confirmed per product" },
  ],
  windowTreatments: [
    { zh: "室內窗飾拉繩安全標準（EN 13120）", en: "Cord-safety standard for internal blinds (EN 13120)" },
    { zh: "工程與公共建築的織物防火要求（依國家與專案）", en: "Fire performance for contract textiles in public and commercial buildings (by country and project)" },
  ],
};

const PAYMENT_ESTABLISHED = {
  zh: "成熟經銷商常要求賒帳（O/A）；首單多以訂金或信用狀談，並需先做信用調查。",
  en: "Established distributors commonly ask for open account; first orders are often negotiated with a deposit or an L/C, after a credit check.",
};
const REMEDY = {
  zh: "依 HS/CN 編碼與原產地，查證是否有反傾銷或平衡稅等貿易救濟措施。",
  en: "Check by HS/CN code and origin whether anti-dumping or countervailing measures apply.",
};

export const MARKETS = {
  US: {
    name: { zh: "美國", en: "United States" },
    region: "north-america",
    currency: "USD",
    checks: {
      flooring: [
        { zh: "州級化學品揭露（例如加州 Proposition 65 警示）", en: "State chemical-disclosure rules (for example California Proposition 65 warnings)" },
        { zh: "商用地板常被要求的防火測試（例如 ASTM E648 臨界輻射通量）", en: "Fire tests commonly requested for commercial flooring (for example ASTM E648 critical radiant flux)" },
        { zh: "若產品含複合木芯：TSCA Title VI 甲醛排放規定", en: "If the product has a composite-wood core: TSCA Title VI formaldehyde emission rules" },
      ],
      wallcoverings: [
        { zh: "商用壁材常被要求的表面燃燒特性（例如 ASTM E84）", en: "Surface-burning characteristics commonly requested for commercial wallcoverings (for example ASTM E84)" },
      ],
      windowTreatments: [
        { zh: "有拉繩窗飾的 CPSC 安全規則（現成品與訂製品規定要分開確認）", en: "CPSC safety rule for corded window coverings (confirm stock and custom products separately)" },
      ],
    },
    payment: PAYMENT_ESTABLISHED,
    remedyWatch: REMEDY,
  },
  CA: {
    name: { zh: "加拿大", en: "Canada" },
    region: "north-america",
    currency: "CAD",
    checks: {
      flooring: [
        { zh: "消費品英法雙語標示要求（依產品與包裝確認）", en: "Bilingual English and French labelling requirements for consumer products (confirm by product and packaging)" },
        { zh: "各省建築與防火規範（依專案類型）", en: "Provincial building and fire requirements by project type" },
      ],
      wallcoverings: [
        { zh: "工程專案的防火與表面燃燒要求（依專案與省）", en: "Fire and surface-burning requirements for commercial projects (by project and province)" },
      ],
      windowTreatments: [
        { zh: "有拉繩窗飾產品規定（加拿大有專門法規，需逐項確認）", en: "Corded window covering regulations (Canada has dedicated rules; confirm item by item)" },
      ],
    },
    payment: PAYMENT_ESTABLISHED,
    remedyWatch: REMEDY,
  },
  GB: {
    name: { zh: "英國", en: "United Kingdom" },
    region: "europe",
    currency: "GBP",
    checks: {
      flooring: [
        { zh: "英國建築產品的 UKCA／CE 承認狀態（規則會調整，需查最新公告）", en: "UKCA and CE recognition status for construction products (rules change; check the current position)" },
        { zh: "英國 REACH 對塑化劑與其他物質的限制", en: "UK REACH restrictions on plasticisers and other substances" },
      ],
      wallcoverings: [
        { zh: "公共與商用建築的室內裝修防火要求", en: "Fire requirements for interior finishes in public and commercial buildings" },
      ],
      windowTreatments: [
        { zh: "窗簾阻燃標準（例如 BS 5867，公共與商用場所）", en: "Flame-retardancy standard for curtains and drapes (for example BS 5867, public and commercial premises)" },
        { zh: "窗飾拉繩安全（EN 13120）", en: "Cord safety for internal blinds (EN 13120)" },
      ],
    },
    payment: PAYMENT_ESTABLISHED,
    remedyWatch: REMEDY,
  },
  DE: { name: { zh: "德國", en: "Germany" }, region: "europe", currency: "EUR", checks: EU_CHECKS, payment: PAYMENT_ESTABLISHED, remedyWatch: REMEDY },
  FR: { name: { zh: "法國", en: "France" }, region: "europe", currency: "EUR", checks: EU_CHECKS, payment: PAYMENT_ESTABLISHED, remedyWatch: REMEDY },
  NL: { name: { zh: "荷蘭", en: "Netherlands" }, region: "europe", currency: "EUR", checks: EU_CHECKS, payment: PAYMENT_ESTABLISHED, remedyWatch: REMEDY },
  PL: { name: { zh: "波蘭", en: "Poland" }, region: "europe", currency: "PLN", checks: EU_CHECKS, payment: PAYMENT_ESTABLISHED, remedyWatch: REMEDY },
  AU: {
    name: { zh: "澳洲", en: "Australia" },
    region: "oceania",
    currency: "AUD",
    checks: {
      flooring: [
        { zh: "建築法規與防滑、防火要求（依專案類型）", en: "Building code, slip-resistance and fire requirements by project type" },
      ],
      wallcoverings: [
        { zh: "商用專案的防火與表面燃燒要求", en: "Fire and surface-burning requirements for commercial projects" },
      ],
      windowTreatments: [
        { zh: "有拉繩室內窗飾的強制安全標準（澳洲有專門規定）", en: "Mandatory safety standard for corded internal window coverings (Australia has a dedicated rule)" },
      ],
    },
    payment: PAYMENT_ESTABLISHED,
    remedyWatch: REMEDY,
  },
  AE: {
    name: { zh: "阿聯", en: "United Arab Emirates" },
    region: "middle-east",
    currency: "AED",
    checks: {
      flooring: [
        { zh: "進口貨的符合性認證：依 HS 編碼確認適用哪一套制度", en: "Conformity requirements for imported goods: confirm which scheme applies to the HS code" },
        { zh: "各酋長國對室內材料的專案核准與防火核准（依專案）", en: "Emirate-level project and civil-defence approvals for interior materials (by project)" },
      ],
      wallcoverings: [
        { zh: "工程專案的防火核准與材料核准", en: "Fire and material approvals for commercial projects" },
      ],
      windowTreatments: [
        { zh: "酒店與工程專案的織物防火要求（依業主與專案規格）", en: "Fabric fire requirements for hospitality and project supply (by owner and project specification)" },
      ],
    },
    payment: {
      zh: "專案供貨常見信用狀或預付款、保留款與履約保證；請確認保兌與開狀行風險。",
      en: "Project supply commonly involves L/C or advance payment, retention money and performance guarantees; confirm confirmation and issuing-bank risk.",
    },
    remedyWatch: REMEDY,
  },
  // Not a real country: an unnamed jurisdiction under comprehensive sanctions.
  SANCTIONED: {
    name: { zh: "受全面制裁的司法管轄區（未具名）", en: "Jurisdiction under comprehensive sanctions (not named)" },
    region: "restricted",
    currency: null,
    checks: { flooring: [], wallcoverings: [], windowTreatments: [] },
    payment: { zh: "不適用：合規閘門已排除。", en: "Not applicable: excluded by the compliance gate." },
    remedyWatch: { zh: "不適用。", en: "Not applicable." },
  },
};

export const REGIONS = {
  "north-america": { zh: "北美", en: "North America" },
  europe: { zh: "歐洲", en: "Europe" },
  oceania: { zh: "大洋洲", en: "Oceania" },
  "middle-east": { zh: "中東", en: "Middle East" },
  restricted: { zh: "受限制", en: "Restricted" },
};

// categoryKeys: the category keys this record touches. The CALLER works them out (see
// category-map.js); a market file holds market facts, not product vocabulary.
// markets: the market table to read; defaults to the one in this file, so a different set of
// markets can be passed in without editing anything here.
export function marketFor(record, categoryKeys = [], markets = MARKETS) {
  const code = record?.market?.country;
  const profile = markets[code];
  if (!profile) return null;
  const keys = categoryKeys;
  return {
    code,
    ...profile,
    basis: MARKET_BASIS,
    categoryKeys: keys,
    checksToVerify: keys.flatMap((key) => (profile.checks[key] || []).map((item) => ({ key, ...item }))),
  };
}
