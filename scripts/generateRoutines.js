/**
 * Script to generate routine v2 JSON files from CSV files
 * Run with: node scripts/generateRoutines.js
 */

const fs = require('fs');
const path = require('path');
const { parseCSV, createSlug } = require('./generateExerciseLibrary');

function generateRoutineV2(csvPath, routineId, routineName) {
  console.log(`\n📋 Generating ${routineName}...`);
  
  const rows = parseCSV(csvPath);
  const workouts = [];
  
  rows.forEach(row => {
    const week = parseInt(row.Week);
    const day = parseInt(row.Day);
    const focus = row.Focus;
    const exerciseName = row.Exercise;
    const targetReps = row['Target Reps'];
    const sets = parseInt(row['Sets Planned']) || 1;
    
    if (!exerciseName) return;
    
    // Find or create workout for this week/day
    let workout = workouts.find(w => w.week === week && w.day === day);
    if (!workout) {
      workout = {
        week,
        day,
        focus,
        exercises: []
      };
      workouts.push(workout);
    }
    
    // Handle exercises with "or" - use the first one as primary
    const primaryExercise = exerciseName.includes(' or ') 
      ? exerciseName.split(' or ')[0].trim()
      : exerciseName;
    
    const exerciseId = createSlug(primaryExercise);
    const order = workout.exercises.length + 1;
    
    workout.exercises.push({
      exerciseId,
      order,
      sets,
      targetReps
    });
  });
  
  // Sort workouts by week then day
  workouts.sort((a, b) => {
    if (a.week !== b.week) return a.week - b.week;
    return a.day - b.day;
  });
  
  // Determine number of weeks
  const maxWeek = Math.max(...workouts.map(w => w.week));
  
  const routine = {
    id: routineId,
    name: routineName,
    version: '2.0.0',
    weeks: maxWeek,
    workouts
  };
  
  const outputPath = path.join(__dirname, '../routines', `${routineId}-v2.json`);
  fs.writeFileSync(outputPath, JSON.stringify(routine, null, 2));
  
  console.log(`✅ Generated ${routineId}-v2.json`);
  console.log(`   ${workouts.length} workouts across ${maxWeek} weeks`);
  
  return routine;
}

function main() {
  console.log('📝 Generating Routine V2 Files...');
  
  // Generate both routines
  generateRoutineV2(
    path.join(__dirname, '../routines/shred.csv'),
    'shred',
    'Shred Program'
  );
  
  generateRoutineV2(
    path.join(__dirname, '../routines/size.csv'),
    'size',
    'Size Program'
  );
  
  console.log('\n✅ All routine files generated successfully!');
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

module.exports = { generateRoutineV2 };
