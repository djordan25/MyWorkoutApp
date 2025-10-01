export function exSlug(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
export function simpleHash(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(36);
}
export function ensureRowIdsForRoutine(rt) {
  if (!rt || !Array.isArray(rt.rows)) return;
  const counts = new Map();
  for (const row of rt.rows) {
    if (typeof row.rowId === "string" && row.rowId) continue;
    const key = `${row.week}|${row.day}|${exSlug(row.exercise)}|${String(row.target).trim()}|${row.sets}`;
    const n = (counts.get(key) || 0) + 1;
    counts.set(key, n);
    row.rowId = simpleHash(`${rt.id}|${key}|${n}`);
  }
}
