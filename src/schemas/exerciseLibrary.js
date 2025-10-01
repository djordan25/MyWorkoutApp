/**
 * Exercise Library Schema
 * Central repository of exercise definitions
 */

/**
 * Exercise definition in the library
 * @typedef {Object} Exercise
 * @property {string} id - Unique identifier
 * @property {string} name - Exercise name
 * @property {string} description - Detailed description
 * @property {string[]} primaryMuscles - Primary muscles worked
 * @property {string[]} secondaryMuscles - Secondary muscles
 * @property {string[]} equipment - Required equipment
 * @property {string} difficulty - beginner | intermediate | advanced
 * @property {string} type - compound | isolation | cardio | flexibility
 * @property {string} videoUrl - Demonstration video URL
 * @property {string[]} instructions - Step-by-step instructions
 * @property {string[]} formCues - Key form reminders
 * @property {Object} alternatives - Alternative exercises
 */

/**
 * Built-in exercise library
 */
export const EXERCISE_LIBRARY = {
  'barbell-bench-press': {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    description: 'Compound chest exercise performed lying on a flat bench',
    primaryMuscles: ['Chest', 'Pectoralis Major'],
    secondaryMuscles: ['Anterior Deltoid', 'Triceps'],
    equipment: ['Barbell', 'Bench'],
    difficulty: 'intermediate',
    type: 'compound',
    videoUrl: '',
    instructions: [
      'Lie on flat bench with feet planted',
      'Grip bar slightly wider than shoulders',
      'Lower bar to mid-chest with control',
      'Press back up to starting position'
    ],
    formCues: [
      'Retract scapulae',
      'Maintain arch in lower back',
      'Elbows at 45-degree angle',
      'Bar path slightly diagonal'
    ],
    alternatives: {
      easier: ['dumbbell-bench-press', 'push-ups'],
      harder: ['pause-bench-press', 'close-grip-bench-press']
    }
  },
  
  'incline-dumbbell-bench': {
    id: 'incline-dumbbell-bench',
    name: 'Incline Dumbbell Bench Press',
    description: 'Upper chest emphasis using incline bench and dumbbells',
    primaryMuscles: ['Upper Chest', 'Clavicular Pectoralis'],
    secondaryMuscles: ['Anterior Deltoid', 'Triceps'],
    equipment: ['Dumbbells', 'Incline Bench'],
    difficulty: 'intermediate',
    type: 'compound',
    videoUrl: '',
    instructions: [
      'Set bench to 30-45 degree incline',
      'Start with dumbbells at shoulder level',
      'Press up and slightly inward',
      'Lower with control to starting position'
    ],
    formCues: [
      'Keep shoulder blades retracted',
      'Maintain contact with bench',
      'Control the descent',
      'Full range of motion'
    ],
    alternatives: {
      easier: ['incline-push-ups'],
      harder: ['incline-barbell-press']
    }
  },
  
  'squat': {
    id: 'squat',
    name: 'Barbell Back Squat',
    description: 'Fundamental lower body compound movement',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core', 'Erectors'],
    equipment: ['Barbell', 'Squat Rack'],
    difficulty: 'intermediate',
    type: 'compound',
    videoUrl: '',
    instructions: [
      'Bar on upper traps, feet shoulder-width',
      'Brace core and descend with hips back',
      'Go to parallel or below',
      'Drive through heels to stand'
    ],
    formCues: [
      'Chest up, eyes forward',
      'Knees track over toes',
      'Maintain neutral spine',
      'Full depth if mobility allows'
    ],
    alternatives: {
      easier: ['goblet-squat', 'box-squat'],
      harder: ['front-squat', 'pause-squat']
    }
  },
  
  'deadlift': {
    id: 'deadlift',
    name: 'Conventional Deadlift',
    description: 'Full-body pulling movement, posterior chain focus',
    primaryMuscles: ['Erectors', 'Glutes', 'Hamstrings'],
    secondaryMuscles: ['Lats', 'Traps', 'Forearms', 'Core'],
    equipment: ['Barbell', 'Plates'],
    difficulty: 'advanced',
    type: 'compound',
    videoUrl: '',
    instructions: [
      'Bar over mid-foot, shins close',
      'Hinge at hips, grip bar shoulder-width',
      'Brace core, pull slack out of bar',
      'Drive through floor, stand tall'
    ],
    formCues: [
      'Neutral spine throughout',
      'Shoulders over bar at start',
      'Push floor away',
      'Lock hips and knees together'
    ],
    alternatives: {
      easier: ['romanian-deadlift', 'trap-bar-deadlift'],
      harder: ['deficit-deadlift', 'snatch-grip-deadlift']
    }
  },
  
  'pull-up': {
    id: 'pull-up',
    name: 'Pull-Up',
    description: 'Bodyweight back and bicep exercise',
    primaryMuscles: ['Lats', 'Upper Back'],
    secondaryMuscles: ['Biceps', 'Rear Delts', 'Core'],
    equipment: ['Pull-up Bar'],
    difficulty: 'intermediate',
    type: 'compound',
    videoUrl: '',
    instructions: [
      'Hang from bar with overhand grip',
      'Pull chest toward bar',
      'Lower with control',
      'Repeat for reps'
    ],
    formCues: [
      'Engage lats before pulling',
      'Keep core tight',
      'Full range of motion',
      'Control the negative'
    ],
    alternatives: {
      easier: ['lat-pulldown', 'assisted-pull-up', 'inverted-row'],
      harder: ['weighted-pull-up', 'chest-to-bar-pull-up']
    }
  }
};

