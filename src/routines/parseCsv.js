export function parseCSVFlexible(csv) {
  const text = String(csv || "");
  if (!text.trim()) return [];
  const rows = [];
  let cur = "",
    row = [],
    inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ",") {
        row.push(cur);
        cur = "";
      } else if (ch === "\n") {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      } else if (ch === "\r") {
        /* ignore */
      } else cur += ch;
    }
  }
  row.push(cur);
  rows.push(row);
  const nonEmpty = rows.filter((r) => r.some((c) => String(c).trim() !== ""));
  if (!nonEmpty.length) return [];

  const header = nonEmpty[0].map((h) => String(h).trim());
  const looksHeader = isNaN(parseInt(header[0], 10));
  const norm = (s) => String(s).trim().toLowerCase();

  let idx = { week: 0, day: 1, focus: 2, exercise: 3, target: 4, sets: 5, notes: -1 };
  let start = 0;
  if (looksHeader) {
    start = 1;
    const H = header.map(norm);
    const find = (...names) =>
      names
        .map(norm)
        .map((n) => H.indexOf(n))
        .find((i) => i >= 0);
    idx.week = find("week");
    idx.day = find("day");
    idx.focus = find("focus");
    idx.exercise = find("exercise");
    idx.target = find("target reps", "target", "target reps or time");
    idx.sets = find("sets planned", "sets");
    idx.notes = find("notes", "note");
  }

  const out = [];
  for (let r = start; r < nonEmpty.length; r++) {
    const c = nonEmpty[r];
    const w = parseInt(c[idx.week] ?? "", 10);
    const d = parseInt(c[idx.day] ?? "", 10);
    if (!Number.isFinite(w) || !Number.isFinite(d)) continue;
    const focus = String(c[idx.focus] ?? "").trim();
    const exercise = String(c[idx.exercise] ?? "").trim();
    if (!exercise) continue;
    const target = String(c[idx.target] ?? "").trim();
    const sets = parseInt(String(c[idx.sets] ?? "0"), 10) || 0;
    const notesVal = idx.notes >= 0 ? String(c[idx.notes] ?? "").trim() : "";
    const rowObj = { week: w, day: d, focus, exercise, target, sets };
    if (notesVal) rowObj.notes = notesVal;
    rowObj.isRoutine = /routine/i.test(target) || /stretch-it/i.test(exercise);
    out.push(rowObj);
  }
  return out;
}

export function refineRow(x) {
  const r = { ...x };
  if (typeof r.isRoutine !== "boolean") {
    r.isRoutine = /routine/i.test(String(r.target || "")) || /stretch-it/i.test(String(r.exercise || ""));
  }
  return r;
}
