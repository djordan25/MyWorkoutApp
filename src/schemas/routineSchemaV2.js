/**
 * Routine Schema V2 - With Exercise Library References
 * Routines now reference exercises from the central library
 * Routine definitions only contain routine-specific parameters (sets, reps, rest, etc.)
 */

import { exerciseLibrary } from './exerciseLibrary.js';

/**
 * New routine structure that references exercise library
 * 
 * @typedef {Object} RoutineV2
 * @property {string} id - Unique identifier
 * @property {string} name - Routine name
 * @property {Object} metadata - Routine metadata
 * @property {WorkoutDay[]} workouts - Array of workout days
 * 
 * @typedef {Object} WorkoutDay
 * @property {number} week - Week number
 * @property {number} day - Day number
 * @property {string} focus - Focus/theme for the day
 * @property {ExerciseReference[]} exercises - Exercise references
 * 
 * @typedef {Object} ExerciseReference
 * @property {string} exerciseId - Reference to exercise in library
 * @property {Object} target - Routine-specific target (sets/reps for this routine)
 * @property {number} sets - Number of sets for this routine
 * @property {string} rest - Rest period (e.g., "90s", "2min")
 * @property {string} tempo - Tempo prescription (e.g., "3-1-1-0")
 * @property {string} intensity - Intensity marker (e.g., "RPE 8", "75% 1RM")
 * @property {string} notes - Routine-specific notes
 */

/**
 * Validates a routine against the new schema
 */
