(() => {
  "use strict";

  const books = [...document.querySelectorAll(".series-path[aria-controls]")].map(button => ({
    button,
    panel: document.getElementById(button.getAttribute("aria-controls")),
    animation: null,
  })).filter(book => book.panel);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Cancel the previous transition before measuring, so fast clicks stay consistent.
  function setOpen(book, open, animate = true) {
    const { button, panel } = book;
    const height = panel.hidden ? 0 : panel.getBoundingClientRect().height;
    if (book.animation) book.animation.cancel();
    book.animation = null;
    button.setAttribute("aria-expanded", String(open));
    panel.inert = !open;
    if (!open && panel.contains(document.activeElement)) button.focus();
    panel.hidden = false;
    panel.style.removeProperty("height");
    panel.style.removeProperty("overflow");
    const target = open ? panel.getBoundingClientRect().height : 0;

    if (!animate || reducedMotion.matches || !panel.animate) {
      panel.hidden = !open;
      return;
    }

    panel.style.overflow = "hidden";
    const animation = panel.animate([
      { height: height + "px", opacity: height ? 1 : 0 },
      { height: target + "px", opacity: open ? 1 : 0 },
    ], { duration: open ? 620 : 380, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "both" });
    book.animation = animation;
    animation.finished.then(() => {
      if (book.animation !== animation) return;
      panel.hidden = !open;
      panel.style.removeProperty("overflow");
      animation.cancel();
      book.animation = null;
    }).catch(() => { /* A newer click replaces this transition. */ });
  }

  const fragment = document.getElementById(location.hash.slice(1));
  books.forEach(book => {
    // Without JavaScript both series remain readable; with it the covers control them.
    setOpen(book, !!fragment && book.panel.contains(fragment), false);
    book.button.disabled = false;
    book.button.addEventListener("click", () => {
      const open = book.button.getAttribute("aria-expanded") !== "true";
      books.forEach(other => {
        if (other === book || other.button.getAttribute("aria-expanded") === "true") {
          setOpen(other, other === book && open);
        }
      });
    });
  });
})();
