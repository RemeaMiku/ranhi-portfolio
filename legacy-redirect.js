(() => {
  "use strict";
  // Resolve against this root-level script, including GitHub Pages project subpaths.
  const script = document.currentScript;
  const target = new URL(script.dataset.target, script.src);
  target.search = location.search;
  target.hash = location.hash;
  location.replace(target.href);
})();
