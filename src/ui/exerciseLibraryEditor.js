/**
 * Exercise Library Editor UI
 * Convenient interface for managing exercises
 */

import { exerciseLibrary, validateExercise, EXERCISE_LIBRARY } from '../schemas/exerciseLibrary.js';
import { openModal } from './modal.js';

/**
 * Opens the exercise library manager
 */
export function openExerciseLibraryManager() {
  const content = document.createElement('div');
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.style.gap = '16px';
  content.style.maxHeight = '70vh';
  
  // Search bar
  const searchBar = createSearchBar();
  content.appendChild(searchBar);
  
  // Filter buttons
  const filters = createFilterButtons();
  content.appendChild(filters);
  
  // Exercise list
  const listContainer = document.createElement('div');
  listContainer.style.flex = '1';
  listContainer.style.overflowY = 'auto';
  listContainer.style.minHeight = '300px';
  content.appendChild(listContainer);
  
  // Add button
  const addBtn = document.createElement('button');
  addBtn.className = 'btn';
  addBtn.textContent = '+ Add New Exercise';
  addBtn.onclick = () => openExerciseEditor(null, () => refreshList());
  content.appendChild(addBtn);
  
  const modal = openModal({ title: 'Exercise Library', content });
  
  // Render exercise list
  function refreshList(filter = null, searchQuery = '') {
    let exercises = exerciseLibrary.getAllExercises();
    
    // Apply search
    if (searchQuery) {
      exercises = exerciseLibrary.search(searchQuery);
    }
    
    // Apply filter
    if (filter) {
      if (filter.type === 'muscle') {
        exercises = exerciseLibrary.getByMuscleGroup(filter.value);
      } else if (filter.type === 'equipment') {
        exercises = exerciseLibrary.getByEquipment(filter.value);
      } else if (filter.type === 'difficulty') {
        exercises = exercises.filter(ex => ex.difficulty === filter.value);
      } else if (filter.type === 'custom') {
        exercises = exercises.filter(ex => ex.custom);
      }
    }
    
    listContainer.innerHTML = '';
    
    if (exercises.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'small';
      empty.style.textAlign = 'center';
      empty.style.padding = '32px';
      empty.style.opacity = '0.7';
      empty.textContent = 'No exercises found';
      listContainer.appendChild(empty);
      return;
    }
    
    exercises.forEach(exercise => {
      const card = createExerciseCard(exercise, () => refreshList(filter, searchQuery));
      listContainer.appendChild(card);
    });
  }
  
  // Initial render
  refreshList();
  
  // Wire up search
  const searchInput = searchBar.querySelector('input');
  let currentFilter = null;
  
  searchInput.oninput = () => {
    refreshList(currentFilter, searchInput.value);
  };
  
  // Wire up filters
  filters.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      filters.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filterType = btn.dataset.filterType;
      const filterValue = btn.dataset.filterValue;
      
      if (filterType === 'all') {
        currentFilter = null;
      } else {
        currentFilter = { type: filterType, value: filterValue };
      }
      
      refreshList(currentFilter, searchInput.value);
    };
  });
}

/**
 * Creates search bar
 */
function createSearchBar() {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.gap = '8px';
  container.style.alignItems = 'center';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Search exercises...';
  input.className = 'inp';
  input.style.flex = '1';
  
  container.appendChild(input);
  
  return container;
}

/**
 * Creates filter buttons
 */
function createFilterButtons() {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.gap = '8px';
  container.style.flexWrap = 'wrap';
  
  const filters = [
    { label: 'All', type: 'all' },
    { label: 'Custom', type: 'custom' },
    { label: 'Beginner', type: 'difficulty', value: 'beginner' },
    { label: 'Intermediate', type: 'difficulty', value: 'intermediate' },
    { label: 'Advanced', type: 'difficulty', value: 'advanced' },
    { label: 'Chest', type: 'muscle', value: 'chest' },
    { label: 'Back', type: 'muscle', value: 'back' },
    { label: 'Legs', type: 'muscle', value: 'legs' }
  ];
  
  filters.forEach(filter => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-ghost';
    btn.style.fontSize = '12px';
    btn.style.padding = '6px 12px';
    btn.textContent = filter.label;
    btn.dataset.filterType = filter.type;
    btn.dataset.filterValue = filter.value || '';
    
    if (filter.type === 'all') {
      btn.classList.add('active');
    }
    
    container.appendChild(btn);
  });
  
  return container;
}

/**
 * Creates exercise card
 */
