import { $, $$, raf } from "./core/dom.js";
import { APP_TITLE_DEFAULT, DAYS, EXPORT_SCHEMA } from "./core/constants.js";
import { store, view, userRoutines, ensureViewNumbers, currentUser, clearCurrentUser } from "./core/storage.js";
import { stateManager } from "./core/stateManager.js";
import { router } from "./core/router.js";
import { createWorkoutCard } from "./ui/workoutCard.js";
import { neonSelect } from "./ui/select.js";
import { openModal } from "./ui/modal.js";
import { updateDrawer } from "./ui/drawer.js";
import { loadManifest, availableRoutineOptions, ensureRoutineLoaded, isUserRoutineId, currentRoutine, rowsFor, allWeeks, dateKey } from "./routines/index.js";
import { ensureRowIdsForRoutine } from "./routines/ids.js";
import { getVideoURLByExercise, setVideoURLByExercise, looksLikeDirectVideo } from "./features/video.js";
import { getEstMin } from "./features/estimates.js";
import { openDayEditor } from "./features/dayEditor.js";
import { readRowState } from "./core/rowState.js";
import { showLoginScreen } from "./ui/login.js";
import { openExerciseLibraryManager } from "./ui/exerciseLibraryEditor.js";
import { loadExercises, getExercise } from "./loaders/exerciseLoader.js";
import { exSlug } from "./routines/ids.js";
import { isMobile } from "./utils/device.js";

// Check if user is logged in
if (!currentUser) {
  showLoginScreen((username) => {
    // Reload page after login to reinitialize with user data
    window.location.reload();
  });
} else {
  // Check if first-time user (no routines)
  if (Object.keys(userRoutines).length === 0) {
    // Show routine selection modal after app initializes
    window.addEventListener('load', () => {
      setTimeout(showFirstTimeRoutineSelection, 500);
    });
  }
}

