// category-map.js — product vocabulary for the seed categories: the keys the market data is
// organised by, and a deliberately simple, visible keyword map from a free-text category to
// those keys. This is industry knowledge, so it lives apart from the market data and the
// method. Swap this file (and the market data) to qualify buyers for other products.

// Seed categories the demo qualifies buyers for.
export const CATEGORY_KEYS = ["flooring", "wallcoverings", "windowTreatments"];

// Which seed category keys a free-text record category touches. Deliberately simple
// and visible; a record can touch several, or none (an adjacent category).
export function categoryKeysFor(category = "") {
  const text = String(category).toLowerCase();
  const keys = [];
  if (/floor|spc|lvt|tile|stone/.test(text)) keys.push("flooring");
  if (/wallcover|wallpaper/.test(text)) keys.push("wallcoverings");
  if (/window|drap|curtain|fabric|textile/.test(text)) keys.push("windowTreatments");
  return keys;
}
