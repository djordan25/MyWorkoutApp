/**
 * Central state management with pub/sub pattern
 * Provides a single source of truth for application state with change notifications
 */

import { store, view, userRoutines, saveStore, saveView, saveUserRoutines } from "./storage.js";

class StateManager {
  constructor() {
    this.subscribers = new Map();
    this.state = {
      store,
      view,
      userRoutines
    };
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
    saveView();
    this.notify('view');
  }

  /**
   * Update store state
   * @param {Object} updates - Properties to update in store
   */
  updateStore(updates) {
    Object.assign(this.state.store, updates);
    saveStore();
    this.notify('store');
  }

  /**
   * Update user routines
   * @param {Object} updates - Routines to add/update
   */
  updateUserRoutines(updates) {
    Object.assign(this.state.userRoutines, updates);
    saveUserRoutines();
    this.notify('userRoutines');
  }

  /**
   * Delete from store
   * @param {string[]} keys - Keys to delete
   */
  deleteFromStore(keys) {
    keys.forEach(key => delete this.state.store[key]);
    saveStore();
    this.notify('store');
  }

  /**
   * Delete user routine
   * @param {string} id - Routine ID to delete
   */
  deleteUserRoutine(id) {
    delete this.state.userRoutines[id];
    saveUserRoutines();
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
