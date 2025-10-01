/**
 * WorkoutCard Component
 * Displays a single workout exercise with sets, reps, and completion tracking
 */

import { stateManager } from "../core/stateManager.js";
import { openModal } from "./modal.js";
import { ensureRowState, getRowViewState } from "../core/rowState.js";
import { getEstMin } from "../features/estimates.js";
import { getVideoURLByExercise, setVideoURLByExercise, looksLikeDirectVideo } from "../features/video.js";
import { openVideoModal } from "./videoModal.js";

/**
 * Exercise info database
 */
const exerciseInfo = {
  "Barbell Bench Press": [
    "Setup: eyes under bar, feet planted, scapulae retracted.",
    "Grip: slightly wider than shoulders; wrists neutral.",
    "Lower to lower chest; elbows ~45–60°.",
    "Light pause; press back and up toward rack."
  ],
  "Incline DB Bench": [
    "Bench 15–30° incline. Scap set.",
    "Lower to upper chest with elbow tuck.",
    "Press up and slightly inward."
  ]
};

/**
 * Show exercise help modal
 */
function showExerciseHelp(name) {
  const bullets = exerciseInfo[name] || [
    "Neutral spine and brace.", 
    "Pain‑free range.", 
    "Stop if pain or numbness."
  ];
  const ul = document.createElement("ul");
  bullets.forEach((b) => { 
    const li = document.createElement("li"); 
    li.textContent = b; 
    ul.appendChild(li); 
  });
  openModal({ title: name, content: ul });
}

/**
 * Create a workout card element
 * @param {Object} row - Exercise row data
 * @param {Function} onUpdate - Callback when card data changes
 * @returns {HTMLElement} Card element
 */
