import { allWeeks, rowsFor } from "../routines/index.js";
import { readRowState } from "../core/rowState.js";
import { getEstMin } from "../features/estimates.js";
import { view } from "../core/storage.js";

export function updateDrawer(containerEl, { currentRoutine }) {
  containerEl.innerHTML = "";
  
  const cur = currentRoutine();
  
  // Add header showing current selection
  if (cur) {
    const header = document.createElement("div");
    header.className = "drawer-header";
    header.style.padding = "16px";
    header.style.background = "var(--panel)";
    header.style.borderRadius = "10px";
    header.style.marginBottom = "16px";
    header.style.border = "1px solid var(--border2)";
    
    const routineTitle = document.createElement("div");
    routineTitle.style.fontSize = "14px";
    routineTitle.style.fontWeight = "700";
    routineTitle.style.color = "var(--gold)";
    routineTitle.style.marginBottom = "8px";
    routineTitle.textContent = cur.name;
    
    const locationInfo = document.createElement("div");
    locationInfo.style.fontSize = "13px";
    locationInfo.style.color = "var(--muted)";
    locationInfo.innerHTML = `<span style="color: var(--blue)">Week ${view.week}</span> • <span style="color: var(--blue)">Day ${view.day}</span>`;
    
    header.appendChild(routineTitle);
    header.appendChild(locationInfo);
    containerEl.appendChild(header);
  }
  
  // Add mobile action menu on small screens
  if (window.innerWidth <= 768) {
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "dw mobile-actions";
    const h = document.createElement("h4");
    h.style.cursor = "pointer";
    h.style.userSelect = "none";
    h.innerHTML = '<span style="margin-right: 6px;">▼</span>ACTIONS';
    const actionsContent = document.createElement("div");
    actionsContent.className = "actions-content";
    actionsWrap.appendChild(h);
    
    const actions = [
      { id: "exerciseLibraryBtn", label: "Exercise Library", icon: '<i class="fa-solid fa-book"></i>' },
      { id: "editRoutineBtn", label: "Edit Current Day", icon: '<i class="fa-solid fa-pen-to-square"></i>' },
      { id: "importRoutineBtn", label: "Import Routine", icon: '<i class="fa-solid fa-file-import"></i>' },
      { id: "configBtn", label: "Settings", icon: '<i class="fa-solid fa-gear"></i>' },
      { id: "exportBtn", label: "Export Data", icon: '<i class="fa-solid fa-download"></i>' },
      { id: "importBtn", label: "Import Data", icon: '<i class="fa-solid fa-upload"></i>' },
      { id: "clearDayBtn", label: "Clear Day", icon: '<i class="fa-solid fa-trash"></i>' },
      { id: "clearAllBtn", label: "Clear All Data", icon: '<i class="fa-solid fa-trash-can"></i>' }
    ];
    
    actions.forEach(action => {
      const item = document.createElement("div");
      item.className = "ditem action-item";
      item.tabIndex = 0;
      const iconSpan = document.createElement("span");
      iconSpan.className = "action-icon";
      iconSpan.innerHTML = action.icon;
      const titleDiv = document.createElement("div");
      titleDiv.className = "dtitle";
      titleDiv.textContent = action.label;
      const rowDiv = document.createElement("div");
      rowDiv.className = "drow";
      rowDiv.appendChild(iconSpan);
      rowDiv.appendChild(titleDiv);
      item.appendChild(rowDiv);
      item.onclick = () => {
        const btn = document.getElementById(action.id);
        if (btn) btn.click();
      };
      item.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          item.click();
        }
      };
      actionsContent.appendChild(item);
    });
    
    actionsWrap.appendChild(actionsContent);
    
    // Toggle functionality - start collapsed
    let isOpen = false;
    actionsContent.style.display = "none";
    h.querySelector("span").textContent = "▶";
    
    h.onclick = () => {
      isOpen = !isOpen;
      actionsContent.style.display = isOpen ? "block" : "none";
      h.querySelector("span").textContent = isOpen ? "▼" : "▶";
    };
    
    containerEl.appendChild(actionsWrap);
  }
  
  if (!cur) return;
  const wks = allWeeks();
  wks.forEach((w) => {
    const wrap = document.createElement("div");
    wrap.className = "dw";
    const h = document.createElement("h4");
    h.textContent = `Week ${w}`;
    wrap.appendChild(h);
    for (let d = 1; d <= 7; d++) {
      const dayRows = rowsFor(w, d);
      if (dayRows.length === 0) continue;
      const done = dayRows.filter((r) => (readRowState(r) || {}).completed).length;
      const pct = dayRows.length ? Math.round((done / dayRows.length) * 100) : 0;
      const eta = Math.round(dayRows.reduce((a, r) => a + getEstMin(r), 0));

      const item = document.createElement("div");
      item.className = "ditem";
      // Highlight if this is the currently active day
      if (view.week === w && view.day === d) {
        item.classList.add("active");
      }
      item.tabIndex = 0;
      const row = document.createElement("div");
      row.className = "drow";
      const title = document.createElement("div");
      title.className = "dtitle";
      title.textContent = `Day ${d}: ${dayRows[0].focus}`;
      const badge = document.createElement("div");
      badge.className = "dbadge";
      badge.textContent = `${done}/${dayRows.length}`;
      const deta = document.createElement("div");
      deta.className = "deta";
      deta.textContent = `≈ ${eta} min`;
      row.appendChild(title);
      row.appendChild(badge);
      row.appendChild(deta);

      const prog = document.createElement("div");
      prog.className = "dprog";
      prog.setAttribute("role", "progressbar");
      prog.setAttribute("aria-valuemin", "0");
      prog.setAttribute("aria-valuemax", "100");
      prog.setAttribute("aria-valuenow", String(pct));
      const bar = document.createElement("span");
      bar.style.width = `${pct}%`;
      prog.appendChild(bar);

      item.appendChild(row);
      item.appendChild(prog);
      item.onclick = () => document.dispatchEvent(new CustomEvent("nav:goto", { detail: { week: w, day: d } }));
      item.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          item.click();
        }
      };
      wrap.appendChild(item);
    }
    containerEl.appendChild(wrap);
  });
}
