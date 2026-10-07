(() => {
  "use strict";
  const player = document.querySelector("[data-music-player]");
  if (!player) return;
  const audio = player.querySelector("audio");
  const button = player.querySelector("[data-music-toggle]");
  const error = player.querySelector("[data-music-error]");
  let requested = false;
  let pending = false;
  let revision = 0;

  function render() {
    button.dataset.state = requested || !audio.paused ? "playing" : "paused";
    button.setAttribute("aria-busy", String(pending));
  }
  function pause() {
    requested = false;
    pending = false;
    revision++;
    audio.pause();
    render();
  }
  button.addEventListener("click", async () => {
    error.hidden = true;
    if (requested || !audio.paused) {
      pause();
      return;
    }
    const ticket = ++revision;
    requested = true;
    pending = true;
    render();
    try {
      // Only a user's click starts playback; never restore a saved playing state.
      await audio.play();
      if (ticket !== revision) return;
      pending = false;
      render();
    } catch {
      if (ticket !== revision) return; // A quick second click may cancel a pending play.
      requested = false;
      pending = false;
      error.hidden = false;
      render();
    }
  });
  audio.addEventListener("playing", () => {
    pending = false;
    render();
  });
  audio.addEventListener("pause", () => {
    requested = false;
    pending = false;
    revision++;
    render();
  });
  audio.addEventListener("error", () => {
    pause();
    error.hidden = false;
  });
  // Leaving or restoring this page should not unexpectedly resume sound.
  window.addEventListener("pagehide", pause);
  audio.hidden = true;
  button.hidden = false;
  render();
})();