export function createWorkoutCard(row, onUpdate) {
  const allow = /^\d+\s*to\s*\d+/.test((row.target || "").trim()) && row.sets > 0;
  const stView = getRowViewState(row, row.sets);

  const card = document.createElement("div");
  card.className = "card";
  if (stView.completed) card.classList.add("is-complete");

  const top = document.createElement("div");
  top.className = "card-top";

  // Completion checkbox
  const lead = document.createElement("label");
  lead.className = "check-head";
  lead.title = "Mark completed";
  
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = !!stView.completed;
  
  const box = document.createElement("span");
  box.className = "box";
  
  const txt = document.createElement("span");
  txt.className = "txt";
  txt.textContent = "Completed";
  
  lead.appendChild(cb);
  lead.appendChild(box);
  lead.appendChild(txt);
  top.appendChild(lead);

  // Exercise info
  const info = document.createElement("div");
  info.className = "info";
  
  const title = document.createElement("div");
  title.className = "title";
  title.textContent = row.exercise;
  
  const meta = document.createElement("div");
  meta.className = "meta";
  
  const m1 = document.createElement("span");
  m1.textContent = "Target: ";
  const strong = document.createElement("strong");
  strong.textContent = row.target;
  m1.appendChild(strong);
  
  const tag1 = document.createElement("span");
  tag1.className = "tag";
  tag1.textContent = `Sets ${row.sets}`;
  
  const tag2 = document.createElement("span");
  tag2.className = "tag";
  tag2.textContent = `ETA ~${getEstMin(row)} min`;
  
  meta.appendChild(m1);
  meta.appendChild(tag1);
  meta.appendChild(tag2);
  info.appendChild(title);
  info.appendChild(meta);
  top.appendChild(info);

  // Right side (status + actions)
  const right = document.createElement("div");
  right.className = "right";
  
  const status = document.createElement("span");
  status.className = cb.checked ? "done" : "status";
  status.textContent = cb.checked ? "Completed" : "In Progress";

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.gap = "8px";

  // Info button
  const infoBtn = document.createElement("button");
  infoBtn.className = "btn btn-ghost icon-btn";
  infoBtn.title = "Exercise info";
  infoBtn.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
  infoBtn.onclick = () => showExerciseHelp(row.exercise);

  // Video button
  const vidBtn = document.createElement("button");
  vidBtn.className = "link-btn";
  vidBtn.type = "button";
  vidBtn.innerHTML = '<i class="fa-solid fa-circle-play"></i><span>Video</span>';

  // Edit video button
  const editBtn = document.createElement("button");
  editBtn.className = "btn btn-ghost icon-btn";
  editBtn.title = "Set/Change video";
  editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';

  function refreshVideoBtns() {
    const u = getVideoURLByExercise(row.exercise);
    const ok = !!(u && looksLikeDirectVideo(u));
    if (ok) {
      vidBtn.disabled = false;
      vidBtn.removeAttribute("aria-disabled");
      vidBtn.style.opacity = "1";
      vidBtn.onclick = () => openVideoModal(u, row.exercise);
    } else {
      vidBtn.disabled = true;
      vidBtn.setAttribute("aria-disabled", "true");
      vidBtn.style.opacity = ".65";
      vidBtn.onclick = null;
    }
    vidBtn.title = ok ? "Open video" : "No video set";
    vidBtn.classList.toggle("hasVid", ok);
  }
  refreshVideoBtns();

  editBtn.onclick = () => {
    const wrap = document.createElement("div");
    const vtitle = document.createElement("div");
    vtitle.style.fontWeight = "900";
    vtitle.style.marginBottom = "8px";
    
    const em = document.createElement("em");
    em.textContent = row.exercise;
    vtitle.append(document.createTextNode("Set video URL for "), em);
    
    const input = document.createElement("input");
    input.type = "url";
    input.placeholder = "https://youtube.com/watch?v=...";
    input.style.width = "100%";
    input.style.padding = "12px";
    input.style.borderRadius = "10px";
    input.style.border = "1px solid var(--border2)";
    input.style.background = "var(--menuBg)";
    input.style.color = "var(--ink)";
    input.value = getVideoURLByExercise(row.exercise) || "";
    
    const hint = document.createElement("div");
    hint.className = "small";
    hint.style.marginTop = "6px";
    hint.textContent = "Direct video link only (YouTube watch/shorts/embed, Vimeo, or MP4/WebM). Applies across routines/days.";
    
    const btnRow = document.createElement("div");
    btnRow.style.display = "flex";
    btnRow.style.gap = "8px";
    btnRow.style.justifyContent = "flex-end";
    btnRow.style.marginTop = "12px";
    
    const cancel = document.createElement("button");
    cancel.className = "btn btn-ghost";
    cancel.textContent = "Cancel";
    
    const save = document.createElement("button");
    save.className = "btn";
    save.textContent = "Save";
    
    btnRow.appendChild(cancel);
    btnRow.appendChild(save);
    wrap.appendChild(vtitle);
    wrap.appendChild(input);
    wrap.appendChild(hint);
    wrap.appendChild(btnRow);

    const modal = openModal({ title: "Video link", content: wrap });
    cancel.onclick = () => modal.close();
    save.onclick = () => {
      const val = input.value.trim();
      if (val && !looksLikeDirectVideo(val)) {
        alert("Provide a direct video URL, not a search result.");
        return;
      }
      if (val) {
        setVideoURLByExercise(row.exercise, val);
        refreshVideoBtns();
        stateManager.updateStore({ [`video_${row.exercise}`]: val });
      }
      modal.close();
    };
    input.focus();
  };

  actions.appendChild(infoBtn);
  actions.appendChild(vidBtn);
  actions.appendChild(editBtn);
  right.appendChild(status);
  right.appendChild(actions);
  top.appendChild(right);

  // Completion checkbox handler
  cb.addEventListener("change", () => {
    const st2 = ensureRowState(row, row.sets);
    st2.completed = cb.checked;
    status.className = cb.checked ? "done" : "status";
    status.textContent = cb.checked ? "Completed" : "In Progress";
    card.classList.toggle("is-complete", cb.checked);
    card.querySelectorAll("input.num,input.wt").forEach((el) => (el.disabled = cb.checked));
    card.querySelectorAll(".rad input").forEach((el) => (el.disabled = cb.checked));
    stateManager.updateStore({});
    if (onUpdate) onUpdate();
  });

  card.appendChild(top);

  // Add sets inputs if applicable
  const allowSets = allow && !row.isRoutine;
  if (allowSets) {
    const setsWrap = createSetsInputs(row, stView, cb.checked, onUpdate);
    card.appendChild(setsWrap);
  } else {
    const note = document.createElement("div");
    note.className = "meta";
    note.style.padding = "0 16px 14px 16px";
    note.textContent = "No set inputs (routine or non-range target).";
    card.appendChild(note);
  }

  return card;
}

