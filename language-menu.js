(() => {
  "use strict";
  document.addEventListener("DOMContentLoaded", () => {
    const select = document.querySelector("[data-language-select]");
    if (!select) return;
    const picker = select.closest(".language-picker");
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "language-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", "language-options");
    trigger.innerHTML = '<span></span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';
    const menu = document.createElement("div");
    menu.id = "language-options";
    menu.className = "language-menu";
    menu.setAttribute("role", "listbox");
    menu.inert = true;
    let open = false;
    const options = [...select.options].map(option => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "language-option";
      button.setAttribute("role", "option");
      button.tabIndex = -1;
      button.lang = option.lang;
      button.dataset.value = option.value;
      button.textContent = option.textContent;
      button.addEventListener("click", () => {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        sync();
        setOpen(false, true);
      });
      menu.append(button);
      return button;
    });
    function sync() {
      const name = select.getAttribute("aria-label") || "Language";
      const selected = select.selectedOptions[0];
      trigger.firstElementChild.textContent = selected?.textContent || "English";
      trigger.setAttribute("aria-label", name + ": " + trigger.firstElementChild.textContent);
      trigger.setAttribute("aria-busy", select.getAttribute("aria-busy") || "false");
      menu.setAttribute("aria-label", name);
      options.forEach(option => option.setAttribute("aria-selected", String(option.dataset.value === select.value)));
    }
    function setOpen(value, restoreFocus = false) {
      open = value;
      if (!open && restoreFocus) trigger.focus({ preventScroll: true });
      menu.inert = !open;
      picker.classList.toggle("is-open", open);
      trigger.setAttribute("aria-expanded", String(open));
      if (open) options.find(option => option.dataset.value === select.value)?.focus({ preventScroll: true });
    }
    trigger.addEventListener("click", () => setOpen(!open));
    trigger.addEventListener("keydown", event => {
      if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        setOpen(true);
      }
    });
    menu.addEventListener("keydown", event => {
      const index = options.indexOf(document.activeElement);
      let next;
      if (event.key === "ArrowDown") next = (index + 1) % options.length;
      if (event.key === "ArrowUp") next = (index + options.length - 1) % options.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = options.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        options[next].focus();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false, true);
      }
    });
    picker.addEventListener("focusout", event => {
      if (!picker.contains(event.relatedTarget)) setOpen(false);
    });
    document.addEventListener("pointerdown", event => {
      if (open && !picker.contains(event.target)) setOpen(false);
    });
    // The existing select remains the language controller and no-JS fallback.
    new MutationObserver(sync).observe(select, { attributes: true });
    select.addEventListener("change", sync);
    select.hidden = true;
    picker.append(trigger, menu);
    sync();
  });
})();
