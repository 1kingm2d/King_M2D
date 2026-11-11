/* Entry point for every public page: load site.json, inject shared UI, then run the page module. */
import { CONFIG } from "./config.js";
import { loadJson } from "./utils.js";
import { renderHeader, renderFooter, renderFollowSection, wireHeader } from "./components.js";

const DEFAULTS = {
  brand: { name: "King M2D", tagline: "" },
  about: { story: "", gear: [], skills: [] },
  links: {},
  emails: {},
  fanCorner: { enabled: true, service: "web3forms", endpoint: "" },
  workWithMe: { enabled: false, buttons: [] },
  support: { tiers: [] },
  merch: {}
};

const PAGES = ["home", "videos", "social", "downloads", "merch", "support", "fan-corner", "about", "contact"];

function normalize(data) {
  const out = Object.assign({}, data || {});
  Object.keys(DEFAULTS).forEach(function (k) {
    const d = DEFAULTS[k];
    out[k] = (d && typeof d === "object" && !Array.isArray(d)) ? Object.assign({}, d, out[k] || {}) : (out[k] || d);
  });
  return out;
}

async function start() {
  const page = document.body.dataset.page || "";
  const site = normalize(await loadJson(CONFIG.files.site, {}));

  const header = document.getElementById("site-header");
  if (header) { header.innerHTML = renderHeader(site, page); wireHeader(); }
  const footer = document.getElementById("site-footer");
  if (footer) footer.innerHTML = renderFooter(site);
  document.querySelectorAll("#follow-section").forEach(function (el) { el.innerHTML = renderFollowSection(site); });

  if (PAGES.indexOf(page) === -1) return;
  try {
    const mod = await import("./pages/" + page + ".js");
    if (mod && typeof mod.init === "function") await mod.init(site);
  } catch (err) {
    console.warn("[km2d] page module failed: " + page, err);
  }
}

start();