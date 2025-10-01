/**
 * Centralized State Actions
 * All state mutations go through these actions for consistency
 */

import { store, view, userRoutines } from './storage.js';
import { stateManager } from './stateManager.js';
import { ensureRowState } from './rowState.js';

/**
 * Action result type
 * @typedef {{success: boolean, error?: string, data?: any}} ActionResult
 */

/**
 * Updates a set's data for a specific exercise
 * @param {object} row - Exercise row
 * @param {number} setIndex - Set index (0-based)
 * @param {object} data - Data to update {wts?, reps?, diff?}
 * @returns {ActionResult}
 */
export function updateSet(row, setIndex, data) {
  try {
    const state = ensureRowState(row, row.sets);
    
    if (data.wts !== undefined) {
      state.wts[setIndex] = data.wts;
    }
    if (data.reps !== undefined) {
      state.reps[setIndex] = data.reps;
    }
    if (data.diff !== undefined) {
      state.diff[setIndex] = data.diff;
    }
    
    stateManager.updateStore({ ...store });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update set:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Toggles completion status of an exercise
 * @param {object} row - Exercise row
 * @returns {ActionResult}
 */
export function toggleExerciseCompletion(row) {
  try {
    const state = ensureRowState(row, row.sets);
    state.completed = !state.completed;
    
    stateManager.updateStore({ ...store });
    
    // Dispatch event for UI updates
    document.dispatchEvent(new CustomEvent('workout:updated', {
      detail: { row, completed: state.completed }
    }));
    
    return { success: true, data: { completed: state.completed } };
  } catch (error) {
    console.error('Failed to toggle completion:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Updates current view (routine, week, day)
 * @param {object} updates - {routine?, week?, day?}
 * @returns {ActionResult}
 */
export function updateView(updates) {
  try {
    if (updates.routine !== undefined) {
      view.routine = updates.routine;
    }
    if (updates.week !== undefined) {
      view.week = Number(updates.week) || 1;
    }
    if (updates.day !== undefined) {
      view.day = Number(updates.day) || 1;
    }
    
    stateManager.updateView({ ...view });
    
    // Dispatch event for UI updates
    document.dispatchEvent(new CustomEvent('view:changed', {
      detail: { ...view }
    }));
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update view:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Adds a new routine
 * @param {object} routine - Routine object
 * @returns {ActionResult}
 */
export function addRoutine(routine) {
  try {
    if (!routine.id) {
      throw new Error('Routine must have an ID');
    }
    
    if (userRoutines[routine.id]) {
      throw new Error(`Routine with ID ${routine.id} already exists`);
    }
    
    userRoutines[routine.id] = routine;
    stateManager.updateUserRoutines({ ...userRoutines });
    
    // Dispatch event
    document.dispatchEvent(new CustomEvent('routines:changed', {
      detail: { action: 'add', routine }
    }));
    
    return { success: true, data: { routineId: routine.id } };
  } catch (error) {
    console.error('Failed to add routine:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Updates an existing routine
 * @param {string} routineId - Routine ID
 * @param {object} updates - Partial routine updates
 * @returns {ActionResult}
 */
export function updateRoutine(routineId, updates) {
  try {
    if (!userRoutines[routineId]) {
      throw new Error(`Routine ${routineId} not found`);
    }
    
    Object.assign(userRoutines[routineId], updates);
    stateManager.updateUserRoutines({ ...userRoutines });
    
    // Dispatch event
    document.dispatchEvent(new CustomEvent('routines:changed', {
      detail: { action: 'update', routineId, updates }
    }));
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update routine:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Removes a routine
 * @param {string} routineId - Routine ID to remove
 * @param {boolean} switchToNext - Whether to auto-switch to next routine
 * @returns {ActionResult}
 */
export function removeRoutine(routineId, switchToNext = true) {
  try {
    if (!userRoutines[routineId]) {
      throw new Error(`Routine ${routineId} not found`);
    }
    
    const wasSelected = view.routine === routineId;
    delete userRoutines[routineId];
    stateManager.updateUserRoutines({ ...userRoutines });
    
    // Auto-switch if needed
    if (wasSelected && switchToNext) {
      const remainingRoutines = Object.keys(userRoutines);
      if (remainingRoutines.length > 0) {
        updateView({
          routine: remainingRoutines[0],
          week: 1,
          day: 1
        });
      } else {
        view.routine = null;
        stateManager.updateView({ ...view });
      }
    }
    
    // Dispatch event
    document.dispatchEvent(new CustomEvent('routines:changed', {
      detail: { action: 'remove', routineId }
    }));
    
    return { success: true };
  } catch (error) {
    console.error('Failed to remove routine:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clears all data for a specific day
 * @param {number} week - Week number
 * @param {number} day - Day number
 * @returns {ActionResult}
 */
export function clearDay(week, day) {
  try {
    // Import needed function dynamically to avoid circular deps
    import('../routines/index.js').then(({ rowsFor, rowKey, rowKeyOrdinal, legacyRowKey }) => {
      const rows = rowsFor(week, day);
      
      rows.forEach(row => {
        delete store[rowKey?.(row) ?? ''];
        delete store[rowKeyOrdinal?.(row) ?? ''];
        delete store[legacyRowKey?.(row) ?? ''];
      });
      
      if (store.__dates) {
        const dateKey = `w${week}d${day}`;
        delete store.__dates[dateKey];
      }
      
      stateManager.updateStore({ ...store });
      
      // Dispatch event
      document.dispatchEvent(new CustomEvent('workout:cleared', {
        detail: { week, day }
      }));
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to clear day:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clears all workout data
 * @returns {ActionResult}
 */
export function clearAllData() {
  try {
    const keys = Object.keys(store);
    keys.forEach(key => delete store[key]);
    
    stateManager.updateStore({ ...store });
    
    // Dispatch event
    document.dispatchEvent(new CustomEvent('data:cleared'));
    
    return { success: true };
  } catch (error) {
    console.error('Failed to clear all data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Updates app title
 * @param {string} title - New title
 * @returns {ActionResult}
 */
export function updateAppTitle(title) {
  try {
    store.__title = title.trim();
    stateManager.updateStore({ ...store });
    
    // Dispatch event
    document.dispatchEvent(new CustomEvent('title:changed', {
      detail: { title: store.__title }
    }));
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update title:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sets video URL for an exercise
 * @param {string} exerciseName - Exercise name
 * @param {string} url - Video URL
 * @returns {ActionResult}
 */
export function setExerciseVideo(exerciseName, url) {
  try {
    if (!store.__exerciseVideos) {
      store.__exerciseVideos = {};
    }
    
    store.__exerciseVideos[exerciseName] = url.trim();
    stateManager.updateStore({ ...store });
    
    // Dispatch event
    document.dispatchEvent(new CustomEvent('video:updated', {
      detail: { exerciseName, url }
    }));
    
    return { success: true };
  } catch (error) {
    console.error('Failed to set video:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Batch import data (from JSON export)
 * @param {object} data - Exported data object
 * @returns {ActionResult}
 */
export function importData(data) {
  try {
    const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
    
    // Import store
    if (isObj(data.store)) {
      Object.assign(store, data.store);
      stateManager.updateStore({ ...store });
    }
    
    // Import routines
    if (isObj(data.userRoutines) || isObj(data.routines)) {
      const routines = data.userRoutines || data.routines;
      Object.keys(userRoutines).forEach(k => delete userRoutines[k]);
      Object.assign(userRoutines, routines);
      stateManager.updateUserRoutines({ ...userRoutines });
    }
    
    // Import view
    if (isObj(data.view)) {
      Object.assign(view, data.view);
      stateManager.updateView({ ...view });
    }
    
    // Import title
    if (data.title) {
      store.__title = String(data.title);
      stateManager.updateStore({ ...store });
    }
    
    // Dispatch event
    document.dispatchEvent(new CustomEvent('data:imported'));
    
    return { success: true };
  } catch (error) {
    console.error('Failed to import data:', error);
    return { success: false, error: error.message };
  }
}
