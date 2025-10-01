/**
 * JSON Schema and validation for workout routines
 * Defines the canonical structure for routine definitions
 */

/**
 * Validates a routine object against the schema
 * @param {object} routine - The routine to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateRoutine(routine) {
  const errors = [];

  // Required top-level fields
  if (!routine.id || typeof routine.id !== 'string') {
    errors.push('Routine must have a valid "id" string');
  }
  if (!routine.name || typeof routine.name !== 'string') {
    errors.push('Routine must have a valid "name" string');
  }
  if (!Array.isArray(routine.workouts)) {
    errors.push('Routine must have a "workouts" array');
  }

  // Validate metadata if present
  if (routine.metadata && typeof routine.metadata !== 'object') {
    errors.push('Metadata must be an object');
  }

  // Validate workouts
  if (Array.isArray(routine.workouts)) {
    routine.workouts.forEach((workout, i) => {
      if (!Number.isInteger(workout.week) || workout.week < 1) {
        errors.push(`Workout ${i}: week must be a positive integer`);
      }
      if (!Number.isInteger(workout.day) || workout.day < 1) {
        errors.push(`Workout ${i}: day must be a positive integer`);
      }
      if (!workout.focus || typeof workout.focus !== 'string') {
        errors.push(`Workout ${i}: focus must be a non-empty string`);
      }
      if (!Array.isArray(workout.exercises)) {
        errors.push(`Workout ${i}: exercises must be an array`);
      } else {
        workout.exercises.forEach((ex, j) => {
          validateExercise(ex, errors, `Workout ${i}, Exercise ${j}`);
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
 * Validates an exercise object
 */
function validateExercise(exercise, errors, context) {
  if (!exercise.name || typeof exercise.name !== 'string') {
    errors.push(`${context}: name must be a non-empty string`);
  }
  
  if (!exercise.target || typeof exercise.target !== 'object') {
    errors.push(`${context}: target must be an object`);
  } else {
    const { type, min, max, value } = exercise.target;
    if (type === 'range') {
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        errors.push(`${context}: range target must have numeric min and max`);
      }
      if (min > max) {
        errors.push(`${context}: range target min must be <= max`);
      }
    } else if (type === 'fixed') {
      if (!Number.isFinite(value)) {
        errors.push(`${context}: fixed target must have numeric value`);
      }
    } else if (type === 'routine') {
      // Routine type (like "Ab Ripper X") - no specific target
    } else {
      errors.push(`${context}: target type must be 'range', 'fixed', or 'routine'`);
    }
  }

  if (!Number.isInteger(exercise.sets) || exercise.sets < 1) {
    errors.push(`${context}: sets must be a positive integer`);
  }
}

/**
 * Creates a routine template
 * @returns {object} Empty routine structure
 */
export function createRoutineTemplate() {
  return {
    id: '',
    name: '',
    metadata: {
      author: '',
      difficulty: 'beginner', // beginner, intermediate, advanced
      weeks: 0,
      equipment: []
    },
    workouts: []
  };
}

/**
 * Creates an exercise template
 * @returns {object} Empty exercise structure
 */
export function createExerciseTemplate() {
  return {
    name: '',
    target: {
      type: 'range',
      min: 8,
      max: 12,
      unit: 'reps'
    },
    sets: 3,
    rest: '90s',
    notes: '',
    videoUrl: '',
    estimatedMinutes: 5
  };
}

/**
 * Converts legacy row format to new exercise format
 * @param {object} row - Legacy row object
 * @returns {object} New exercise format
 */
export function legacyRowToExercise(row) {
  const exercise = {
    name: row.exercise || '',
    sets: Number(row.sets) || 3,
    notes: row.notes || ''
  };

  // Parse target
  const targetStr = (row.target || '').trim();
  if (!targetStr || targetStr.toLowerCase() === 'routine') {
    exercise.target = { type: 'routine' };
  } else if (/^\d+\s*to\s*\d+/.test(targetStr)) {
    const match = targetStr.match(/(\d+)\s*to\s*(\d+)/);
    exercise.target = {
      type: 'range',
      min: parseInt(match[1]),
      max: parseInt(match[2]),
      unit: 'reps'
    };
  } else if (/^\d+/.test(targetStr)) {
    exercise.target = {
      type: 'fixed',
      value: parseInt(targetStr),
      unit: 'reps'
    };
  } else {
    exercise.target = { type: 'routine' };
  }

  // Estimate time (rough heuristic)
  const setTime = exercise.sets * 1.5; // ~1.5 min per set
  exercise.estimatedMinutes = Math.ceil(setTime);

  return exercise;
}

/**
 * Schema definition (for documentation and validation)
 */
export const ROUTINE_SCHEMA = {
  type: 'object',
  required: ['id', 'name', 'workouts'],
  properties: {
    id: {
      type: 'string',
      description: 'Unique identifier for the routine'
    },
    name: {
      type: 'string',
      description: 'Display name for the routine'
    },
    metadata: {
      type: 'object',
      properties: {
        author: { type: 'string' },
        difficulty: { enum: ['beginner', 'intermediate', 'advanced'] },
        weeks: { type: 'integer', minimum: 1 },
        equipment: { type: 'array', items: { type: 'string' } },
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
              required: ['name', 'target', 'sets'],
              properties: {
                name: { type: 'string' },
                target: {
                  type: 'object',
                  oneOf: [
                    {
                      properties: {
                        type: { const: 'range' },
                        min: { type: 'number' },
                        max: { type: 'number' },
                        unit: { type: 'string' }
                      },
                      required: ['type', 'min', 'max']
                    },
                    {
                      properties: {
                        type: { const: 'fixed' },
                        value: { type: 'number' },
                        unit: { type: 'string' }
                      },
                      required: ['type', 'value']
                    },
                    {
                      properties: {
                        type: { const: 'routine' }
                      },
                      required: ['type']
                    }
                  ]
                },
                sets: { type: 'integer', minimum: 1 },
                rest: { type: 'string' },
                notes: { type: 'string' },
                videoUrl: { type: 'string' },
                estimatedMinutes: { type: 'number', minimum: 0 }
              }
            }
          }
        }
      }
    }
  }
};
