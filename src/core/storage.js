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

// Internal save management is now handled by stateManager.js
// The stateManager provides the save functions that persist to localStorage
