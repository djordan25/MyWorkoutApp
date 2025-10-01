/**
 * Script to generate exercises.json from existing routine CSV files
 * Run with: node scripts/generateExerciseLibrary.js
 */

const fs = require('fs');
const path = require('path');

// Helper to create slug from exercise name
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')      // Spaces to hyphens
    .replace(/--+/g, '-')      // Multiple hyphens to single
    .replace(/^-+|-+$/g, '');  // Trim hyphens
}

// Parse CSV file
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] ? values[index].trim() : '';
    });
    rows.push(row);
  }
  return rows;
}

// Infer metadata from exercise name and focus
function inferMetadata(exerciseName, focus) {
  const name = exerciseName.toLowerCase();
  const focusLower = (focus || '').toLowerCase();
  
  let primaryMuscles = [];
  let secondaryMuscles = [];
  let equipment = [];
  let type = 'compound';
  let difficulty = 'intermediate';
  
  // Infer muscles from focus
  if (focusLower.includes('chest')) primaryMuscles.push('Chest');
  if (focusLower.includes('back')) primaryMuscles.push('Back');
  if (focusLower.includes('shoulder')) primaryMuscles.push('Shoulders');
  if (focusLower.includes('leg')) primaryMuscles.push('Legs');
  if (focusLower.includes('bicep')) primaryMuscles.push('Biceps');
  if (focusLower.includes('tricep')) primaryMuscles.push('Triceps');
  if (focusLower.includes('calves')) primaryMuscles.push('Calves');
  if (focusLower.includes('trap')) primaryMuscles.push('Traps');
  if (focusLower.includes('abs')) primaryMuscles.push('Abs');
  
  // Infer muscles from name
  if (name.includes('bench') || name.includes('press') && name.includes('chest')) {
    if (!primaryMuscles.includes('Chest')) primaryMuscles.push('Chest');
  }
  if (name.includes('row') || name.includes('pull') || name.includes('lat')) {
    if (!primaryMuscles.includes('Back')) primaryMuscles.push('Back');
  }
  if (name.includes('squat') || name.includes('lunge') || name.includes('leg')) {
    if (!primaryMuscles.includes('Legs')) primaryMuscles.push('Legs');
  }
  if (name.includes('curl') && name.includes('bicep')) {
    if (!primaryMuscles.includes('Biceps')) primaryMuscles.push('Biceps');
  }
  if (name.includes('extension') || name.includes('pressdown') || name.includes('tricep')) {
    if (!primaryMuscles.includes('Triceps')) primaryMuscles.push('Triceps');
  }
  if (name.includes('shoulder') || name.includes('overhead') || name.includes('lateral') || name.includes('raise')) {
    if (!primaryMuscles.includes('Shoulders')) primaryMuscles.push('Shoulders');
  }
  if (name.includes('calf')) {
    if (!primaryMuscles.includes('Calves')) primaryMuscles.push('Calves');
  }
  if (name.includes('shrug') || name.includes('trap')) {
    if (!primaryMuscles.includes('Traps')) primaryMuscles.push('Traps');
  }
  if (name.includes('deadlift') || name.includes('rdl') || name.includes('romanian')) {
    if (!primaryMuscles.includes('Back')) primaryMuscles.push('Back');
    secondaryMuscles.push('Hamstrings', 'Glutes');
  }
  if (name.includes('crunch') || name.includes('plank') || name.includes('leg raise')) {
    if (!primaryMuscles.includes('Abs')) primaryMuscles.push('Abs');
  }
  
  // Equipment
  if (name.includes('barbell')) equipment.push('Barbell');
  if (name.includes('dumbbell') || name.includes('db ') || name.includes(' db')) equipment.push('Dumbbells');
  if (name.includes('cable') || name.includes('mikolo')) equipment.push('Cable Machine');
  if (name.includes('machine')) equipment.push('Machine');
  if (name.includes('bench') && !name.includes('bent')) equipment.push('Bench');
  if (name.includes('band')) equipment.push('Resistance Band');
  if (equipment.length === 0) equipment.push('Bodyweight');
  
  // Type
  if (name.includes('fly') || name.includes('flye') || name.includes('curl') || 
      name.includes('raise') || name.includes('extension') || name.includes('pressdown')) {
    type = 'isolation';
  }
  if (name.includes('plank')) {
    type = 'isometric';
  }
  
  // Difficulty
  if (name.includes('tibialis') || name.includes('step-down')) {
    difficulty = 'beginner';
  }
  if (name.includes('nordic') || name.includes('deficit')) {
    difficulty = 'advanced';
  }
  
  return { primaryMuscles, secondaryMuscles, equipment, type, difficulty };
}

// Main processing
function generateExerciseLibrary() {
  console.log('🏋️  Generating Exercise Library...\n');
  
  // Parse both routines
  const shredRows = parseCSV(path.join(__dirname, '../routines/shred.csv'));
  const sizeRows = parseCSV(path.join(__dirname, '../routines/size.csv'));
  
  const allRows = [...shredRows, ...sizeRows];
  const exerciseMap = new Map();
  
  // Extract unique exercises
  allRows.forEach(row => {
    const exerciseName = row.Exercise;
    const focus = row.Focus;
    const targetReps = row['Target Reps'];
    
    if (!exerciseName) return;
    
    // Check if it's a "Routine" type exercise
    const isRoutineType = targetReps && targetReps.toLowerCase() === 'routine';
    
    // Split exercises with "or"
    const exercises = exerciseName.includes(' or ') 
      ? exerciseName.split(' or ').map(e => e.trim())
      : [exerciseName];
    
    exercises.forEach(exName => {
      if (!exerciseMap.has(exName)) {
        const slug = createSlug(exName);
        const metadata = inferMetadata(exName, focus);
        
        const exercise = {
          id: slug,
          name: exName,
          type: isRoutineType ? 'routine' : metadata.type,
        };
        
        // For routine-type exercises, don't include muscle/equipment
        if (isRoutineType) {
          exercise.description = `Complete ${exName} routine as prescribed`;
          exercise.duration = 'As prescribed';
        } else {
          exercise.primaryMuscles = metadata.primaryMuscles;
          exercise.secondaryMuscles = metadata.secondaryMuscles;
          exercise.equipment = metadata.equipment;
          exercise.difficulty = metadata.difficulty;
          exercise.instructions = [];
          exercise.formCues = [];
        }
        
        exerciseMap.set(exName, exercise);
      }
    });
  });
  
  // Convert to array and sort by ID
  const exercises = Array.from(exerciseMap.values())
    .sort((a, b) => a.id.localeCompare(b.id));
  
  console.log(`✅ Extracted ${exercises.length} unique exercises\n`);
  
  // Group by type for display
  const byType = exercises.reduce((acc, ex) => {
    if (!acc[ex.type]) acc[ex.type] = [];
    acc[ex.type].push(ex.name);
    return acc;
  }, {});
  
  Object.entries(byType).forEach(([type, exs]) => {
    console.log(`${type}: ${exs.length} exercises`);
  });
  
  // Save to file
  const output = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    exercises
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../exercises.json'),
    JSON.stringify(output, null, 2)
  );
  
  console.log('\n✅ Generated exercises.json');
  
  return exerciseMap;
}

// Run if called directly
if (require.main === module) {
  try {
    generateExerciseLibrary();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

module.exports = { generateExerciseLibrary, createSlug, parseCSV };
