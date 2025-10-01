export function dayString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
export function dateFromDayString(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(NaN);
}
export function formatDate(d) {
  return d.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

/**
 * Build calendar grid.
 * @param {Object} args
 * @param {HTMLElement} args.gridEl
 * @param {HTMLElement} args.monthEl
 * @param {Date} args.monthDate - any date within current month
 * @param {string|null} args.selectedYMD
 * @param {(ymd:string)=>void} args.onPick
 */
export function buildCalendar({ gridEl, monthEl, monthDate, selectedYMD, onPick }) {
  const y = monthDate.getFullYear(),
    mo = monthDate.getMonth();
  monthEl.textContent = new Date(y, mo, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const first = new Date(y, mo, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7));

  gridEl.innerHTML = "";
  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((wd) => {
    const t = document.createElement("div");
    t.className = "cal-wd";
    t.textContent = wd;
    gridEl.appendChild(t);
  });

  const dayCells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const cell = document.createElement("div");
    cell.className = "cal-day";
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("aria-selected", "false");
    cell.tabIndex = -1;
    cell.textContent = d.getDate();
    if (d.getMonth() !== mo) cell.classList.add("out");
    if (selectedYMD && dayString(d) === selectedYMD) {
      cell.classList.add("sel");
      cell.setAttribute("aria-selected", "true");
      cell.tabIndex = 0;
    }
    cell.onclick = () => onPick(dayString(d));
    cell.onkeydown = (e) => {
      const idx = dayCells.indexOf(cell);
      if (idx === -1) return;
      const moveFocus = (ni) => {
        if (ni < 0 || ni >= dayCells.length) return;
        dayCells[idx].tabIndex = -1;
        dayCells[ni].tabIndex = 0;
        dayCells[ni].focus();
      };
      if (e.key === "ArrowRight") {
        e.preventDefault();
        moveFocus(idx + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveFocus(idx - 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        moveFocus(idx + 7);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveFocus(idx - 7);
      } else if (e.key === "Home") {
        e.preventDefault();
        moveFocus(Math.floor(idx / 7) * 7);
      } else if (e.key === "End") {
        e.preventDefault();
        moveFocus(Math.floor(idx / 7) * 7 + 6);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        cell.click();
      }
    };
    dayCells.push(cell);
    gridEl.appendChild(cell);
  }
}
