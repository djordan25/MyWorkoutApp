export function openModal({ title, content, onClose } = {}) {
  const back = document.createElement("div");
  back.className = "modal-back";
  const box = document.createElement("div");
  box.className = "modal";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");

  const h = document.createElement("div");
  h.className = "modal-h";
  const icon = document.createElement("div");
  icon.innerHTML = '<i class="fa-solid fa-gear" style="font-size: 20px;"></i>';
  const t = document.createElement("div");
  t.className = "t";
  t.textContent = title || "";
  const right = document.createElement("div");
  right.style.marginLeft = "auto";
  const closeBtn = document.createElement("button");
  closeBtn.className = "btn btn-ghost icon-btn";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  right.appendChild(closeBtn);
  h.appendChild(icon);
  h.appendChild(t);
  h.appendChild(right);

  const b = document.createElement("div");
  b.className = "modal-b";
  if (content) b.appendChild(content);

  box.appendChild(h);
  box.appendChild(b);
  back.appendChild(box);
  document.body.appendChild(back);

  const prev = document.activeElement;
  const focusables = () =>
    Array.from(box.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter(
      (el) => !el.hasAttribute("disabled")
    );
  (focusables()[0] || closeBtn).focus();

  function cleanup() {
    back.remove();
    if (prev && typeof prev.focus === "function") prev.focus();
    if (typeof onClose === "function") onClose();
  }
  back.addEventListener("click", (e) => {
    if (e.target === back) cleanup();
  });
  closeBtn.onclick = cleanup;
  back.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cleanup();
    if (e.key === "Tab") {
      const f = focusables();
      if (!f.length) return;
      const idx = f.indexOf(document.activeElement);
      if (e.shiftKey && (idx <= 0 || idx === -1)) {
        e.preventDefault();
        f[f.length - 1].focus();
      } else if (!e.shiftKey && (idx === f.length - 1 || idx === -1)) {
        e.preventDefault();
        f[0].focus();
      }
    }
  });
  return { close: cleanup, box, body: b };
}
