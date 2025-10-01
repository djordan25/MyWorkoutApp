/**
 * Routine Management Feature
 * Handles importing, managing, and switching routines
 */

import { userRoutines, currentUser } from '../core/storage.js';
import { addRoutine, removeRoutine } from '../core/actions.js';
import { openModal } from '../ui/modal.js';
import { ensureRowIdsForRoutine } from '../routines/ids.js';
import { parseCSVFlexible } from '../routines/parseCsv.js';
import { convertCSVToRoutine, routineToLegacyRows } from '../converters/csvToRoutine.js';
import { validateRoutine } from '../schemas/routineSchema.js';

/**
 * Shows routine selection modal for first-time users
 * @param {Array} availableRoutines - Array of routines from manifest
 * @param {Function} onComplete - Callback when routines are added
 */
export async function showFirstTimeRoutineSelection(availableRoutines, onComplete) {
  if (availableRoutines.length === 0) {
    alert('No routines available. You can import routines later.');
    return;
  }
  
  // Load routine data to get names
  const routinesWithNames = await Promise.all(
    availableRoutines.map(async (routine) => {
      try {
        const response = await fetch(routine.src);
        const data = await response.json();
        return {
          ...routine,
          name: data.name || routine.id
        };
      } catch (error) {
        console.error(`Failed to load routine ${routine.id}:`, error);
        return {
          ...routine,
          name: routine.id
        };
      }
    })
  );
  
  const content = document.createElement('div');
  
  const intro = document.createElement('p');
  intro.style.marginBottom = '20px';
  intro.textContent = 'Welcome! Select which workout routines you would like to add to your profile:';
  
  const checkboxList = document.createElement('div');
  checkboxList.style.display = 'flex';
  checkboxList.style.flexDirection = 'column';
  checkboxList.style.gap = '12px';
  checkboxList.style.marginBottom = '20px';
  
  const selectedRoutines = new Set();
  
  routinesWithNames.forEach(routine => {
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '12px';
    label.style.padding = '12px';
    label.style.background = 'var(--menuBg)';
    label.style.borderRadius = '10px';
    label.style.cursor = 'pointer';
    label.style.transition = 'background 0.2s';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.style.width = '20px';
    checkbox.style.height = '20px';
    checkbox.style.cursor = 'pointer';
    
    const name = document.createElement('span');
    name.style.flex = '1';
    name.style.fontWeight = '500';
    name.textContent = routine.name;
    
    checkbox.onchange = () => {
      if (checkbox.checked) {
        selectedRoutines.add(routine);
        label.style.background = 'var(--blue)';
      } else {
        selectedRoutines.delete(routine);
        label.style.background = 'var(--menuBg)';
      }
    };
    
    label.appendChild(checkbox);
    label.appendChild(name);
    checkboxList.appendChild(label);
  });
  
  const buttonRow = document.createElement('div');
  buttonRow.style.display = 'flex';
  buttonRow.style.gap = '12px';
  buttonRow.style.justifyContent = 'flex-end';
  
  const skipBtn = document.createElement('button');
  skipBtn.className = 'btn btn-ghost';
  skipBtn.textContent = 'Skip for Now';
  
  const addBtn = document.createElement('button');
  addBtn.className = 'btn';
  addBtn.textContent = 'Add Selected Routines';
  
  buttonRow.appendChild(skipBtn);
  buttonRow.appendChild(addBtn);
  
  content.appendChild(intro);
  content.appendChild(checkboxList);
  content.appendChild(buttonRow);
  
  const modal = openModal({ title: 'Select Your Routines', content });
  
  skipBtn.onclick = () => {
    modal.close();
  };
  
  addBtn.onclick = async () => {
    if (selectedRoutines.size === 0) {
      alert('Please select at least one routine, or click Skip for Now.');
      return;
    }
    
    for (const routine of selectedRoutines) {
      try {
        await importRoutineFromManifest(routine);
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        console.error(`Failed to load routine ${routine.name}:`, error);
      }
    }
    
    // Force immediate save to localStorage before closing/reloading
    const storageKey = currentUser ? `workout_userRoutines_${currentUser}` : 'workout_userRoutines';
    const dataToSave = JSON.stringify(userRoutines);
    localStorage.setItem(storageKey, dataToSave);
    console.log(`Saved ${Object.keys(userRoutines).length} routines to ${storageKey}`);
    console.log('userRoutines:', userRoutines);
    
    modal.close();
    
    // Small delay to ensure modal closes before reload
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (onComplete) {
      onComplete();
    }
  };
}

/**
 * Imports a routine from manifest entry
 */
export async function importRoutineFromManifest(manifestEntry) {
  const response = await fetch(manifestEntry.src);
  const routineData = await response.json();
  
  let routine;
  if (routineData.workouts) {
    routine = routineData;
  } else if (routineData.rowsCsvUrl || routineData.rows) {
    let rows;
    if (routineData.rowsCsvUrl) {
      const csvResponse = await fetch(routineData.rowsCsvUrl);
      const csvText = await csvResponse.text();
      rows = parseCSVFlexible(csvText);
    } else {
      rows = routineData.rows;
    }
    
    routine = convertCSVToRoutine(rows, {
      id: routineData.id || `routine_${Date.now()}`,
      name: routineData.name || manifestEntry.id || 'Imported Routine'
    });
  } else {
    throw new Error('Invalid routine format');
  }
  
  const validation = validateRoutine(routine);
  if (!validation.valid) {
    console.warn('Routine validation warnings:', validation.errors);
  }
  
  const id = routine.id || `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const newRoutine = {
    id,
    name: routine.name,
    rows: routineToLegacyRows(routine),
    _structuredData: routine
  };
  
  ensureRowIdsForRoutine(newRoutine);
  
  // Add to userRoutines object and let addRoutine handle the save
  return addRoutine(newRoutine);
}

/**
 * Imports routine from file
 */
export function importRoutineFromFile(file, onSuccess) {
  const reader = new FileReader();
  
  reader.onload = async () => {
    try {
      let routine;
      
      if ((file.type || '').includes('json') || /\.json$/i.test(file.name)) {
        const obj = JSON.parse(reader.result);
        
        if (obj.workouts) {
          routine = obj;
        } else if (Array.isArray(obj)) {
          routine = convertCSVToRoutine(obj, {
            id: `user_${Date.now()}`,
            name: file.name.replace(/\.(csv|json)$/i, '') || 'Imported Routine'
          });
        } else if (Array.isArray(obj.rows)) {
          routine = convertCSVToRoutine(obj.rows, {
            id: obj.id || `user_${Date.now()}`,
            name: obj.name || obj.id || 'Imported Routine'
          });
        } else {
          throw new Error('Invalid routine JSON');
        }
      } else {
        routine = convertCSVToRoutine(reader.result, {
          id: `user_${Date.now()}`,
          name: file.name.replace(/\.csv$/i, '') || 'Imported Routine'
        });
      }
      
      const validation = validateRoutine(routine);
      if (!validation.valid) {
        console.warn('Imported routine has validation warnings:', validation.errors);
      }
      
      const id = routine.id || `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      userRoutines[id] = {
        id,
        name: routine.name,
        rows: routineToLegacyRows(routine),
        _structuredData: routine
      };
      
      ensureRowIdsForRoutine(userRoutines[id]);
      addRoutine(userRoutines[id]);
      
      if (onSuccess) {
        onSuccess(id);
      }
    } catch (error) {
      alert('Failed to import: ' + error.message);
    }
  };
  
  reader.readAsText(file);
}
