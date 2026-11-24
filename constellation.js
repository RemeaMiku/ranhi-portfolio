(() => {
  "use strict";
  const timeline = document.querySelector(".artist-timeline");
  if (!timeline) return;
  const entries = [...timeline.children];
  const heights = [88, 48, 98, 38, 78];
  const viewport = document.createElement("div");
  viewport.className = "constellation-viewport";
  const map = document.createElement("div");
  map.className = "constellation-map";
  map.setAttribute("role", "tablist");
  map.setAttribute("aria-labelledby", "story-title");
  map.innerHTML = '<svg viewBox="0 0 1000 230" preserveAspectRatio="none" aria-hidden="true"><path d="M100 88 300 48 500 98 700 38 900 78" /></svg>';
  const tabs = entries.map((entry, index) => {
    const tab = document.createElement("button");
    const heading = entry.querySelector("h3");
    tab.type = "button";
    tab.className = "constellation-node";
    tab.id = "story-node-" + index;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", "story-panel-" + index);
    tab.style.setProperty("--node-x", (10 + index * 20) + "%");
    tab.style.setProperty("--node-y", heights[index] + "px");
    const date = document.createElement("span");
    date.className = "constellation-year";
    date.textContent = entry.querySelector("time").textContent;
    const label = document.createElement("span");
    label.className = "constellation-label";
    const syncLabel = () => { label.textContent = heading.textContent; };
    syncLabel();
    // Follow the existing translated heading rather than maintaining duplicate copy.
    new MutationObserver(syncLabel).observe(heading, { childList: true, subtree: true, characterData: true });
    tab.append(date, label);
    entry.id = "story-panel-" + index;
    entry.setAttribute("role", "tabpanel");
    entry.setAttribute("aria-labelledby", tab.id);
    entry.tabIndex = 0;
    tab.addEventListener("click", () => select(index));
    tab.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % entries.length;
      if (event.key === "ArrowLeft") next = (index + entries.length - 1) % entries.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = entries.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      select(next);
      tabs[next].focus({ preventScroll: true });
      tabs[next].scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    map.append(tab);
    return tab;
  });
  function select(index) {
    entries.forEach((entry, i) => {
      entry.hidden = i !== index;
      tabs[i].setAttribute("aria-selected", String(i === index));
      tabs[i].tabIndex = i === index ? 0 : -1;
    });
  }
  viewport.append(map);
  timeline.before(viewport);
  timeline.classList.add("constellation-panels");
  select(0);
})();
