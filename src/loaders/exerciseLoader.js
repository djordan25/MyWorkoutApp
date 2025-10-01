/**
 * Exercise Library Loader
 * Loads and provides access to the exercise library
 */

let exerciseLibrary = null;
let exerciseMap = null;

/**
 * Load exercises from exercises.json
 */
export async function loadExercises() {
  if (exerciseLibrary) return exerciseLibrary;
  
  try {
    const response = await fetch('exercises.json');
    const data = await response.json();
    exerciseLibrary = data;
    
    // Create map for fast lookup by ID
    exerciseMap = new Map();
    data.exercises.forEach(exercise => {
      exerciseMap.set(exercise.id, exercise);
    });
    
    console.log(`✅ Loaded ${data.exercises.length} exercises from library`);
    return exerciseLibrary;
  } catch (error) {
    console.error('Failed to load exercise library:', error);
    throw error;
  }
}

/**
 * Get exercise by ID
 */
export function getExercise(id) {
  if (!exerciseMap) {
    console.error('Exercise library not loaded. Call loadExercises() first.');
    return null;
  }
  return exerciseMap.get(id);
}

/**
 * Get all exercises
 */
export function getAllExercises() {
  return exerciseLibrary?.exercises || [];
}

/**
 * Search exercises by name
 */
export function searchExercises(query) {
  if (!exerciseLibrary) return [];
  
  const lowerQuery = query.toLowerCase();
  return exerciseLibrary.exercises.filter(ex => 
    ex.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get exercises by muscle group
 */
export function getExercisesByMuscle(muscle) {
  if (!exerciseLibrary) return [];
  
  const lowerMuscle = muscle.toLowerCase();
  return exerciseLibrary.exercises.filter(ex => 
    ex.primaryMuscles?.some(m => m.toLowerCase().includes(lowerMuscle)) ||
    ex.secondaryMuscles?.some(m => m.toLowerCase().includes(lowerMuscle))
  );
}

/**
 * Get exercises by equipment
 */
export function getExercisesByEquipment(equipment) {
  if (!exerciseLibrary) return [];
  
  const lowerEquipment = equipment.toLowerCase();
  return exerciseLibrary.exercises.filter(ex =>
    ex.equipment?.some(e => e.toLowerCase().includes(lowerEquipment))
  );
}

/**
 * Get exercises by type
 */
export function getExercisesByType(type) {
  if (!exerciseLibrary) return [];
  
  return exerciseLibrary.exercises.filter(ex => ex.type === type);
}