function createExerciseCard(exercise, onUpdate) {
  const card = document.createElement('div');
  card.style.background = 'var(--menuBg)';
  card.style.border = '1px solid var(--border2)';
  card.style.borderRadius = '12px';
  card.style.padding = '12px';
  card.style.marginBottom = '8px';
  
  // Header
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.gap = '12px';
  header.style.marginBottom = '8px';
  
  const name = document.createElement('div');
  name.style.flex = '1';
  name.style.fontWeight = '600';
  name.textContent = exercise.name;
  if (exercise.custom) {
    const badge = document.createElement('span');
    badge.className = 'tag';
    badge.textContent = 'Custom';
    badge.style.marginLeft = '8px';
    name.appendChild(badge);
  }
  
  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '4px';
  
  // Edit button
  const editBtn = document.createElement('button');
  editBtn.className = 'mini-btn';
  editBtn.title = 'Edit';
  editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
  editBtn.onclick = () => openExerciseEditor(exercise, onUpdate);
  
  // Delete button (only for custom)
  if (exercise.custom) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'mini-btn';
    deleteBtn.title = 'Delete';
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteBtn.onclick = () => {
      if (confirm(`Delete "${exercise.name}"?`)) {
        exerciseLibrary.removeExercise(exercise.id);
        onUpdate();
      }
    };
    actions.appendChild(deleteBtn);
  }
  
  actions.appendChild(editBtn);
  
  header.appendChild(name);
  header.appendChild(actions);
  card.appendChild(header);
  
  // Details
  const details = document.createElement('div');
  details.style.fontSize = '12px';
  details.style.color = 'var(--muted)';
  details.style.display = 'flex';
  details.style.flexDirection = 'column';
  details.style.gap = '4px';
  
  const muscles = document.createElement('div');
  muscles.textContent = `Muscles: ${exercise.primaryMuscles.join(', ')}`;
  muscles.style.opacity = '0.85';
  
  const equipment = document.createElement('div');
  equipment.textContent = `Equipment: ${exercise.equipment.join(', ')}`;
  equipment.style.opacity = '0.85';
  
  const difficulty = document.createElement('div');
  difficulty.textContent = `${exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)} • ${exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1)}`;
  difficulty.style.opacity = '0.85';
  
  details.appendChild(muscles);
  details.appendChild(equipment);
  details.appendChild(difficulty);
  
  card.appendChild(details);
  
  return card;
}

/**
 * Opens exercise editor modal
 */
function openExerciseEditor(exercise, onSave) {
  const isNew = !exercise;
  const data = exercise ? { ...exercise } : {
    id: '',
    name: '',
    description: '',
    primaryMuscles: [],
    secondaryMuscles: [],
    equipment: [],
    difficulty: 'beginner',
    type: 'compound',
    videoUrl: '',
    instructions: [],
    formCues: [],
    alternatives: { easier: [], harder: [] }
  };
  
  const content = document.createElement('div');
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.style.gap = '16px';
  content.style.maxHeight = '60vh';
  content.style.overflowY = 'auto';
  
  // Name
  content.appendChild(createField('Name', 'text', data.name, (v) => data.name = v));
  
  // Description
  content.appendChild(createField('Description', 'textarea', data.description, (v) => data.description = v));
  
  // Primary Muscles
  content.appendChild(createTagField('Primary Muscles', data.primaryMuscles, (v) => data.primaryMuscles = v));
  
  // Secondary Muscles
  content.appendChild(createTagField('Secondary Muscles', data.secondaryMuscles, (v) => data.secondaryMuscles = v));
  
  // Equipment
  content.appendChild(createTagField('Equipment', data.equipment, (v) => data.equipment = v));
  
  // Difficulty
  content.appendChild(createSelectField('Difficulty', ['beginner', 'intermediate', 'advanced'], data.difficulty, (v) => data.difficulty = v));
  
  // Type
  content.appendChild(createSelectField('Type', ['compound', 'isolation', 'cardio', 'flexibility'], data.type, (v) => data.type = v));
  
  // Video URL
  content.appendChild(createField('Video URL', 'url', data.videoUrl, (v) => data.videoUrl = v));
  
  // Instructions
  content.appendChild(createListField('Instructions', data.instructions, (v) => data.instructions = v));
  
  // Form Cues
  content.appendChild(createListField('Form Cues', data.formCues, (v) => data.formCues = v));
  
  // Buttons
  const buttons = document.createElement('div');
  buttons.style.display = 'flex';
  buttons.style.gap = '12px';
  buttons.style.justifyContent = 'flex-end';
  buttons.style.marginTop = '8px';
  
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-ghost';
  cancelBtn.textContent = 'Cancel';
  
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn';
  saveBtn.textContent = isNew ? 'Add Exercise' : 'Save Changes';
  
  buttons.appendChild(cancelBtn);
  buttons.appendChild(saveBtn);
  content.appendChild(buttons);
  
  const modal = openModal({ 
    title: isNew ? 'Add Exercise' : `Edit: ${exercise.name}`,
    content 
  });
  
  cancelBtn.onclick = () => modal.close();
  saveBtn.onclick = () => {
    const validation = validateExercise(data);
    if (!validation.valid) {
      alert('Validation errors:\n' + validation.errors.join('\n'));
      return;
    }
    
    exerciseLibrary.addExercise(data);
    modal.close();
    if (onSave) onSave();
  };
}

/**
 * Helper: Create text field
 */
