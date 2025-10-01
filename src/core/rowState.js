import { store } from "./storage.js";
import { stateManager } from "./stateManager.js";
import { currentRoutine, rowKey, rowKeyOrdinal, legacyRowKey } from "../routines/index.js";
import { ensureRowIdsForRoutine } from "../routines/ids.js";

export function readRowState(r) {
  return store[rowKey(r)] || store[rowKeyOrdinal(r)] || store[legacyRowKey(r)] || null;
}

export function ensureRowState(row, sets) {
  if (!row.rowId && currentRoutine()) ensureRowIdsForRoutine(currentRoutine());
  const kNew = rowKey(row);
  const kOldOrd = rowKeyOrdinal(row);
  const kOld = legacyRowKey(row);

  if (!store[kNew]) {
    if (store[kOldOrd]) {
      store[kNew] = store[kOldOrd];
      delete store[kOldOrd];
    } else if (store[kOld]) {
      store[kNew] = store[kOld];
      delete store[kOld];
    } else {
      store[kNew] = {
        completed: false,
        reps: Array(sets).fill(""),
        diff: Array(sets).fill(""),
        wts: Array(sets).fill(""),
      };
    }
  }
  const st = store[kNew];
  if (st.reps.length !== sets) st.reps = st.reps.concat(Array(sets).fill("")).slice(0, sets);
  if (st.diff.length !== sets) st.diff = st.diff.concat(Array(sets).fill("")).slice(0, sets);
  if (st.wts.length !== sets) st.wts = st.wts.concat(Array(sets).fill("")).slice(0, sets);
  stateManager.updateStore({ ...store });
  return st;
}

export function getRowViewState(row, sets) {
  const s = readRowState(row);
  const pad = (arr) => (arr || []).concat(Array(sets).fill("")).slice(0, sets);
  return { completed: !!(s && s.completed), reps: pad(s?.reps), diff: pad(s?.diff), wts: pad(s?.wts) };
}