/**
 * Exercise library storage and management
 */
class ExerciseLibraryManager {
  constructor() {
    this.exercises = { ...EXERCISE_LIBRARY };
    this.loadCustomExercises();
  }
  
  /**
   * Load user-defined custom exercises from storage
   */
  loadCustomExercises() {
    const stored = localStorage.getItem('customExercises');
    if (stored) {
      try {
        const custom = JSON.parse(stored);
        Object.assign(this.exercises, custom);
      } catch (e) {
        console.error('Failed to load custom exercises:', e);
      }
    }
  }
  
  /**
   * Save custom exercises to storage
   */
  saveCustomExercises() {
    const custom = {};
    for (const [id, ex] of Object.entries(this.exercises)) {
      if (!EXERCISE_LIBRARY[id]) {
        custom[id] = ex;
      }
    }
    localStorage.setItem('customExercises', JSON.stringify(custom));
  }
  
  /**
   * Get exercise by ID
   */
  getExercise(id) {
    return this.exercises[id] || null;
  }
  
  /**
   * Get exercise by name (case-insensitive)
   */
  getExerciseByName(name) {
    const normalized = name.toLowerCase().trim();
    return Object.values(this.exercises).find(
      ex => ex.name.toLowerCase() === normalized
    );
  }
  
  /**
   * Add or update exercise in library
   */
  addExercise(exercise) {
    if (!exercise.id) {
      exercise.id = exercise.name.toLowerCase().replace(/\s+/g, '-');
    }
    
    this.exercises[exercise.id] = {
      ...exercise,
      custom: !EXERCISE_LIBRARY[exercise.id]
    };
    
    if (!EXERCISE_LIBRARY[exercise.id]) {
      this.saveCustomExercises();
    }
    
    return exercise.id;
  }
  
  /**
   * Remove custom exercise
   */
  removeExercise(id) {
    if (EXERCISE_LIBRARY[id]) {
      throw new Error('Cannot remove built-in exercise');
    }
    delete this.exercises[id];
    this.saveCustomExercises();
  }
  
  /**
   * Search exercises
   */
  search(query) {
    const q = query.toLowerCase();
    return Object.values(this.exercises).filter(ex =>
      ex.name.toLowerCase().includes(q) ||
      ex.primaryMuscles.some(m => m.toLowerCase().includes(q)) ||
      ex.equipment.some(e => e.toLowerCase().includes(q))
    );
  }
  
  /**
   * Get exercises by muscle group
   */
  getByMuscleGroup(muscle) {
    const m = muscle.toLowerCase();
    return Object.values(this.exercises).filter(ex =>
      ex.primaryMuscles.some(pm => pm.toLowerCase().includes(m)) ||
      ex.secondaryMuscles.some(sm => sm.toLowerCase().includes(m))
    );
  }
  
  /**
   * Get exercises by equipment
   */
  getByEquipment(equipment) {
    const e = equipment.toLowerCase();
    return Object.values(this.exercises).filter(ex =>
      ex.equipment.some(eq => eq.toLowerCase().includes(e))
    );
  }
  
  /**
   * Get all exercises as array
   */
  getAllExercises() {
    return Object.values(this.exercises);
  }
  
  /**
   * Get exercise suggestions for routine builder
   */
  getSuggestions(muscleGroup, difficulty, equipment = []) {
    let results = this.getByMuscleGroup(muscleGroup);
    
    if (difficulty) {
      results = results.filter(ex => ex.difficulty === difficulty);
    }
    
    if (equipment.length > 0) {
      results = results.filter(ex =>
        ex.equipment.some(eq => equipment.includes(eq))
      );
    }
    
    return results;
  }
}

// Singleton instance
export const exerciseLibrary = new ExerciseLibraryManager();

/**
 * Validates an exercise definition
 */
export function validateExercise(exercise) {
  const errors = [];
  
  if (!exercise.id || typeof exercise.id !== 'string') {
    errors.push('Exercise must have a valid ID');
  }
  if (!exercise.name || typeof exercise.name !== 'string') {
    errors.push('Exercise must have a name');
  }
  if (!Array.isArray(exercise.primaryMuscles) || exercise.primaryMuscles.length === 0) {
    errors.push('Exercise must specify primary muscles');
  }
  if (!['beginner', 'intermediate', 'advanced'].includes(exercise.difficulty)) {
    errors.push('Invalid difficulty level');
  }
  if (!['compound', 'isolation', 'cardio', 'flexibility'].includes(exercise.type)) {
    errors.push('Invalid exercise type');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
