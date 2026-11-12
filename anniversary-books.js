(() => {
  "use strict";

  const shelf = document.querySelector(".series-paths");
  if (!shelf) return;
  const books = [...shelf.querySelectorAll(".series-path[aria-controls]")].map(button => ({
    button,
    panel: document.getElementById(button.getAttribute("aria-controls")),
    animations: [],
    revision: 0,
    open: false,
    coverHeight: button.getBoundingClientRect().height,
  })).filter(book => book.panel);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function setOpen(book, open, motion = true, returnFocus = false) {
    const from = book.slot.getBoundingClientRect().height;
    const interrupted = book.slot.classList.contains("is-turning");
    const rotation = interrupted ? getComputedStyle(book.button).transform : null;
    if (!interrupted && !book.button.hidden) {
      book.coverHeight = book.button.getBoundingClientRect().height;
    }
    const revision = ++book.revision;
    book.animations.forEach(animation => animation.cancel());
    book.animations = [];
    book.slot.classList.remove("is-turning");
    book.open = open;
    book.button.setAttribute("aria-expanded", String(open));
    book.panel.hidden = false;
    book.panel.inert = !open;
    const target = open ? book.panel.getBoundingClientRect().height : book.coverHeight;

    function finish() {
      book.panel.hidden = !open;
      book.button.hidden = open;
      book.button.inert = false;
      book.slot.classList.remove("is-turning");
      book.animations.forEach(animation => animation.cancel());
      book.animations = [];
      if (returnFocus) book.button.focus({ preventScroll: true });
      else if (open && motion && book.button.contains(document.activeElement)) {
        book.close.focus({ preventScroll: true });
      }
    }
    if (!motion || reducedMotion.matches || !book.slot.animate) {
      finish();
      return;
    }

    book.button.hidden = false;
    if (open) book.close.focus({ preventScroll: true });
    book.button.inert = true;
    book.slot.classList.add("is-turning");
    const duration = open ? 1200 : 1300;
    const options = { duration, easing: "cubic-bezier(.37, 0, .63, 1)", fill: "both" };
    const play = (element, frames) => {
      const animation = element.animate(frames, options);
      book.animations.push(animation);
      return animation;
    };

    // Opening unfolds the cover around the spine; closing reverses the same motion.
    // Keep the pages at reading size until the returning cover has covered them.
    const size = play(book.slot, open ? [
      { height: from + "px", offset: 0 },
      { height: target + "px", offset: .82 },
      { height: target + "px", offset: 1 },
    ] : [
      { height: from + "px", offset: 0 },
      { height: from + "px", offset: .55 },
      { height: target + "px", offset: 1 },
    ]);
    play(book.button, open ? [
      { transform: rotation || "rotateY(0deg)", offset: 0 },
      { transform: "rotateY(-165deg)", offset: 1 },
    ] : [
      { transform: rotation || "rotateY(-165deg)", offset: 0 },
      { transform: "rotateY(0deg)", offset: .82 },
      { transform: "rotateY(0deg)", offset: 1 },
    ]);
    play(book.shadow, [
      { opacity: 0, transform: "scaleX(.05)", offset: 0 },
      { opacity: .32, transform: "scaleX(1)", offset: .42 },
      { opacity: 0, transform: "scaleX(.05)", offset: 1 },
    ]);
    size.finished.then(() => {
      if (book.revision === revision) finish();
    }).catch(() => { /* A newer interaction replaces the current turn. */ });
  }

  books.forEach(book => {
    // Progressive enhancement: the artwork stays readable without JavaScript.
    book.slot = document.createElement("div");
    book.slot.className = "series-book-slot";
    book.button.before(book.slot);
    book.slot.append(book.button, book.panel);
    const back = document.createElement("span");
    back.className = "series-book-back";
    back.setAttribute("aria-hidden", "true");
    book.button.append(back);
    book.shadow = document.createElement("span");
    book.shadow.className = "series-turn-shadow";
    book.shadow.setAttribute("aria-hidden", "true");
    book.slot.append(book.shadow);
    book.close = book.panel.querySelector("[data-close-book]");
    book.close.hidden = false;
    book.button.disabled = false;
    book.panel.hidden = true;
    book.panel.inert = true;
    book.button.addEventListener("click", () => {
      // Each album keeps its own open state.
      setOpen(book, true);
    });
    book.close.addEventListener("click", () => setOpen(book, false, true, true));
  });
  const fragment = document.getElementById(location.hash.slice(1));
  const initialBook = books.find(book => fragment && book.panel.contains(fragment));
  if (initialBook) setOpen(initialBook, true, false);
  reducedMotion.addEventListener("change", () => {
    books.forEach(book => setOpen(book, book.open, false));
  });
})();