function createField(label, type, value, onChange) {
  const container = document.createElement('div');
  
  const lbl = document.createElement('label');
  lbl.textContent = label;
  lbl.style.display = 'block';
  lbl.style.marginBottom = '4px';
  lbl.style.fontWeight = '600';
  lbl.style.fontSize = '13px';
  
  const input = type === 'textarea' 
    ? document.createElement('textarea')
    : document.createElement('input');
  
  if (type !== 'textarea') input.type = type;
  input.className = 'inp';
  input.value = value || '';
  input.oninput = () => onChange(input.value);
  if (type === 'textarea') {
    input.rows = 3;
  }
  
  container.appendChild(lbl);
  container.appendChild(input);
  
  return container;
}

/**
 * Helper: Create select field
 */
function createSelectField(label, options, value, onChange) {
  const container = document.createElement('div');
  
  const lbl = document.createElement('label');
  lbl.textContent = label;
  lbl.style.display = 'block';
  lbl.style.marginBottom = '4px';
  lbl.style.fontWeight = '600';
  lbl.style.fontSize = '13px';
  
  const select = document.createElement('select');
  select.className = 'inp';
  
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
    option.selected = opt === value;
    select.appendChild(option);
  });
  
  select.onchange = () => onChange(select.value);
  
  container.appendChild(lbl);
  container.appendChild(select);
  
  return container;
}

/**
 * Helper: Create tag field (for arrays)
 */
function createTagField(label, values, onChange) {
  const container = document.createElement('div');
  
  const lbl = document.createElement('label');
  lbl.textContent = label;
  lbl.style.display = 'block';
  lbl.style.marginBottom = '4px';
  lbl.style.fontWeight = '600';
  lbl.style.fontSize = '13px';
  
  const tagsContainer = document.createElement('div');
  tagsContainer.style.display = 'flex';
  tagsContainer.style.flexWrap = 'wrap';
  tagsContainer.style.gap = '6px';
  tagsContainer.style.marginBottom = '8px';
  
  const inputRow = document.createElement('div');
  inputRow.style.display = 'flex';
  inputRow.style.gap = '8px';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'inp';
  input.placeholder = `Add ${label.toLowerCase()}...`;
  input.style.flex = '1';
  
  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-ghost';
  addBtn.textContent = '+';
  addBtn.onclick = () => {
    const val = input.value.trim();
    if (val && !values.includes(val)) {
      values.push(val);
      input.value = '';
      render();
      onChange(values);
    }
  };
  
  input.onkeypress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBtn.click();
    }
  };
  
  inputRow.appendChild(input);
  inputRow.appendChild(addBtn);
  
  function render() {
    tagsContainer.innerHTML = '';
    values.forEach((val, idx) => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.style.display = 'inline-flex';
      tag.style.alignItems = 'center';
      tag.style.gap = '6px';
      tag.textContent = val;
      
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.style.background = 'none';
      removeBtn.style.border = 'none';
      removeBtn.style.color = 'inherit';
      removeBtn.style.cursor = 'pointer';
      removeBtn.style.fontSize = '16px';
      removeBtn.style.padding = '0';
      removeBtn.onclick = () => {
        values.splice(idx, 1);
        render();
        onChange(values);
      };
      
      tag.appendChild(removeBtn);
      tagsContainer.appendChild(tag);
    });
  }
  
  render();
  
  container.appendChild(lbl);
  container.appendChild(tagsContainer);
  container.appendChild(inputRow);
  
  return container;
}

/**
 * Helper: Create list field
 */
function createListField(label, items, onChange) {
  const container = document.createElement('div');
  
  const lbl = document.createElement('label');
  lbl.textContent = label;
  lbl.style.display = 'block';
  lbl.style.marginBottom = '4px';
  lbl.style.fontWeight = '600';
  lbl.style.fontSize = '13px';
  
  const list = document.createElement('div');
  list.style.marginBottom = '8px';
  
  const inputRow = document.createElement('div');
  inputRow.style.display = 'flex';
  inputRow.style.gap = '8px';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'inp';
  input.placeholder = `Add ${label.toLowerCase()}...`;
  input.style.flex = '1';
  
  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-ghost';
  addBtn.textContent = '+';
  addBtn.onclick = () => {
    const val = input.value.trim();
    if (val) {
      items.push(val);
      input.value = '';
      render();
      onChange(items);
    }
  };
  
  input.onkeypress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBtn.click();
    }
  };
  
  inputRow.appendChild(input);
  inputRow.appendChild(addBtn);
  
  function render() {
    list.innerHTML = '';
    items.forEach((item, idx) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '8px';
      row.style.alignItems = 'center';
      row.style.padding = '6px';
      row.style.background = 'var(--menuBg)';
      row.style.borderRadius = '6px';
      row.style.marginBottom = '4px';
      
      const text = document.createElement('span');
      text.style.flex = '1';
      text.style.fontSize = '13px';
      text.textContent = `${idx + 1}. ${item}`;
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'mini-btn';
      removeBtn.textContent = '×';
      removeBtn.onclick = () => {
        items.splice(idx, 1);
        render();
        onChange(items);
      };
      
      row.appendChild(text);
      row.appendChild(removeBtn);
      list.appendChild(row);
    });
  }
  
  render();
  
  container.appendChild(lbl);
  container.appendChild(list);
  container.appendChild(inputRow);
  
  return container;
}
