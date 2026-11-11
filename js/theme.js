/* Runs in <head> BEFORE first paint (plain script, not a module).
   Logic: saved choice (dark | light | system) -> resolve -> apply.
   ANY problem (blocked storage, bad value, error) falls back to DARK. */
(function () {
  var KEY = "km2d-theme";
  var VALID = ["dark", "light", "system"];

  function readChoice() {
    try {
      var v = localStorage.getItem(KEY);
      return VALID.indexOf(v) !== -1 ? v : "system";
    } catch (e) {
      return "system";
    }
  }

  function resolve(choice) {
    try {
      if (choice === "light") return "light";
      if (choice === "dark") return "dark";
      return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    } catch (e) {
      return "dark";
    }
  }

  function apply(choice) {
    var theme = "dark";
    try {
      theme = resolve(choice);
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.setAttribute("data-theme-choice", choice);
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", theme === "light" ? "#f6f1e7" : "#0b0b0d");
    } catch (e) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
    return theme;
  }

  window.KingTheme = {
    get: readChoice,
    set: function (choice) {
      if (VALID.indexOf(choice) === -1) choice = "system";
      try { localStorage.setItem(KEY, choice); } catch (e) { /* storage blocked: still apply for this visit */ }
      return apply(choice);
    },
    cycle: function () {
      var next = VALID[(VALID.indexOf(readChoice()) + 1) % VALID.length];
      return this.set(next);
    }
  };

  apply(readChoice());

  // Follow OS changes live while the choice is "system"
  try {
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", function () {
      if (readChoice() === "system") apply("system");
    });
  } catch (e) { /* older browsers: ignore */ }
})();