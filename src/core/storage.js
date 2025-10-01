import { STORE_KEY, VIEW_KEY, USER_ROUTINES_KEY } from "./constants.js";

// User management
const CURRENT_USER_KEY = "workout_current_user";
const USERS = ["Joe", "hala"]; // Hardcoded users

export let currentUser = (() => {
  try {
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    return saved && USERS.includes(saved) ? saved : null;
  } catch {
    return null;
  }
})();

export function setCurrentUser(username) {
  if (!USERS.includes(username)) throw new Error("Invalid user");
  currentUser = username;
  localStorage.setItem(CURRENT_USER_KEY, username);
  // Reload user-specific data
  loadUserData();
}

export function clearCurrentUser() {
  currentUser = null;
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getAvailableUsers() {
  return [...USERS];
}

// User-specific storage keys
function getUserStoreKey() {
  return currentUser ? `${STORE_KEY}_${currentUser}` : STORE_KEY;
}

function getUserViewKey() {
  return currentUser ? `${VIEW_KEY}_${currentUser}` : VIEW_KEY;
}

function getUserRoutinesKey() {
  return currentUser ? `${USER_ROUTINES_KEY}_${currentUser}` : USER_ROUTINES_KEY;
}

// Load user-specific data
function loadUserData() {
  try {
    store = JSON.parse(localStorage.getItem(getUserStoreKey())) || {};
  } catch {
    store = {};
  }
  try {
    view = JSON.parse(localStorage.getItem(getUserViewKey())) || {};
  } catch {
    view = {};
  }
  try {
    userRoutines = JSON.parse(localStorage.getItem(getUserRoutinesKey()) || "{}");
  } catch {
    userRoutines = {};
  }
}

export let store = (() => {
  try {
    return JSON.parse(localStorage.getItem(getUserStoreKey())) || {};
  } catch {
    return {};
  }
})();
export let view = (() => {
  try {
    return JSON.parse(localStorage.getItem(getUserViewKey())) || {};
  } catch {
    return {};
  }
})();
export let userRoutines = (() => {
  try {
    return JSON.parse(localStorage.getItem(getUserRoutinesKey()) || "{}");
  } catch {
    return {};
  }
})();

export function ensureViewNumbers() {
  view.week = Number(view.week) || 1;
  view.day = Number(view.day) || 1;
}

let _saveTask = null;
const _needs = { store: false, view: false, userRoutines: false };

function _flush() {
  if (_needs.store) {
    localStorage.setItem(getUserStoreKey(), JSON.stringify(store));
    _needs.store = false;
  }
  if (_needs.view) {
    localStorage.setItem(getUserViewKey(), JSON.stringify(view));
    _needs.view = false;
  }
  if (_needs.userRoutines) {
    localStorage.setItem(getUserRoutinesKey(), JSON.stringify(userRoutines));
    _needs.userRoutines = false;
  }
  _saveTask = null;
}
function queueSave() {
  if (_saveTask) return;
  const run = _flush;
  if (typeof requestIdleCallback === "function") _saveTask = requestIdleCallback(run, { timeout: 200 });
  else _saveTask = setTimeout(run, 60);
}

/**
 * @deprecated Use stateManager.updateStore() instead
 * This function is kept for backward compatibility but will be removed in a future version
 */
export function saveStore() {
  console.warn('saveStore() is deprecated. Use stateManager.updateStore() instead.');
  _needs.store = true;
  queueSave();
}

/**
 * @deprecated Use stateManager.updateView() instead
 * This function is kept for backward compatibility but will be removed in a future version
 */
export function saveView() {
  console.warn('saveView() is deprecated. Use stateManager.updateView() instead.');
  ensureViewNumbers();
  _needs.view = true;
  queueSave();
}

/**
 * @deprecated Use stateManager.updateUserRoutines() instead
 * This function is kept for backward compatibility but will be removed in a future version
 */
export function saveUserRoutines() {
  console.warn('saveUserRoutines() is deprecated. Use stateManager.updateUserRoutines() instead.');
  _needs.userRoutines = true;
  queueSave();
}

(function addUnloadSaveHooks() {
  const flush = () => _flush();
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", flush);
  window.addEventListener("beforeunload", flush);
})();
