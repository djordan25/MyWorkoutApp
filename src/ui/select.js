function closeAllSelectMenus(exceptEl = null) {
  document.querySelectorAll(".sel.open").forEach((s) => {
    if (exceptEl && (s === exceptEl || s.contains(exceptEl))) return;
    s.classList.remove("open");
    s.setAttribute("aria-expanded", "false");
  });
}
document.addEventListener("click", (e) => {
  const within = e.target.closest(".sel");
  closeAllSelectMenus(within);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAllSelectMenus();
});

export function neonSelect(el, label, values, value, onChange) {
  el.classList.add("sel");
  el.innerHTML =
    `<div class="sel-trigger" tabindex="0" aria-haspopup="listbox"><span class="lbl"></span><span class="val"></span><span class="carat"></span></div>` +
    `<div class="sel-menu" role="listbox"></div>`;
  el.setAttribute("aria-expanded", "false");
  const trigger = el.querySelector(".sel-trigger");
  const menu = el.querySelector(".sel-menu");
  const lbl = el.querySelector(".lbl");
  const val = el.querySelector(".val");
  lbl.textContent = label;

  neonSelect._id = (neonSelect._id || 0) + 1;
  const menuId = `sel-menu-${neonSelect._id}`;
  const lblId = `sel-lbl-${neonSelect._id}`;
  menu.id = menuId;
  trigger.setAttribute("aria-controls", menuId);
  lbl.id = lblId;
  menu.setAttribute("aria-labelledby", lblId);

  const setActive = (optEl) => {
    if (optEl && optEl.id) menu.setAttribute("aria-activedescendant", optEl.id);
  };

  let list = values.map((v) => (typeof v === "object" ? v : { value: v, label: String(v) }));
  function open() {
    closeAllSelectMenus(el);
    el.classList.add("open");
    el.setAttribute("aria-expanded", "true");
    const sel = menu.querySelector('.sel-item[aria-selected="true"]') || menu.querySelector(".sel-item");
    if (sel) {
      sel.focus();
      setActive(sel);
    }
  }
  function close() {
    el.classList.remove("open");
    el.setAttribute("aria-expanded", "false");
  }
  function toggle() {
    el.classList.contains("open") ? close() : open();
  }
  function renderMenu() {
    menu.innerHTML = "";
    list.forEach((v, i) => {
      const it = document.createElement("div");
      it.className = "sel-item";
      it.textContent = v.label;
      it.dataset.value = v.value;
      it.setAttribute("role", "option");
      it.setAttribute("aria-selected", v.value === value);
      it.tabIndex = -1;
      it.id = `${menuId}-opt-${i}`;
      it.onclick = () => {
        value = v.value;
        val.textContent = v.label;
        // Update aria-selected for all items
        menu.querySelectorAll(".sel-item").forEach((item) => {
          item.setAttribute("aria-selected", String(item.dataset.value) === String(value) ? "true" : "false");
        });
        onChange(value);
        close();
        trigger.focus();
      };
      it.onfocus = () => setActive(it);
      it.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          it.click();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          (menu.children[i + 1] || menu.children[0]).focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          (menu.children[i - 1] || menu.children[menu.children.length - 1]).focus();
        } else if (e.key === "Escape") {
          e.preventDefault();
          close();
          trigger.focus();
        }
      };
      menu.appendChild(it);
    });
    const cur = list.find((x) => x.value === value) || list[0];
    val.textContent = cur ? cur.label : "";
  }
  trigger.onclick = toggle;
  trigger.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      open();
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };
  renderMenu();
  return {
    set(v) {
      value = v;
      const cur = list.find((x) => x.value === v);
      if (cur) val.textContent = cur.label;
      menu.querySelectorAll(".sel-item").forEach((i) => i.setAttribute("aria-selected", String(i.dataset.value) === String(v) ? "true" : "false"));
    },
    rebuild(newValues, newValue) {
      list = newValues.map((v) => (typeof v === "object" ? v : { value: v, label: String(v) }));
      value = newValue;
      renderMenu();
      // Update aria-selected after rebuilding
      menu.querySelectorAll(".sel-item").forEach((i) => i.setAttribute("aria-selected", String(i.dataset.value) === String(value) ? "true" : "false"));
    },
  };
}