export function validateRoutineV2(routine) {
  const errors = [];

  if (!routine.id || typeof routine.id !== 'string') {
    errors.push('Routine must have a valid ID');
  }
  if (!routine.name || typeof routine.name !== 'string') {
    errors.push('Routine must have a name');
  }
  if (!Array.isArray(routine.workouts)) {
    errors.push('Routine must have workouts array');
  }

  if (Array.isArray(routine.workouts)) {
    routine.workouts.forEach((workout, i) => {
      if (!Number.isInteger(workout.week) || workout.week < 1) {
        errors.push(`Workout ${i}: week must be positive integer`);
      }
      if (!Number.isInteger(workout.day) || workout.day < 1) {
        errors.push(`Workout ${i}: day must be positive integer`);
      }
      if (!Array.isArray(workout.exercises)) {
        errors.push(`Workout ${i}: exercises must be an array`);
      } else {
        workout.exercises.forEach((exRef, j) => {
          validateExerciseReference(exRef, errors, `Workout ${i}, Exercise ${j}`);
        });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates an exercise reference
 */
function validateExerciseReference(exRef, errors, context) {
  if (!exRef.exerciseId || typeof exRef.exerciseId !== 'string') {
    errors.push(`${context}: must have exerciseId`);
  } else {
    const exercise = exerciseLibrary.getExercise(exRef.exerciseId);
    if (!exercise) {
      errors.push(`${context}: exerciseId "${exRef.exerciseId}" not found in library`);
    }
  }

  if (!Number.isInteger(exRef.sets) || exRef.sets < 1) {
    errors.push(`${context}: sets must be positive integer`);
  }

  if (exRef.target) {
    const { type, min, max, value } = exRef.target;
    if (type === 'range') {
      if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
        errors.push(`${context}: invalid range target`);
      }
    } else if (type === 'fixed') {
      if (!Number.isFinite(value)) {
        errors.push(`${context}: fixed target must have numeric value`);
      }
    } else if (type !== 'routine') {
      errors.push(`${context}: invalid target type`);
    }
  }
}

/**
 * Resolves exercise references to full exercise data
 * Combines library data with routine-specific parameters
 */
export function resolveExerciseReference(exRef) {
  const exercise = exerciseLibrary.getExercise(exRef.exerciseId);
  
  if (!exercise) {
    console.warn(`Exercise ${exRef.exerciseId} not found in library`);
    return null;
  }

  return {
    // From library (definition)
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    primaryMuscles: exercise.primaryMuscles,
    secondaryMuscles: exercise.secondaryMuscles,
    equipment: exercise.equipment,
    difficulty: exercise.difficulty,
    type: exercise.type,
    videoUrl: exercise.videoUrl || exRef.videoUrl || '',  // Routine can override
    instructions: exercise.instructions,
    formCues: exercise.formCues,
    alternatives: exercise.alternatives,
    
    // From routine (parameters)
    sets: exRef.sets,
    target: exRef.target,
    rest: exRef.rest || '90s',
    tempo: exRef.tempo || null,
    intensity: exRef.intensity || null,
    notes: exRef.notes || ''
  };
}

/**
 * Converts legacy routine to new reference-based format
 */
export function convertToReferenceFormat(oldRoutine) {
  const newRoutine = {
    id: oldRoutine.id,
    name: oldRoutine.name,
    metadata: oldRoutine.metadata || {},
    workouts: []
  };

  if (oldRoutine.workouts) {
    newRoutine.workouts = oldRoutine.workouts.map(workout => ({
      week: workout.week,
      day: workout.day,
      focus: workout.focus,
      exercises: workout.exercises.map(ex => {
        // Try to find exercise in library by name
        let exerciseId = ex.exerciseId;
        
        if (!exerciseId && ex.name) {
          const found = exerciseLibrary.getExerciseByName(ex.name);
          if (found) {
            exerciseId = found.id;
          } else {
            // Create a temporary ID from name
            exerciseId = ex.name.toLowerCase().replace(/\s+/g, '-');
            console.warn(`Exercise "${ex.name}" not in library, using temp ID: ${exerciseId}`);
          }
        }

        return {
          exerciseId,
          sets: ex.sets,
          target: ex.target,
          rest: ex.rest || '90s',
          tempo: ex.tempo || null,
          intensity: ex.intensity || null,
          notes: ex.notes || ''
        };
      })
    }));
  }

  return newRoutine;
}

/**
 * Converts reference-based routine back to legacy format
 */
export function convertFromReferenceFormat(refRoutine) {
  const legacy = {
    id: refRoutine.id,
    name: refRoutine.name,
    metadata: refRoutine.metadata,
    workouts: []
  };

  refRoutine.workouts.forEach(workout => {
    const legacyWorkout = {
      week: workout.week,
      day: workout.day,
      focus: workout.focus,
      exercises: []
    };

    workout.exercises.forEach(exRef => {
      const resolved = resolveExerciseReference(exRef);
      if (resolved) {
        legacyWorkout.exercises.push({
          name: resolved.name,
          target: exRef.target,
          sets: exRef.sets,
          rest: exRef.rest,
          notes: exRef.notes,
          videoUrl: resolved.videoUrl,
          estimatedMinutes: Math.ceil(exRef.sets * 1.5)
        });
      }
    });

    legacy.workouts.push(legacyWorkout);
  });

  return legacy;
}

/**
 * Creates exercise reference template
 */
export function createExerciseReferenceTemplate(exerciseId) {
  return {
    exerciseId,
    sets: 3,
    target: {
      type: 'range',
      min: 8,
      max: 12,
      unit: 'reps'
    },
    rest: '90s',
    tempo: null,
    intensity: null,
    notes: ''
  };
}

/**
 * Schema definition for documentation
 */
export const ROUTINE_SCHEMA_V2 = {
  type: 'object',
  required: ['id', 'name', 'workouts'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    metadata: {
      type: 'object',
      properties: {
        author: { type: 'string' },
        difficulty: { enum: ['beginner', 'intermediate', 'advanced'] },
        weeks: { type: 'integer', minimum: 1 },
        description: { type: 'string' }
      }
    },
    workouts: {
      type: 'array',
      items: {
        type: 'object',
        required: ['week', 'day', 'focus', 'exercises'],
        properties: {
          week: { type: 'integer', minimum: 1 },
          day: { type: 'integer', minimum: 1 },
          focus: { type: 'string' },
          exercises: {
            type: 'array',
            items: {
              type: 'object',
              required: ['exerciseId', 'sets', 'target'],
              properties: {
                exerciseId: {
                  type: 'string',
                  description: 'Reference to exercise in library'
                },
                sets: { type: 'integer', minimum: 1 },
                target: {
                  type: 'object',
                  description: 'Routine-specific target (sets/reps for this routine)'
                },
                rest: { type: 'string' },
                tempo: { type: 'string', description: 'e.g., "3-1-1-0"' },
                intensity: { type: 'string', description: 'e.g., "RPE 8", "75% 1RM"' },
                notes: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
};
