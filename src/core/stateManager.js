/**
 * Central state management with pub/sub pattern
 * Provides a single source of truth for application state with change notifications
 */

import { store, view, userRoutines, ensureViewNumbers } from "./storage.js";
import { STORE_KEY, VIEW_KEY, USER_ROUTINES_KEY } from "./constants.js";

// User-specific storage keys helper
function getUserKey(baseKey) {
  const CURRENT_USER_KEY = "workout_current_user";
  try {
    const currentUser = localStorage.getItem(CURRENT_USER_KEY);
    return currentUser ? `${baseKey}_${currentUser}` : baseKey;
  } catch {
    return baseKey;
  }
}

class StateManager {
  constructor() {
    this.subscribers = new Map();
    this.state = {
      store,
      view,
      userRoutines
    };
    this._saveTask = null;
    this._needs = { store: false, view: false, userRoutines: false };
    
    // Set up save hooks
    this._setupSaveHooks();
  }
  
  _setupSaveHooks() {
    const flush = () => this._flush();
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
  }
  
  _flush() {
    if (this._needs.store) {
      localStorage.setItem(getUserKey(STORE_KEY), JSON.stringify(this.state.store));
      this._needs.store = false;
    }
    if (this._needs.view) {
      localStorage.setItem(getUserKey(VIEW_KEY), JSON.stringify(this.state.view));
      this._needs.view = false;
    }
    if (this._needs.userRoutines) {
      localStorage.setItem(getUserKey(USER_ROUTINES_KEY), JSON.stringify(this.state.userRoutines));
      this._needs.userRoutines = false;
    }
    this._saveTask = null;
  }
  
  _queueSave() {
    if (this._saveTask) return;
    const run = () => this._flush();
    if (typeof requestIdleCallback === "function") {
      this._saveTask = requestIdleCallback(run, { timeout: 200 });
    } else {
      this._saveTask = setTimeout(run, 60);
    }
  }

  /**
   * Subscribe to state changes
   * @param {string} key - State key to watch (e.g., 'view', 'store', 'userRoutines')
   * @param {Function} callback - Called when state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);
    
    return () => {
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.delete(callback);
      }
    };
  }

  /**
   * Notify all subscribers of a state change
   * @param {string} key - State key that changed
   */
  notify(key) {
    const subs = this.subscribers.get(key);
    if (subs) {
      subs.forEach(callback => callback(this.state[key]));
    }
    // Notify wildcard subscribers
    const allSubs = this.subscribers.get('*');
    if (allSubs) {
      allSubs.forEach(callback => callback(key, this.state[key]));
    }
  }

  /**
   * Update view state
   * @param {Object} updates - Properties to update in view
   */
  updateView(updates) {
    Object.assign(this.state.view, updates);
    ensureViewNumbers();
    this._needs.view = true;
    this._queueSave();
    this.notify('view');
  }

  /**
   * Update store state
   * @param {Object} updates - Properties to update in store
   */
  updateStore(updates) {
    Object.assign(this.state.store, updates);
    this._needs.store = true;
    this._queueSave();
    this.notify('store');
  }

  /**
   * Update user routines
   * @param {Object} updates - Routines to add/update
   */
  updateUserRoutines(updates) {
    Object.assign(this.state.userRoutines, updates);
    this._needs.userRoutines = true;
    this._queueSave();
    this.notify('userRoutines');
  }

  /**
   * Delete from store
   * @param {string[]} keys - Keys to delete
   */
  deleteFromStore(keys) {
    keys.forEach(key => delete this.state.store[key]);
    this._needs.store = true;
    this._queueSave();
    this.notify('store');
  }

  /**
   * Delete user routine
   * @param {string} id - Routine ID to delete
   */
  deleteUserRoutine(id) {
    delete this.state.userRoutines[id];
    this._needs.userRoutines = true;
    this._queueSave();
    this.notify('userRoutines');
  }

  /**
   * Get current view state
   */
  getView() {
    return this.state.view;
  }

  /**
   * Get current store state
   */
  getStore() {
    return this.state.store;
  }

  /**
   * Get current user routines
   */
  getUserRoutines() {
    return this.state.userRoutines;
  }
}

// Export singleton instance
export const stateManager = new StateManager();