async function showFirstTimeRoutineSelection() {
  const manifest = await (await fetch("routines/manifest.json")).json();
  const availableRoutines = manifest.routines || [];
  
  if (availableRoutines.length === 0) {
    alert("No routines available. You can import routines later.");
    return;
  }
  
  const content = document.createElement("div");
  
  const intro = document.createElement("p");
  intro.style.marginBottom = "20px";
  intro.textContent = "Welcome! Select which workout routines you'd like to add to your profile:";
  
  const checkboxList = document.createElement("div");
  checkboxList.style.display = "flex";
  checkboxList.style.flexDirection = "column";
  checkboxList.style.gap = "12px";
  checkboxList.style.marginBottom = "20px";
  
  const selectedRoutines = new Set();
  
  availableRoutines.forEach(routine => {
    const label = document.createElement("label");
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.style.gap = "12px";
    label.style.padding = "12px";
    label.style.background = "var(--menuBg)";
    label.style.borderRadius = "10px";
    label.style.cursor = "pointer";
    label.style.transition = "background 0.2s";
    
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.style.width = "20px";
    checkbox.style.height = "20px";
    checkbox.style.cursor = "pointer";
    
    const name = document.createElement("span");
    name.style.flex = "1";
    name.style.fontWeight = "500";
    name.textContent = routine.name;
    
    checkbox.onchange = () => {
      if (checkbox.checked) {
        selectedRoutines.add(routine);
        label.style.background = "var(--blue)";
      } else {
        selectedRoutines.delete(routine);
        label.style.background = "var(--menuBg)";
      }
    };
    
    label.appendChild(checkbox);
    label.appendChild(name);
    checkboxList.appendChild(label);
  });
  
  const buttonRow = document.createElement("div");
  buttonRow.style.display = "flex";
  buttonRow.style.gap = "12px";
  buttonRow.style.justifyContent = "flex-end";
  
  const skipBtn = document.createElement("button");
  skipBtn.className = "btn btn-ghost";
  skipBtn.textContent = "Skip for Now";
  
  const addBtn = document.createElement("button");
  addBtn.className = "btn";
  addBtn.textContent = "Add Selected Routines";
  
  buttonRow.appendChild(skipBtn);
  buttonRow.appendChild(addBtn);
  
  content.appendChild(intro);
  content.appendChild(checkboxList);
  content.appendChild(buttonRow);
  
  const modal = openModal({ title: "Select Your Routines", content });
  
  skipBtn.onclick = () => {
    modal.close();
  };
  
  addBtn.onclick = async () => {
    if (selectedRoutines.size === 0) {
      alert("Please select at least one routine, or click 'Skip for Now'.");
      return;
    }
    
    for (const routine of selectedRoutines) {
      try {
        const response = await fetch(routine.src);
        const routineData = await response.json();
        
        // Use processRoutineDefinition to handle rowsCsvUrl and other formats
        const { processRoutineDefinition } = await import("./routines/index.js");
        const processed = await processRoutineDefinition(routineData);
        
        if (!processed || !processed.rows || processed.rows.length === 0) {
          console.error(`Failed to process routine ${routine.name}`);
          continue;
        }
        
        const id = `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        
        userRoutines[id] = {
          id,
          name: processed.name || routine.name,
          rows: processed.rows
        };
        ensureRowIdsForRoutine(userRoutines[id]);
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay for unique IDs
      } catch (error) {
        console.error(`Failed to load routine ${routine.name}:`, error);
      }
    }
    
    stateManager.updateUserRoutines({ ...userRoutines });
    modal.close();
    
    // Reload the page to properly initialize with new routines
    window.location.reload();
  };
}

ensureViewNumbers();

/* Title */
const titleEl = $("#title");
function applyTitle() {
  titleEl.textContent = store.__title && store.__title.trim() ? store.__title.trim() : APP_TITLE_DEFAULT;
}
titleEl.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); titleEl.blur(); } });
titleEl.addEventListener("input", () => { stateManager.updateStore({ __title: titleEl.textContent.trim() }); });

/* Layout + scheduler */
function updateLayoutDims() {
  const h = document.querySelector("header").offsetHeight;
  const f = document.querySelector(".footer").offsetHeight;
  document.documentElement.style.setProperty("--headerH", h + "px");
  document.documentElement.style.setProperty("--footerH", f + "px");
}
let _renderQueued = false;
function scheduleRender() {
  if (_renderQueued) return;
  _renderQueued = true;
  raf(() => {
    _renderQueued = false;
    render();
    updateDrawer($("#dlist"), { currentRoutine });
    updateLayoutDims();
  });
}

/* Selects */
let routineSelect, weekSelect, daySelect;
function setWeek(n) { view.week = Number(n) || 1; }
function setDay(n)  { view.day = Number(n) || 1; }
async function rebuildWeekDaySelectors() {
  if (!currentRoutine()) { $("#weekSel").innerHTML = ""; $("#daySel").innerHTML = ""; return; }
  const weeks = allWeeks();
  if (!view.week) setWeek(weeks[0] || 1);
  const dayList = DAYS.filter((d) => rowsFor(view.week, d).length);
  if (!weekSelect) {
    weekSelect = neonSelect($("#weekSel"), "Week", weeks, view.week, (v) => { setWeek(v); setDay(1); stateManager.updateView({ week: view.week, day: view.day }); scheduleRender(); });
  } else weekSelect.rebuild(weeks, view.week);
  if (!view.day) setDay(dayList[0] || 1);
  if (!daySelect) {
    daySelect = neonSelect($("#daySel"), "Day", dayList, view.day, (v) => { setDay(v); stateManager.updateView({ day: view.day }); scheduleRender(); });
  } else {
    const daysNow = DAYS.filter((d) => rowsFor(view.week, d).length);
    if (!daysNow.includes(view.day)) setDay(daysNow[0] || 1);
    daySelect.rebuild(daysNow, view.day);
  }
}
async function rebuildSelectors() {
  const opts = availableRoutineOptions();
  if (!opts.length) {
    $("#routineSel").innerHTML = ""; $("#weekSel").innerHTML = ""; $("#daySel").innerHTML = ""; scheduleRender(); return;
  }
  if (!view.routine) view.routine = opts[0].value;
  if (!routineSelect) {
    routineSelect = neonSelect($("#routineSel"), "Routine", opts, view.routine, async (v) => {
      view.routine = v;
      if (!isUserRoutineId(v)) await ensureRoutineLoaded(v);
      setWeek(allWeeks()[0] || 1); setDay(1);
      stateManager.updateView({ routine: view.routine, week: view.week, day: view.day });
      await rebuildWeekDaySelectors(); scheduleRender();
    });
  } else routineSelect.rebuild(opts, view.routine);
  await rebuildWeekDaySelectors();
}

/* Prev / Next */
$("#prevBtn").onclick = () => {
  if (!currentRoutine()) return;
  const days = DAYS.filter((d) => rowsFor(view.week, d).length);
  const idx = days.indexOf(view.day);
  if (idx > 0) setDay(days[idx - 1]);
  else {
    const wks = allWeeks(); const wi = wks.indexOf(view.week);
    if (wi > 0) { setWeek(wks[wi - 1]); const prevDays = DAYS.filter((d) => rowsFor(view.week, d).length); setDay(prevDays[prevDays.length - 1]); }
  }
  weekSelect && weekSelect.set(view.week);
  daySelect && daySelect.set(view.day);
  stateManager.updateView({ week: view.week, day: view.day }); scheduleRender();
};
$("#nextBtn").onclick = () => {
  if (!currentRoutine()) return;
  const days = DAYS.filter((d) => rowsFor(view.week, d).length);
  const idx = days.indexOf(view.day);
  if (idx < days.length - 1) setDay(days[idx + 1]);
  else {
    const wks = allWeeks(); const wi = wks.indexOf(view.week);
    if (wi < wks.length - 1) { setWeek(wks[wi + 1]); const nextDays = DAYS.filter((d) => rowsFor(view.week, d).length); setDay(nextDays[0]); }
  }
  weekSelect && weekSelect.set(view.week);
  daySelect && daySelect.set(view.day);
  stateManager.updateView({ week: view.week, day: view.day }); scheduleRender();
};

/* Drawer open/close */
const drawer = $("#drawer"), shade = $("#shade"), navToggle = $("#navToggle"), drawerClose = $("#drawerClose");
function openDrawer() { drawer.classList.add("open"); shade.classList.add("show"); }
function closeDrawer() { drawer.classList.remove("open"); shade.classList.remove("show"); }
navToggle.onclick = openDrawer; drawerClose.onclick = closeDrawer; shade.onclick = closeDrawer;
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
$("#navToggle").setAttribute("aria-controls", "drawer");

/* Config (theme & user) */
function openSettings() {
  const body = document.createElement("div");
  
  // User section
  const userSection = document.createElement("div");
  userSection.style.marginBottom = "24px";
  userSection.style.paddingBottom = "24px";
  userSection.style.borderBottom = "1px solid var(--border2)";
  
  const userTitle = document.createElement("div");
  userTitle.style.fontWeight = "600";
  userTitle.style.marginBottom = "12px";
  userTitle.textContent = "Current User";
  
  const userInfo = document.createElement("div");
  userInfo.style.display = "flex";
  userInfo.style.alignItems = "center";
  userInfo.style.gap = "12px";
  userInfo.style.padding = "12px";
  userInfo.style.background = "var(--menuBg)";
  userInfo.style.borderRadius = "10px";
  userInfo.style.marginBottom = "12px";
  
  const userIcon = document.createElement("div");
  userIcon.style.width = "40px";
  userIcon.style.height = "40px";
  userIcon.style.borderRadius = "50%";
  userIcon.style.background = "var(--blue)";
  userIcon.style.display = "flex";
  userIcon.style.alignItems = "center";
  userIcon.style.justifyContent = "center";
  userIcon.style.fontSize = "20px";
  userIcon.textContent = "👤";
  
  const userName = document.createElement("div");
  userName.style.flex = "1";
  userName.style.fontWeight = "600";
  userName.textContent = currentUser || "Unknown";
  
  userInfo.appendChild(userIcon);
  userInfo.appendChild(userName);
  
  const switchBtn = document.createElement("button");
  switchBtn.className = "btn";
  switchBtn.style.width = "100%";
  switchBtn.textContent = "Switch User";
  switchBtn.onclick = () => {
    if (confirm("Switch user? This will reload the app with the selected user's data.")) {
      clearCurrentUser();
      window.location.reload();
    }
  };
  
  userSection.appendChild(userTitle);
  userSection.appendChild(userInfo);
  userSection.appendChild(switchBtn);
  
  // Routine Management section
  const routineSection = document.createElement("div");
  routineSection.style.marginBottom = "24px";
  routineSection.style.paddingBottom = "24px";
  routineSection.style.borderBottom = "1px solid var(--border2)";
  
  const routineTitle = document.createElement("div");
  routineTitle.style.fontWeight = "600";
  routineTitle.style.marginBottom = "12px";
  routineTitle.textContent = "Manage Routines";
  
  const routinesList = document.createElement("div");
  routinesList.style.display = "flex";
  routinesList.style.flexDirection = "column";
  routinesList.style.gap = "8px";
  routinesList.style.marginBottom = "12px";
  
  // List user's routines
  const userRoutineIds = Object.keys(userRoutines);
  if (userRoutineIds.length > 0) {
    userRoutineIds.forEach(routineId => {
      const routine = userRoutines[routineId];
      const item = document.createElement("div");
      item.style.display = "flex";
      item.style.alignItems = "center";
      item.style.gap = "8px";
      item.style.padding = "8px 12px";
      item.style.background = "var(--menuBg)";
      item.style.borderRadius = "8px";
      
      const name = document.createElement("div");
      name.style.flex = "1";
      name.style.fontWeight = "500";
      name.textContent = routine.name;
      
      const removeBtn = document.createElement("button");
      removeBtn.className = "btn btn-ghost";
      removeBtn.style.padding = "4px 8px";
      removeBtn.style.fontSize = "12px";
      removeBtn.textContent = "Remove";
      removeBtn.onclick = () => {
        if (confirm(`Remove routine "${routine.name}"? This will delete all progress for this routine.`)) {
          const wasSelected = view.routine === routineId;
          delete userRoutines[routineId];
          stateManager.updateUserRoutines({ ...userRoutines });
          
          // If the removed routine was selected, select the next available one
          if (wasSelected) {
            const remainingRoutines = Object.keys(userRoutines);
            if (remainingRoutines.length > 0) {
              view.routine = remainingRoutines[0];
              setWeek(1);
              setDay(1);
              stateManager.updateView({ routine: view.routine, week: view.week, day: view.day });
            } else {
              view.routine = null;
              stateManager.updateView({ routine: null });
            }
          }
          
          modal.close(); // Close the settings modal
          rebuildSelectors();
          scheduleRender();
        }
      };
      
      item.appendChild(name);
      item.appendChild(removeBtn);
      routinesList.appendChild(item);
    });
  } else {
    const empty = document.createElement("div");
    empty.className = "small";
    empty.style.opacity = "0.7";
    empty.style.padding = "12px";
    empty.style.textAlign = "center";
    empty.textContent = "No routines added yet";
    routinesList.appendChild(empty);
  }
  
  const addRoutineBtn = document.createElement("button");
  addRoutineBtn.className = "btn btn-ghost";
  addRoutineBtn.style.width = "100%";
  addRoutineBtn.textContent = "Add Available Routine";
  addRoutineBtn.onclick = async () => {
    // Get available routines from manifest
    const manifest = await (await fetch("routines/manifest.json")).json();
    const availableRoutines = manifest.routines || [];
    
    if (availableRoutines.length === 0) {
      alert("No available routines found in manifest.");
      return;
    }
    
    // Show selection modal
    const content = document.createElement("div");
    content.style.display = "flex";
    content.style.flexDirection = "column";
    content.style.gap = "8px";
    
    availableRoutines.forEach(routine => {
      const alreadyHas = userRoutineIds.some(id => userRoutines[id].name === routine.name);
      
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.style.width = "100%";
      btn.style.display = "flex";
      btn.style.alignItems = "center";
      btn.style.justifyContent = "space-between";
      btn.disabled = alreadyHas;
      btn.style.opacity = alreadyHas ? "0.5" : "1";
      
      const nameSpan = document.createElement("span");
      nameSpan.textContent = routine.name;
      
      const statusSpan = document.createElement("span");
      statusSpan.style.fontSize = "12px";
      statusSpan.textContent = alreadyHas ? "Already added" : "Add";
      
      btn.appendChild(nameSpan);
      btn.appendChild(statusSpan);
      
      if (!alreadyHas) {
        btn.onclick = async () => {
          try {
            // Load the routine
            const response = await fetch(routine.src);
            const routineData = await response.json();
            
            // Use processRoutineDefinition to handle rowsCsvUrl and other formats
            const { processRoutineDefinition } = await import("./routines/index.js");
            const processed = await processRoutineDefinition(routineData);
            
            if (!processed || !processed.rows || processed.rows.length === 0) {
              alert(`Failed to process routine ${routine.name}`);
              return;
            }
            
            // Add to user's routines
            const id = `user_${Date.now()}`;
            userRoutines[id] = {
              id,
              name: processed.name || routine.name,
              rows: processed.rows
            };
            ensureRowIdsForRoutine(userRoutines[id]);
            stateManager.updateUserRoutines({ ...userRoutines });
            
            // Set the newly added routine as active
            view.routine = id;
            setWeek(1);
            setDay(1);
            stateManager.updateView({ routine: view.routine, week: view.week, day: view.day });
            
            selectionModal.close();
            modal.close(); // Close the settings modal
            await rebuildSelectors();
            scheduleRender();
          } catch (error) {
            alert("Failed to add routine: " + error.message);
          }
        };
      }
      
      content.appendChild(btn);
    });
    
    const selectionModal = openModal({ title: "Add Routine", content });
  };
  
  routineSection.appendChild(routineTitle);
  routineSection.appendChild(routinesList);
  routineSection.appendChild(addRoutineBtn);

  body.appendChild(userSection);
  body.appendChild(routineSection);
  
  const modal = openModal({ title: "Settings", content: body });
}
$("#configBtn").onclick = openSettings;

/* Exercise Library (hidden button - triggered from drawer on mobile) */
const exerciseLibraryBtn = document.createElement('button');
exerciseLibraryBtn.id = 'exerciseLibraryBtn';
exerciseLibraryBtn.style.display = 'none';
document.body.appendChild(exerciseLibraryBtn);
exerciseLibraryBtn.onclick = () => {
  closeDrawer();
  openExerciseLibraryManager();
};

/* Routine day editor */
$("#editRoutineBtn").onclick = openDayEditor;

/* Routine import (CSV/JSON) */
$("#importRoutineBtn").onclick = () => $("#importRoutineFile").click();
$("#importRoutineFile").onchange = (e) => {
  const f = e.target.files?.[0]; if (!f) return;
  const rd = new FileReader();
  rd.onload = async () => {
    try {
      let rows, name;
      if ((f.type || "").includes("json") || /\.json$/i.test(f.name)) {
        const obj = JSON.parse(rd.result);
        if (Array.isArray(obj)) rows = obj;
        else if (Array.isArray(obj.rows)) { rows = obj.rows; name = obj.name || obj.id || "Imported Routine"; }
        else if (typeof obj.rowsCsv === "string") { rows = parseCSVFlexible(obj.rowsCsv); name = obj.name || obj.id || "Imported Routine"; }
        else throw new Error("Invalid routine JSON");
      } else rows = (await import("./routines/parseCsv.js")).parseCSVFlexible(rd.result);

      if (!rows?.length) { alert("No rows found."); return; }
      const parseCsv = await import("./routines/parseCsv.js");
      if (parseCsv.refineRow) {
        rows = rows.map((m) => parseCsv.refineRow(m));
      }
      name = name || prompt("Name this routine:", f.name.replace(/\.(csv|json)$/i, "") || "Imported Routine") || "Imported Routine";
      const id = `user_${Date.now()}`;
      userRoutines[id] = { id, name, rows };
      ensureRowIdsForRoutine(userRoutines[id]);
      stateManager.updateUserRoutines({ ...userRoutines });
      view.routine = id; setWeek(rows[0].week); setDay(rows[0].day); 
      stateManager.updateView({ routine: view.routine, week: view.week, day: view.day });
      rebuildSelectors(); scheduleRender();
    } catch { alert("Invalid file."); }
  };
  rd.readAsText(f);
};

/* Data export/import */
$("#exportBtn").onclick = () => {
  const payload = { schema: EXPORT_SCHEMA, store, userRoutines, view, exportedAt: new Date().toISOString(), title: store.__title || APP_TITLE_DEFAULT };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "workout-data.json"; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
};
$("#importBtn").onclick = () => $("#importFile").click();
$("#importFile").onchange = (e) => {
  const f = e.target.files?.[0]; if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const obj = JSON.parse(rd.result);
      // schema check
      if (obj.schema && obj.schema !== EXPORT_SCHEMA) {
        if (!confirm(`Schema mismatch: file=${obj.schema}, expected=${EXPORT_SCHEMA}. Continue?`)) return;
      }
      const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);
      const coerceInt = (n, d) => (Number.isFinite(Number(n)) ? Number(n) : d);
      if (isObj(obj.store)) Object.assign(store, obj.store);

      const ur = isObj(obj.userRoutines) ? obj.userRoutines : isObj(obj.routines) ? obj.routines : null;
      if (ur) {
        const clean = {};
        for (const [id, r] of Object.entries(ur)) {
          if (!isObj(r)) continue;
          const rid = typeof r.id === "string" ? r.id : id;
          const name = typeof r.name === "string" ? r.name : rid;
          const rows = Array.isArray(r.rows) ? r.rows : [];
          const safeRows = rows
            .map((x) => ({
              week: coerceInt(x.week, NaN),
              day: coerceInt(x.day, NaN),
              focus: String(x.focus || ""),
              exercise: String(x.exercise || ""),
              target: String(x.target || ""),
              sets: coerceInt(x.sets, 0),
              est: Number.isFinite(Number(x.est)) ? Number(x.est) : undefined,
              notes: x.notes ? String(x.notes) : undefined,
              ord: Number.isFinite(Number(x.ord)) ? Number(x.ord) : undefined,
              rowId: typeof x.rowId === "string" ? x.rowId : undefined,
              isRoutine: typeof x.isRoutine === "boolean" ? x.isRoutine : undefined
            }))
            .filter((x) => Number.isFinite(x.week) && Number.isFinite(x.day) && x.exercise)
            .map((m) => m); // refineRow not required, fields coerced above
          clean[rid] = { id: rid, name, rows: safeRows };
        }
        Object.values(clean).forEach(ensureRowIdsForRoutine);
        Object.keys(userRoutines).forEach((k) => delete userRoutines[k]);
        Object.assign(userRoutines, clean);
        stateManager.updateUserRoutines({ ...userRoutines });
      }
      if (isObj(obj.view)) { Object.assign(view, obj.view); ensureViewNumbers(); stateManager.updateView({ ...view }); }
      if (obj.title) store.__title = String(obj.title);
      stateManager.updateStore({ ...store }); applyTitle(); rebuildSelectors(); scheduleRender();
    } catch { alert("Invalid JSON"); }
  };
  rd.readAsText(f);
};

/* Clear buttons */
$("#clearDayBtn").onclick = async () => {
  if (!currentRoutine()) return;
  if (!confirm("Clear data for this day?")) return;
  for (const r of rowsFor(view.week, view.day)) {
    delete store[(await import("./routines/index.js")).rowKey?.(r) ?? ""]; // best effort
    delete store[(await import("./routines/index.js")).rowKeyOrdinal?.(r) ?? ""];
    delete store[(await import("./routines/index.js")).legacyRowKey?.(r) ?? ""];
  }
  if (store.__dates) delete store.__dates[dateKey(view.week, view.day)];
  stateManager.updateStore({ ...store }); scheduleRender();
};
$("#clearAllBtn").onclick = () => {
  if (!confirm("Clear ALL saved data?")) return;
  for (const k of Object.keys(store)) delete store[k];
  stateManager.updateStore({ ...store }); scheduleRender(); applyTitle();
};

/* Exercise help */
function showExerciseHelp(name) {
  const content = document.createElement("div");
  
  // Look up exercise in library
  const slug = exSlug(name);
  const exercise = getExercise(slug);
  
  if (exercise) {
    // Show exercise details from library
    if (exercise.description) {
      // Check if description contains "Name: Description" format (newline-separated)
      if (exercise.description.includes(':') && exercise.description.includes('\n')) {
        const descList = document.createElement("ul");
        descList.style.marginBottom = "16px";
        descList.style.listStyle = "disc";
        descList.style.paddingLeft = "20px";
        
        const lines = exercise.description.split('\n');
        lines.forEach(line => {
          if (line.trim()) {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
              const li = document.createElement("li");
              li.style.marginBottom = "8px";
              
              const name = document.createElement("strong");
              name.textContent = line.substring(0, colonIndex);
              
              const description = document.createTextNode(': ' + line.substring(colonIndex + 1).trim());
              
              li.appendChild(name);
              li.appendChild(description);
              descList.appendChild(li);
            } else {
              // Regular line without colon
              const li = document.createElement("li");
              li.textContent = line.trim();
              descList.appendChild(li);
            }
          }
        });
        
        content.appendChild(descList);
      } else {
        // Regular description
        const desc = document.createElement("p");
        desc.style.marginBottom = "16px";
        desc.textContent = exercise.description;
        content.appendChild(desc);
      }
    }
    
    if (exercise.instructions && exercise.instructions.length > 0) {
      const instrTitle = document.createElement("h4");
      instrTitle.textContent = "Instructions";
      instrTitle.style.marginBottom = "8px";
      content.appendChild(instrTitle);
      
      const instrList = document.createElement("ul");
      instrList.style.marginBottom = "16px";
      exercise.instructions.forEach(instr => {
        const li = document.createElement("li");
        li.textContent = instr;
        instrList.appendChild(li);
      });
      content.appendChild(instrList);
    }
    
    if (exercise.formCues && exercise.formCues.length > 0) {
      const cuesTitle = document.createElement("h4");
      cuesTitle.textContent = "Form Cues";
      cuesTitle.style.marginBottom = "8px";
      content.appendChild(cuesTitle);
      
      const cuesList = document.createElement("ul");
      cuesList.style.marginBottom = "16px";
      exercise.formCues.forEach(cue => {
        const li = document.createElement("li");
        li.textContent = cue;
        cuesList.appendChild(li);
      });
      content.appendChild(cuesList);
    }
    
    // Show muscle groups
    if (exercise.primaryMuscles && exercise.primaryMuscles.length > 0) {
      const musclesDiv = document.createElement("div");
      musclesDiv.style.marginTop = "16px";
      musclesDiv.style.padding = "12px";
      musclesDiv.style.background = "var(--menuBg)";
      musclesDiv.style.borderRadius = "8px";
      
      const musclesTitle = document.createElement("div");
      musclesTitle.style.fontWeight = "600";
      musclesTitle.style.marginBottom = "4px";
      musclesTitle.textContent = "Primary Muscles";
      musclesDiv.appendChild(musclesTitle);
      
      const musclesText = document.createElement("div");
      musclesText.textContent = exercise.primaryMuscles.join(", ");
      musclesDiv.appendChild(musclesText);
      
      content.appendChild(musclesDiv);
    }
    
    // If no content was added, show default
    if (!content.hasChildNodes()) {
      const defaultMsg = document.createElement("ul");
      ["Neutral spine and brace.", "Pain‑free range.", "Stop if pain or numbness."].forEach(b => {
        const li = document.createElement("li");
        li.textContent = b;
        defaultMsg.appendChild(li);
      });
      content.appendChild(defaultMsg);
    }
  } else {
    // Fall back to generic advice
    const ul = document.createElement("ul");
    ["Neutral spine and brace.", "Pain‑free range.", "Stop if pain or numbness."].forEach(b => {
      const li = document.createElement("li");
      li.textContent = b;
      ul.appendChild(li);
    });
    content.appendChild(ul);
  }
  
  openModal({ title: name, content });
}

/* Render */
const $list = $("#list");
function render() {
  $list.innerHTML = "";
  const cur = currentRoutine();
  if (!cur) {
    $("#bigFocus").textContent = "No routine";
    $("#bigSub").textContent = "Add a routine via Import or ensure routines/manifest.json is available.";
    $("#progressBar").style.width = "0%";
    updateLayoutDims(); return;
  }
  const dayRows = rowsFor(view.week, view.day);
  const dYMD = store.__dates?.[dateKey(view.week, view.day)];
  $("#bigFocus").textContent = dayRows[0]?.focus || `Week ${view.week} · Day ${view.day}`;
  const completed = dayRows.filter((r) => (readRowState(r) || {}).completed).length;
  const dayETA = Math.round(dayRows.reduce((a, r) => a + getEstMin(r), 0));
  const programETA = Math.round(cur.rows.reduce((a, r) => a + getEstMin(r), 0));
  $("#bigSub").textContent = `${cur.name} • Week ${view.week} · Day ${view.day} • ${completed}/${dayRows.length} done • Est Day ${dayETA} min • Program ${Math.floor(programETA / 60)}h ${programETA % 60}m`;
  $("#progressBar").style.width = (dayRows.length ? (completed / dayRows.length) * 100 : 0) + "%";

  // Use createWorkoutCard component for each exercise
  for (const r of dayRows) {
    const card = createWorkoutCard(r, () => scheduleRender());
    $list.appendChild(card);
  }
  updateLayoutDims();
}

/* Global events from submodules */
document.addEventListener("nav:goto", (e) => {
  const { week, day } = e.detail || {};
  if (!week || !day) return;
  setWeek(week); setDay(day); stateManager.updateView({ week: view.week, day: view.day }); scheduleRender();
});
document.addEventListener("routines:changed", async () => {
  await rebuildSelectors(); scheduleRender();
});

/* Router integration - Handle URL changes */
window.addEventListener("route:changed", async (e) => {
  const { routine, week, day } = e.detail || {};
  
  // If routine changed and it's not a user routine, ensure it's loaded
  if (routine && !isUserRoutineId(routine)) {
    await ensureRoutineLoaded(routine);
  }
  
  // Update selectors to reflect new state
  await rebuildWeekDaySelectors();
  weekSelect && weekSelect.set(view.week);
  daySelect && daySelect.set(view.day);
  routineSelect && routineSelect.set(view.routine);
  
  // Re-render the view
  scheduleRender();
});

/* Init */
applyTitle();
Object.values(userRoutines).forEach((rt) => { rt.rows = (rt.rows || []).map((r) => r); ensureRowIdsForRoutine(rt); });
(async function init() {
  // Load exercise library first
  await loadExercises();
  
  await loadManifest();
  const opts = availableRoutineOptions();
  if (opts.length) {
    if (!view.routine || !userRoutines[view.routine]) {
      view.routine = opts[0].value;
    }
    // All routines are now user routines, no need to load remote
  }
  
  await rebuildSelectors();
  updateDrawer($("#dlist"), { currentRoutine });
  render();
  
  // Initialize router - sync URL with current state
  router.syncWithState();
  
  window.addEventListener("resize", updateLayoutDims);
})();

/* Service Worker Registration */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('ServiceWorker registered:', registration.scope);
      })
      .catch(err => {
        console.log('ServiceWorker registration failed:', err);
      });
  });
}
