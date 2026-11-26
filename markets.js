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
  JP: {
    name: { zh: "日本", en: "Japan" },
    region: "east-asia",
    currency: "JPY",
    checks: {
      flooring: [
        // Ministry of Land, Infrastructure, Transport and Tourism (MLIT), public building renovation specification §6.8: https://www.mlit.go.jp/gobuild/content/001888823.pdf
        { zh: "公共建築翻修用的塑膠地板：依產品構造與工程規格確認是否適用 JIS A 5705。", en: "For vinyl flooring in public building renovations, check whether JIS A 5705 fits the product construction and project specification." },
        // Ministry of Agriculture, Forestry and Fisheries (MAFF), JAS catalogue, forestry products item 8: https://www.maff.go.jp/j/jas/jas_standard/index.html
        // MAFF Standards Council minutes, flooring scope discussion: https://www.maff.go.jp/j/jas/kaigi/20240716_gijiroku.html
        { zh: "木質地板：依基材與構造確認是否符合 JAS 1073 的適用範圍。", en: "For wood-based flooring, check whether the core and construction fall within the scope of JAS 1073." },
      ],
      wallcoverings: [
        // MLIT, public building renovation specification §6.14: https://www.mlit.go.jp/gobuild/content/001888823.pdf
        { zh: "公共建築翻修用的壁紙：依工程規格確認所需的防火等級及適用底材。", en: "For wallpaper in public building renovations, check the specified fire classification and suitable substrates." },
      ],
      windowTreatments: [
        // Consumer Affairs Agency (CAA), curtain labeling guide: https://www.caa.go.jp/policies/policy/representation/household_goods/guide/fiber/fiber_25.html
        { zh: "成品布簾：依產品型態確認纖維成分及洗護標示。", en: "For finished fabric curtains, check which fibre composition and care labels apply to the product." },
      ],
    },
    // Japan External Trade Organization (JETRO), import terms §III.1: https://www.jetro.go.jp/world/qa/04A-011203.html
    payment: {
      zh: "向買方確認採電匯或信用狀，並在報價前談妥付款時點。",
      en: "Confirm with the buyer whether to use a bank transfer or a letter of credit, and agree on payment timing before quoting.",
    },
    // Japan Customs, Trade Remedy System: https://www.customs.go.jp/english/traderemedy/index.htm
    // Ministry of Finance, anti-dumping notices: https://www.mof.go.jp/english/policy/customs_tariff/traderemedy/anti-dumping-duty.htm
    remedyWatch: {
      zh: "查日本海關的反傾銷及平衡措施資料，依產品、HS 編碼、原產地與出貨年份確認適用範圍。",
      en: "Check Japan Customs for anti-dumping and countervailing measures, then verify coverage by product, HS code, origin and shipment year.",
    },
  },
  KR: {
    name: { zh: "韓國", en: "South Korea" },
    region: "east-asia",
    currency: "KRW",
    checks: {
      flooring: [
        // Korea Ministry of Government Legislation, Indoor Air Quality Control Act Art. 11 and Enforcement Rule Annex 5:
        // https://www.law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1032875593
        // https://www.law.go.kr/LSW/flDownload.do?bylClsCd=110201&flSeq=156771385
        { zh: "依地板材質及安裝場所，確認是否需要甲醛及總揮發性有機化合物的排放檢測資料。", en: "Check whether the flooring material and installation site call for test data on formaldehyde and total volatile organic compound emissions." },
      ],
      wallcoverings: [
        // Korea Ministry of Government Legislation, Indoor Air Quality Control Act Art. 11: https://www.law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1032875593
        // Korea Ministry of Government Legislation, Indoor Air Quality Control Act Art. 11-6: https://www.law.go.kr/LSW/LsiJoLinkP.do?docType=JO&joNo=001106000&languageType=KO&lsNm=%EC%8B%A4%EB%82%B4%EA%B3%B5%EA%B8%B0%EC%A7%88%20%EA%B4%80%EB%A6%AC%EB%B2%95
        { zh: "依壁紙類型及安裝場所，確認是否需要室內空氣污染物排放的查驗證明及標示。", en: "Check whether the wallpaper type and installation site call for emissions verification and a corresponding label." },
      ],
      windowTreatments: [
        // Korea Ministry of Government Legislation, Fire Facilities Act Enforcement Decree Art. 31: https://www.law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1030672451
        // Korea National Fire Agency, Flame Retardancy Performance Standards Art. 3, via the National Law Information Center: https://www.law.go.kr/admRulInfoP.do?admRulSeq=2100000269722
        { zh: "依場所用途及窗簾或百葉簾類型，確認是否需要阻燃性能檢測資料。", en: "Check whether the building use and curtain or blind type call for flame-retardancy test evidence." },
      ],
    },
    // Korea Trade Insurance Corporation (K-SURE), import insurance FAQ: https://www.ksure.or.kr/rh-kr/bbs/i-382/list.do?pageIndex=2&pageItm=10&searchCl1=6&searchCondition=
    payment: {
      zh: "請買方確認採信用狀或電匯，並釐清電匯安排在出貨前還是出貨後。",
      en: "Ask whether the buyer will use a letter of credit or a bank transfer. For a transfer, confirm whether payment is due before or after shipment.",
    },
    // Korea Trade Commission, anti-dumping investigation register: https://www.ktc.go.kr/searchList.do?searchCondition=S
    remedyWatch: {
      zh: "追蹤韓國貿易委員會的反傾銷調查及結果，依產品、HS 編碼、原產地與出貨年份確認是否相關。",
      en: "Track Korea Trade Commission anti-dumping investigations and outcomes, and check their relevance by product, HS code, origin and shipment year.",
    },
  },
  PH: {
    name: { zh: "菲律賓", en: "Philippines" },
    region: "southeast-asia",
    currency: "PHP",
    checks: {
      flooring: [
        // Department of Trade and Industry, Bureau of Philippine Standards, ceramic tiles mandatory certification guidance: https://bps.dti.gov.ph/press-releases/28-2021/264-ceramic-tiles-relisted-under-dti-bps-mandatory-products
        { zh: "若是陶瓷磚，依製造方式及產品用途確認 BPS 認證、產品標記與進口文件要求。", en: "For ceramic tiles, check the BPS certification, product markings and import documents for the manufacturing method and intended use." },
      ],
      wallcoverings: [],
      windowTreatments: [],
    },
    payment: PAYMENT_ESTABLISHED,
    remedyWatch: REMEDY,
  },
  ID: {
    name: { zh: "印尼", en: "Indonesia" },
    region: "southeast-asia",
    currency: "IDR",
    checks: {
      flooring: [
        // Ministry of Trade, Directorate General of Foreign Trade, import approval FAQ for textiles, carpets and other textile floor coverings: https://ditjendaglu.kemendag.go.id/faq
        { zh: "若是地毯或其他紡織地板，依產品分類確認是否需要進口核准及相關申請資料。", en: "For carpets or other textile floor coverings, check whether the product classification calls for import approval and supporting application documents." },
      ],
      wallcoverings: [],
      windowTreatments: [],
    },
    payment: PAYMENT_ESTABLISHED,
    remedyWatch: REMEDY,
  },
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
  "east-asia": { zh: "東亞", en: "East Asia" },
  "southeast-asia": { zh: "東南亞", en: "Southeast Asia" },
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
