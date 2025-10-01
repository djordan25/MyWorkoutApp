import { ROUTINE_MANIFEST_URL } from "../core/constants.js";
import { store, view, userRoutines, saveUserRoutines } from "../core/storage.js";
import { parseCSVFlexible, refineRow } from "./parseCsv.js";
import { ensureRowIdsForRoutine, exSlug, simpleHash } from "./ids.js";
import { getExercise } from "../loaders/exerciseLoader.js";

let remoteManifest = { routines: [] }; // {id,name,src}[]
let remoteRoutinesCache = Object.create(null); // id -> {id,name,rows:[]}

export function isUserRoutineId(id) {
  return String(id || "").startsWith("user_");
}
export function getRoutineById(id) {
  return userRoutines[id] || remoteRoutinesCache[id] || null;
}

export function availableRoutineOptions() {
  // Only return user's added routines, not all remote routines from manifest
  const local = Object.values(userRoutines).map((r) => ({ value: r.id, label: r.name }));
  return local;
}

export async function loadManifest() {
  try {
    const res = await fetch(ROUTINE_MANIFEST_URL, { cache: "no-store" });
    if (res.ok) remoteManifest = await res.json();
  } catch {
    /* ignore */
  }
}

export async function ensureRoutineLoaded(id) {
  if (!id) return null;
  if (remoteRoutinesCache[id] || userRoutines[id]) return getRoutineById(id);
  const entry = (remoteManifest.routines || []).find((r) => r.id === id);
  if (!entry) return null;
  try {
    const res = await fetch(entry.src, { cache: "no-store" });
    if (!res.ok) return null;
    const def = await res.json();
    const resolved = await processRoutineDefinition(def);
    if (resolved) {
      resolved.rows = resolved.rows.map(refineRow);
      ensureRowIdsForRoutine(resolved);
      remoteRoutinesCache[id] = resolved;
      return resolved;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function processRoutineDefinition(def) {
  if (!def) return null;
  const { id, name } = def;
  
  // V2 Format: workouts array with exercise IDs
  if (def.version === '2.0.0' && Array.isArray(def.workouts)) {
    return processRoutineV2(def);
  }
  
  // V1 Formats (existing logic)
  if (Array.isArray(def.rows)) return { id, name, rows: def.rows.map(refineRow) };
  if (typeof def.rowsCsv === "string") return { id, name, rows: parseCSVFlexible(def.rowsCsv).map(refineRow) };
  if (typeof def.rowsCsvUrl === "string") {
    try {
      const res = await fetch(def.rowsCsvUrl, { cache: "no-store" });
      if (res.ok) {
        const csv = await res.text();
        return { id, name, rows: parseCSVFlexible(csv).map(refineRow) };
      }
    } catch {
      /* ignore */
    }
  }
  if (def.derive && def.derive.from) {
    const base = await ensureRoutineLoaded(def.derive.from);
    if (!base) return null;
    const mode = def.derive.mode || "mapTargets";
    if (mode === "mapTargets" && def.derive.map) {
      const map = def.derive.map;
      const rows = base.rows.map((r) => {
        const t = (r.target || "").trim();
        const newT = t in map ? map[t] : t;
        return refineRow({ ...r, target: newT });
      });
      return { id, name, rows };
    }
  }
  return null;
}

/**
 * Process V2 routine format (exercise IDs + workouts)
 */
function processRoutineV2(def) {
  const { id, name, workouts } = def;
  const rows = [];
  
  workouts.forEach(workout => {
    const { week, day, focus, exercises } = workout;
    
    exercises.forEach(ex => {
      const { exerciseId, order, sets, targetReps } = ex;
      
      // Resolve exercise from library
      const exercise = getExercise(exerciseId);
      if (!exercise) {
        console.warn(`Exercise not found: ${exerciseId}`);
        return;
      }
      
      // Check if this is a "routine" type exercise (no reps/weight tracking)
      const isRoutine = exercise.type === 'routine';
      
      // Convert to row format expected by app
      const row = {
        week,
        day,
        focus: focus || '',
        exercise: exercise.name,
        target: targetReps || '',
        sets: sets || 1,
        ord: order,
        isRoutine: isRoutine || undefined
      };
      
      rows.push(refineRow(row));
    });
  });
  
  return { id, name, rows };
}

export function currentRoutine() {
  return getRoutineById(view.routine);
}

export function rowsFor(w, d) {
  const cur = currentRoutine();
  return cur ? cur.rows.filter((r) => r.week === w && r.day === d) : [];
}
export function allWeeks() {
  const cur = currentRoutine();
  return cur ? [...new Set(cur.rows.map((r) => r.week))].sort((a, b) => a - b) : [];
}

export function keyPrefix() {
  return currentRoutine() ? `rt_${currentRoutine().id}` : "rt_none";
}
export function rowKeyOrdinal(r) {
  const ord = Number.isFinite(r.ord) ? r.ord : rowsFor(r.week, r.day).indexOf(r);
  const slug = exSlug(r.exercise);
  return `${keyPrefix()}_w${r.week}_d${r.day}_o${Math.max(0, ord)}_${slug}`;
}
export function legacyRowKey(r) {
  return `${keyPrefix()}_w${r.week}_d${r.day}_` + exSlug(r.exercise);
}
export function rowKey(r) {
  if (r && typeof r.rowId === "string" && r.rowId) return `${keyPrefix()}_id_${r.rowId}`;
  return rowKeyOrdinal(r);
}

export function dateKey(w, d) {
  return `${keyPrefix()}_w${w}_d${d}`;
}
