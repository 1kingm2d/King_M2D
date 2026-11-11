import { CONFIG } from "../config.js";
import { loadJson, whenVisible } from "../utils.js";
import { mountInstagram, mountFacebook } from "../widgets.js";

export async function init(site) {
  const pinned = await loadJson(CONFIG.files.pinned, { posts: [] });
  const tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  const mounted = {};

  const mount = function (name) {
    if (mounted[name]) return;
    mounted[name] = true;
    const box = document.getElementById("panel-" + name);
    // Lazy: only load when the panel is actually scrolled into view
    whenVisible(box, function () {
      if (name === "instagram") mountInstagram(box, site, pinned.posts || []);
      else mountFacebook(box, site);
    });
  };

  const select = function (name) {
    tabs.forEach(function (t) {
      const on = t.dataset.tab === name;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById("panel-" + t.dataset.tab).hidden = !on;
    });
    mount(name);
  };

  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { select(t.dataset.tab); });
    t.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        n.focus();
        select(n.dataset.tab);
      }
    });
  });
  select("instagram");
}