/**
 * URL Router for deep linking
 * Handles hash-based routing for shareable links to specific weeks/days/routines
 */

import { stateManager } from "./stateManager.js";

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    
    // Listen to hash changes
    window.addEventListener("hashchange", () => this.handleRouteChange());
    window.addEventListener("load", () => this.handleRouteChange());
  }

  /**
   * Parse hash into route params
   * Format: #/routine/:routineId/week/:week/day/:day
   * Example: #/routine/user_123/week/2/day/3
   */
  parseHash() {
    const hash = window.location.hash.slice(1); // Remove #
    if (!hash || hash === "/") {
      return null;
    }

    const params = {};
    const parts = hash.split("/").filter(Boolean);

    for (let i = 0; i < parts.length; i += 2) {
      const key = parts[i];
      const value = parts[i + 1];
      if (key && value) {
        params[key] = value;
      }
    }

    return params;
  }

  /**
   * Build hash from current state
   * @param {Object} options - Route parameters
   * @returns {string} Hash string
   */
  buildHash({ routine, week, day }) {
    const parts = [];
    if (routine) {
      parts.push("routine", routine);
    }
    if (week) {
      parts.push("week", week);
    }
    if (day) {
      parts.push("day", day);
    }
    return parts.length > 0 ? `#/${parts.join("/")}` : "";
  }

  /**
   * Update URL without triggering navigation
   * @param {Object} params - Route parameters
   */
  updateURL(params) {
    const hash = this.buildHash(params);
    if (window.location.hash !== hash) {
      // Use replaceState to avoid adding to history
      window.history.replaceState(null, "", hash || window.location.pathname);
    }
  }

  /**
   * Navigate to a specific route
   * @param {Object} params - Route parameters
   */
  navigate(params) {
    const hash = this.buildHash(params);
    window.location.hash = hash;
  }

  /**
   * Handle route changes from URL
   */
  handleRouteChange() {
    const params = this.parseHash();
    
    if (!params) {
      // No hash, keep current state
      return;
    }

    const updates = {};
    let hasUpdates = false;

    // Parse and validate route parameters
    if (params.routine) {
      updates.routine = params.routine;
      hasUpdates = true;
    }

    if (params.week) {
      const week = parseInt(params.week, 10);
      if (!isNaN(week) && week > 0) {
        updates.week = week;
        hasUpdates = true;
      }
    }

    if (params.day) {
      const day = parseInt(params.day, 10);
      if (!isNaN(day) && day > 0 && day <= 7) {
        updates.day = day;
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      // Update state via state manager
      stateManager.updateView(updates);
      
      // Emit route change event
      window.dispatchEvent(new CustomEvent("route:changed", { 
        detail: updates 
      }));
    }

    this.currentRoute = params;
  }

  /**
   * Get current route parameters
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * Sync URL with current view state
   */
  syncWithState() {
    const view = stateManager.getView();
    this.updateURL({
      routine: view.routine,
      week: view.week,
      day: view.day
    });
  }
}

// Export singleton instance
export const router = new Router();

// Subscribe to view changes to keep URL in sync
stateManager.subscribe('view', () => {
  router.syncWithState();
});