/**
 * Create sets input section
 */
function createSetsInputs(row, stView, isCompleted, onUpdate) {
  const setsWrap = document.createElement("div");
  setsWrap.className = "sets";

  for (let i = 0; i < row.sets; i++) {
    const setRow = document.createElement("div");
    setRow.className = "set";

    const label = document.createElement("div");
    label.className = "set-label";
    const labelId = `${Math.random().toString(36).slice(2)}_${i}_lab`;
    label.id = labelId;
    label.textContent = `Set ${i + 1} • Target ${row.target}`;
    setRow.appendChild(label);

    // Weight input
    const wWrap = document.createElement("div");
    wWrap.className = "field";
    const wIn = document.createElement("input");
    wIn.type = "number";
    wIn.className = "wt";
    wIn.placeholder = "Weight";
    wIn.step = "0.5";
    wIn.min = "0";
    wIn.setAttribute("aria-labelledby", labelId);
    wIn.value = stView.wts[i] ?? "";
    wIn.disabled = isCompleted;
    wIn.oninput = () => {
      const stx = ensureRowState(row, row.sets);
      stx.wts[i] = wIn.value;
      stateManager.updateStore({});
    };
    wWrap.appendChild(wIn);
    setRow.appendChild(wWrap);

    // Reps input
    const rWrap = document.createElement("div");
    rWrap.className = "field";
    const num = document.createElement("input");
    num.type = "number";
    num.className = "num";
    num.placeholder = "Reps";
    num.min = "0";
    num.step = "1";
    num.setAttribute("aria-labelledby", labelId);
    num.value = stView.reps[i] ?? "";
    num.disabled = isCompleted;
    num.oninput = () => {
      const stx = ensureRowState(row, row.sets);
      stx.reps[i] = num.value;
      stateManager.updateStore({});
    };
    rWrap.appendChild(num);
    setRow.appendChild(rWrap);

    // Difficulty radios
    const radios = document.createElement("div");
    radios.className = "rads";
    radios.setAttribute("role", "radiogroup");
    radios.setAttribute("aria-labelledby", labelId);

    ["Easy", "Medium", "Hard"].forEach((opt) => {
      const rid = `${Math.random().toString(36).slice(2)}_s${i}_r_${opt}`;
      const l = document.createElement("label");
      l.className = "rad";
      
      const input = document.createElement("input");
      input.id = rid;
      input.name = `${Math.random().toString(36).slice(2)}_s${i}`;
      input.type = "radio";
      input.value = opt;
      input.disabled = isCompleted;
      
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.dataset.v = opt;
      const dot = document.createElement("span");
      dot.className = "dot";
      pill.appendChild(dot);
      pill.appendChild(document.createTextNode(opt));
      
      l.appendChild(input);
      l.appendChild(pill);
      
      if (stView.diff[i] === opt) {
        input.checked = true;
        pill.classList.add("sel");
      }
      
      input.onchange = () => {
        const stx = ensureRowState(row, row.sets);
        stx.diff[i] = opt;
        radios.querySelectorAll(".pill").forEach((p) => p.classList.remove("sel"));
        pill.classList.add("sel");
        stateManager.updateStore({});
      };
      
      radios.appendChild(l);
    });

    setRow.appendChild(radios);
    setsWrap.appendChild(setRow);
  }

  return setsWrap;
}
