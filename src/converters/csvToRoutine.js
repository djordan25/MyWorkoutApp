/**
 * CSV to Structured Routine Converter
 * Converts legacy CSV format to new JSON schema
 */

import { validateRoutine, legacyRowToExercise } from '../schemas/routineSchema.js';
import { parseCSVFlexible } from '../routines/parseCsv.js';

/**
 * Converts CSV string or parsed rows to structured routine format
 * @param {string|Array} input - CSV string or array of row objects
 * @param {object} options - Conversion options
 * @returns {object} Structured routine object
 */
export function convertCSVToRoutine(input, options = {}) {
  const {
    id = `routine_${Date.now()}`,
    name = 'Imported Routine',
    metadata = {}
  } = options;

  // Parse CSV if string
  let rows;
  if (typeof input === 'string') {
    rows = parseCSVFlexible(input);
  } else if (Array.isArray(input)) {
    rows = input;
  } else {
    throw new Error('Input must be CSV string or array of rows');
  }

  if (!rows || rows.length === 0) {
    throw new Error('No valid rows found in CSV');
  }

  // Group rows by week and day
  const workoutMap = new Map();
  
  rows.forEach(row => {
    const week = Number(row.week || row.Week);
    const day = Number(row.day || row.Day);
    
    if (!Number.isInteger(week) || !Number.isInteger(day)) {
      console.warn('Skipping row with invalid week/day:', row);
      return;
    }

    const key = `${week}-${day}`;
    if (!workoutMap.has(key)) {
      workoutMap.set(key, {
        week,
        day,
        focus: row.focus || row.Focus || '',
        exercises: []
      });
    }

    const workout = workoutMap.get(key);
    
    // Convert row to exercise
    const exercise = legacyRowToExercise({
      exercise: row.exercise || row.Exercise,
      target: row.target || row['Target Reps'],
      sets: row.sets || row['Sets Planned'],
      notes: row.notes || row.Notes || ''
    });

    workout.exercises.push(exercise);
  });

  // Convert map to sorted array
  const workouts = Array.from(workoutMap.values())
    .sort((a, b) => {
      if (a.week !== b.week) return a.week - b.week;
      return a.day - b.day;
    });

  // Detect metadata from data
  const weeks = new Set(workouts.map(w => w.week));
  const detectedMetadata = {
    weeks: Math.max(...weeks),
    ...metadata
  };

  const routine = {
    id,
    name,
    metadata: detectedMetadata,
    workouts
  };

  // Validate the result
  const validation = validateRoutine(routine);
  if (!validation.valid) {
    console.warn('Converted routine has validation errors:', validation.errors);
    // Still return it, but warn
  }

  return routine;
}

/**
 * Converts old "rows" format to new structured format
 * Backward compatibility for existing user routines
 * @param {Array} rows - Legacy row array
 * @param {string} id - Routine ID
 * @param {string} name - Routine name
 * @returns {object} Structured routine
 */
export function convertLegacyRows(rows, id, name) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Invalid rows array');
  }

  return convertCSVToRoutine(rows, { id, name });
}

/**
 * Converts structured routine back to legacy rows format
 * For backward compatibility with existing tracking data
 * @param {object} routine - Structured routine object
 * @returns {Array} Legacy rows array
 */
export function routineToLegacyRows(routine) {
  const rows = [];

  routine.workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      // Convert back to legacy format
      let target;
      if (exercise.target.type === 'range') {
        target = `${exercise.target.min} to ${exercise.target.max}`;
      } else if (exercise.target.type === 'fixed') {
        target = String(exercise.target.value);
      } else if (exercise.target.type === 'routine') {
        target = 'Routine';
      } else {
        target = 'Unknown';
      }

      rows.push({
        week: workout.week,
        day: workout.day,
        focus: workout.focus,
        exercise: exercise.name,
        target,
        sets: exercise.sets,
        notes: exercise.notes || '',
        est: exercise.estimatedMinutes,
        // Legacy fields for tracking (will be used by rowState)
        rowId: undefined // Will be assigned by ensureRowIdsForRoutine
      });
    });
  });

  return rows;
}

/**
 * Exports routine to JSON file
 * @param {object} routine - Routine object
 * @returns {Blob} JSON blob for download
 */
export function exportRoutineAsJSON(routine) {
  const validation = validateRoutine(routine);
  if (!validation.valid) {
    console.warn('Exporting routine with validation errors:', validation.errors);
  }

  const json = JSON.stringify(routine, null, 2);
  return new Blob([json], { type: 'application/json' });
}

/**
 * Exports routine to CSV format (legacy)
 * @param {object} routine - Routine object
 * @returns {Blob} CSV blob for download
 */
export function exportRoutineAsCSV(routine) {
  const rows = routineToLegacyRows(routine);
  
  // Build CSV
  const headers = ['Week', 'Day', 'Focus', 'Exercise', 'Target Reps', 'Sets Planned', 'Notes'];
  const csvLines = [headers.join(',')];

  rows.forEach(row => {
    const line = [
      row.week,
      row.day,
      `"${row.focus}"`,
      `"${row.exercise}"`,
      `"${row.target}"`,
      row.sets,
      row.notes ? `"${row.notes}"` : ''
    ].join(',');
    csvLines.push(line);
  });

  const csv = csvLines.join('\n');
  return new Blob([csv], { type: 'text/csv' });
}

/**
 * Batch convert all CSV files to JSON
 * Utility for migration
 * @param {Array<{name: string, csv: string}>} files
 * @returns {Array<object>} Array of converted routines
 */
export function batchConvertCSVFiles(files) {
  return files.map(file => {
    try {
      return convertCSVToRoutine(file.csv, {
        id: file.name.replace(/\.(csv|txt)$/i, '').toLowerCase(),
        name: file.name.replace(/\.(csv|txt)$/i, '')
      });
    } catch (error) {
      console.error(`Failed to convert ${file.name}:`, error);
      return null;
    }
  }).filter(Boolean);
}
