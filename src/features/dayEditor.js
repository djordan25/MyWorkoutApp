import { openModal } from "../ui/modal.js";
import { currentRoutine, rowsFor } from "../routines/index.js";
import { isUserRoutineId } from "../routines/index.js";
import { refineRow } from "../routines/parseCsv.js";
import { ensureRowIdsForRoutine } from "../routines/ids.js";
import { getEstMin } from "./estimates.js";
import { userRoutines, view } from "../core/storage.js";
import { stateManager } from "../core/stateManager.js";
import { getAllExercises } from "../loaders/exerciseLoader.js";

export function openDayEditor() {
  const cur = currentRoutine();
  if (!cur) return;
  const dayRows = rowsFor(view.week, view.day).map((r) => ({ ...r }));
  const editingRemote = !isUserRoutineId(cur.id);
  const focusInit = dayRows[0]?.focus || "";

  const body = document.createElement("div");
  body.style.maxWidth = "100%";

  // Focus input
  const focusWrap = document.createElement("div");
  focusWrap.style.display = "flex";
  focusWrap.style.gap = "8px";
  focusWrap.style.alignItems = "center";
  focusWrap.style.marginBottom = "12px";
  
  const focusLbl = document.createElement("label");
  focusLbl.className = "small";
  focusLbl.textContent = "Focus";
  focusLbl.style.minWidth = "50px";
  
  const focusInput = document.createElement("input");
  focusInput.id = "edFocus";
  focusInput.className = "inp";
  focusInput.value = focusInit;
  focusInput.style.flex = "1";
  
  const addBtn = document.createElement("button");
  addBtn.id = "addRow";
  addBtn.className = "btn btn-ghost icon-btn";
  addBtn.title = "Add exercise";
  addBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
  
  focusWrap.appendChild(focusLbl);
  focusWrap.appendChild(focusInput);
  focusWrap.appendChild(addBtn);

  // Container for cards (mobile-friendly)
  const cardsContainer = document.createElement("div");
  cardsContainer.id = "edBody";
  cardsContainer.style.display = "flex";
  cardsContainer.style.flexDirection = "column";
  cardsContainer.style.gap = "12px";
  cardsContainer.style.marginBottom = "12px";

  const btnRow = document.createElement("div");
  btnRow.style.display = "flex";
  btnRow.style.justifyContent = "flex-end";
  btnRow.style.gap = "8px";
  btnRow.style.marginTop = "6px";
  
  const cancel = document.createElement("button");
  cancel.className = "btn btn-ghost";
  cancel.textContent = "Cancel";
  
  const save = document.createElement("button");
  save.className = "btn";
  save.textContent = "Save";
  
  btnRow.appendChild(cancel);
  btnRow.appendChild(save);

  body.appendChild(focusWrap);
  body.appendChild(cardsContainer);
  body.appendChild(btnRow);

  const modal = openModal({ title: `Edit Day · Week ${view.week} · Day ${view.day}`, content: body });

  // Get all exercises for dropdown
  const exercises = getAllExercises();

  function createExerciseAutocomplete(currentValue, onChange) {
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.width = "100%";
    
    const input = document.createElement("input");
    input.type = "text";
    input.className = "inp";
    input.style.width = "100%";
    input.style.padding = "10px";
    input.style.fontSize = "14px";
    input.placeholder = "Type to search exercises...";
    input.value = currentValue || "";
    input.setAttribute("autocomplete", "off");
    
    const dropdown = document.createElement("div");
    dropdown.style.position = "absolute";
    dropdown.style.top = "100%";
    dropdown.style.left = "0";
    dropdown.style.right = "0";
    dropdown.style.marginTop = "4px";
    dropdown.style.maxHeight = "240px";
    dropdown.style.overflowY = "auto";
    dropdown.style.background = "var(--menuBg)";
    dropdown.style.border = "1px solid var(--border2)";
    dropdown.style.borderRadius = "12px";
    dropdown.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.4)";
    dropdown.style.display = "none";
    dropdown.style.zIndex = "1000";
    
    let filteredExercises = exercises;
    let selectedIndex = -1;
    
    function renderDropdown(filter = "") {
      dropdown.innerHTML = "";
      selectedIndex = -1;
      
      const lowerFilter = filter.toLowerCase().trim();
      filteredExercises = lowerFilter 
        ? exercises.filter(ex => ex.name.toLowerCase().includes(lowerFilter))
        : exercises;
      
      if (filteredExercises.length === 0) {
        const empty = document.createElement("div");
        empty.style.padding = "12px";
        empty.style.color = "#9db3c7";
        empty.style.textAlign = "center";
        empty.style.fontSize = "13px";
        empty.textContent = "No exercises found";
        dropdown.appendChild(empty);
        return;
      }
      
      filteredExercises.forEach((ex, idx) => {
        const item = document.createElement("div");
        item.style.padding = "10px 12px";
        item.style.cursor = "pointer";
        item.style.color = "#e7f2ff";
        item.style.fontSize = "14px";
        item.style.borderBottom = idx < filteredExercises.length - 1 ? "1px dashed #24354c" : "none";
        item.textContent = ex.name;
        item.dataset.index = idx;
        
        item.onmouseenter = () => {
          updateSelection(idx);
        };
        
        item.onclick = () => {
          selectItem(idx);
        };
        
        dropdown.appendChild(item);
      });
    }
    
    function updateSelection(index) {
      selectedIndex = index;
      Array.from(dropdown.children).forEach((item, idx) => {
        if (idx === selectedIndex) {
          item.style.background = "#172234";
          item.scrollIntoView({ block: "nearest" });
        } else {
          item.style.background = "transparent";
        }
      });
    }
    
    function selectItem(index) {
      if (index >= 0 && index < filteredExercises.length) {
        const selected = filteredExercises[index];
        input.value = selected.name;
        onChange(selected.name);
        dropdown.style.display = "none";
        selectedIndex = -1;
      }
    }
    
    input.onfocus = () => {
      renderDropdown(input.value);
      dropdown.style.display = "block";
    };
    
    input.oninput = () => {
      renderDropdown(input.value);
      dropdown.style.display = "block";
      onChange(input.value);
    };
    
    input.onkeydown = (e) => {
      if (dropdown.style.display === "none" || filteredExercises.length === 0) return;
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const newIndex = selectedIndex < filteredExercises.length - 1 ? selectedIndex + 1 : 0;
        updateSelection(newIndex);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const newIndex = selectedIndex > 0 ? selectedIndex - 1 : filteredExercises.length - 1;
        updateSelection(newIndex);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectItem(selectedIndex);
        } else if (filteredExercises.length > 0) {
          selectItem(0);
        }
      } else if (e.key === "Escape") {
        dropdown.style.display = "none";
        selectedIndex = -1;
      }
    };
    
    input.onblur = () => {
      // Delay to allow click on dropdown item
      setTimeout(() => {
        dropdown.style.display = "none";
        selectedIndex = -1;
      }, 200);
    };
    
    wrapper.appendChild(input);
    wrapper.appendChild(dropdown);
    
    return wrapper;
  }

  function renderRows() {
    cardsContainer.innerHTML = "";
    
    dayRows.forEach((r, idx) => {
      const card = document.createElement("div");
      card.style.background = "var(--setBg)";
      card.style.border = "1px solid var(--border2)";
      card.style.borderRadius = "12px";
      card.style.padding = "12px";
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.style.gap = "10px";
      
      // Header with number and actions
      const header = document.createElement("div");
      header.style.display = "flex";
      header.style.justifyContent = "space-between";
      header.style.alignItems = "center";
      header.style.marginBottom = "4px";
      
      const number = document.createElement("div");
      number.style.fontWeight = "900";
      number.style.color = "var(--gold2)";
      number.textContent = `Exercise ${idx + 1}`;
      
      const actions = document.createElement("div");
      actions.style.display = "flex";
      actions.style.gap = "6px";
      
      const up = document.createElement("button");
      up.className = "mini-btn";
      up.title = "Move up";
      up.textContent = "▲";
      up.disabled = idx === 0;
      up.style.opacity = idx === 0 ? "0.3" : "1";
      up.onclick = () => {
        if (idx > 0) {
          [dayRows[idx - 1], dayRows[idx]] = [dayRows[idx], dayRows[idx - 1]];
          renderRows();
        }
      };
      
      const down = document.createElement("button");
      down.className = "mini-btn";
      down.title = "Move down";
      down.textContent = "▼";
      down.disabled = idx === dayRows.length - 1;
      down.style.opacity = idx === dayRows.length - 1 ? "0.3" : "1";
      down.onclick = () => {
        if (idx < dayRows.length - 1) {
          [dayRows[idx + 1], dayRows[idx]] = [dayRows[idx], dayRows[idx + 1]];
          renderRows();
        }
      };
      
      const del = document.createElement("button");
      del.className = "mini-btn";
      del.title = "Delete";
      del.style.background = "#2b1d21";
      del.style.borderColor = "#5c2a32";
      del.textContent = "✕";
      del.onclick = () => {
        if (confirm("Delete this exercise?")) {
          dayRows.splice(idx, 1);
          renderRows();
        }
      };
      
      actions.appendChild(up);
      actions.appendChild(down);
      actions.appendChild(del);
      
      header.appendChild(number);
      header.appendChild(actions);
      card.appendChild(header);
      
      // Exercise select
      const exGroup = document.createElement("div");
      const exLabel = document.createElement("label");
      exLabel.className = "small";
      exLabel.textContent = "Exercise";
      exLabel.style.display = "block";
      exLabel.style.marginBottom = "4px";
      exLabel.style.color = "#9db3c7";
      
      const exSelect = createExerciseAutocomplete(r.exercise, (value) => {
        r.exercise = value;
      });
      
      exGroup.appendChild(exLabel);
      exGroup.appendChild(exSelect);
      card.appendChild(exGroup);
      
      // Target and Sets in a row
      const targetSetsRow = document.createElement("div");
      targetSetsRow.style.display = "grid";
      targetSetsRow.style.gridTemplateColumns = "1fr 1fr";
      targetSetsRow.style.gap = "10px";
      
      // Target
      const targetGroup = document.createElement("div");
      const targetLabel = document.createElement("label");
      targetLabel.className = "small";
      targetLabel.textContent = "Target Reps";
      targetLabel.style.display = "block";
      targetLabel.style.marginBottom = "4px";
      targetLabel.style.color = "#9db3c7";
      
      const targetInput = document.createElement("input");
      targetInput.className = "inp";
      targetInput.placeholder = "e.g. 12 to 15";
      targetInput.value = r.target;
      targetInput.oninput = () => (r.target = targetInput.value);
      
      targetGroup.appendChild(targetLabel);
      targetGroup.appendChild(targetInput);
      
      // Sets
      const setsGroup = document.createElement("div");
      const setsLabel = document.createElement("label");
      setsLabel.className = "small";
      setsLabel.textContent = "Sets";
      setsLabel.style.display = "block";
      setsLabel.style.marginBottom = "4px";
      setsLabel.style.color = "#9db3c7";
      
      const setsInput = document.createElement("input");
      setsInput.className = "inp";
      setsInput.type = "number";
      setsInput.min = "0";
      setsInput.step = "1";
      setsInput.value = r.sets;
      setsInput.oninput = () => (r.sets = parseInt(setsInput.value || "0", 10) || 0);
      
      setsGroup.appendChild(setsLabel);
      setsGroup.appendChild(setsInput);
      
      targetSetsRow.appendChild(targetGroup);
      targetSetsRow.appendChild(setsGroup);
      card.appendChild(targetSetsRow);
      
      // Est Min (optional)
      const estGroup = document.createElement("div");
      const estLabel = document.createElement("label");
      estLabel.className = "small";
      estLabel.textContent = `Est Minutes (default: ${getEstMin(r)})`;
      estLabel.style.display = "block";
      estLabel.style.marginBottom = "4px";
      estLabel.style.color = "#9db3c7";
      
      const estInput = document.createElement("input");
      estInput.className = "inp";
      estInput.type = "number";
      estInput.min = "0";
      estInput.step = "0.1";
      estInput.placeholder = `Auto: ${getEstMin(r)}`;
      estInput.value = Number.isFinite(r.est) ? String(r.est) : "";
      estInput.oninput = () => {
        const v = parseFloat(estInput.value);
        r.est = Number.isFinite(v) ? v : undefined;
      };
      
      estGroup.appendChild(estLabel);
      estGroup.appendChild(estInput);
      card.appendChild(estGroup);
      
      // Notes (optional)
      const notesGroup = document.createElement("div");
      const notesLabel = document.createElement("label");
      notesLabel.className = "small";
      notesLabel.textContent = "Notes (optional)";
      notesLabel.style.display = "block";
      notesLabel.style.marginBottom = "4px";
      notesLabel.style.color = "#9db3c7";
      
      const notesInput = document.createElement("input");
      notesInput.className = "inp";
      notesInput.placeholder = "Optional notes";
      notesInput.value = r.notes || "";
      notesInput.oninput = () => (r.notes = notesInput.value || undefined);
      
      notesGroup.appendChild(notesLabel);
      notesGroup.appendChild(notesInput);
      card.appendChild(notesGroup);
      
      cardsContainer.appendChild(card);
    });
    
    // Empty state
    if (dayRows.length === 0) {
      const empty = document.createElement("div");
      empty.style.textAlign = "center";
      empty.style.padding = "24px";
      empty.style.color = "#9db3c7";
      empty.textContent = "No exercises yet. Click + to add one.";
      cardsContainer.appendChild(empty);
    }
  }
  
  renderRows();

  addBtn.onclick = () => {
    dayRows.push({
      week: view.week,
      day: view.day,
      focus: focusInput.value || focusInit,
      exercise: "",
      target: "12 to 15",
      sets: 3,
    });
    renderRows();
  };
  
  cancel.onclick = () => modal.close();
  
  save.onclick = () => {
    // Validate
    const invalid = dayRows.find(r => !r.exercise || !r.exercise.trim());
    if (invalid) {
      alert("Please select an exercise for all rows");
      return;
    }
    
    const focus = focusInput.value;
    let targetRoutineId = cur.id;
    
    if (editingRemote) {
      targetRoutineId = `user_${Date.now()}`;
      userRoutines[targetRoutineId] = {
        id: targetRoutineId,
        name: `${cur.name} (Edited)`,
        rows: cur.rows.map((r) => ({ ...r })),
      };
    }
    
    userRoutines[targetRoutineId].rows = userRoutines[targetRoutineId].rows.filter(
      (r) => !(r.week === view.week && r.day === view.day)
    );
    
    dayRows.forEach((r, i) =>
      userRoutines[targetRoutineId].rows.push(
        refineRow({
          week: view.week,
          day: view.day,
          focus,
          exercise: r.exercise,
          target: r.target,
          sets: r.sets,
          est: Number.isFinite(r.est) ? r.est : undefined,
          notes: r.notes,
          ord: i,
          rowId: r.rowId,
        })
      )
    );
    
    ensureRowIdsForRoutine(userRoutines[targetRoutineId]);
    stateManager.updateUserRoutines({ ...userRoutines });
    
    if (editingRemote) {
      view.routine = targetRoutineId;
      stateManager.updateView({ routine: view.routine });
    }
    
    document.dispatchEvent(new CustomEvent("routines:changed"));
    modal.close();
  };
}
