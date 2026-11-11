import { esc, isUrl } from "../utils.js";
import { icon } from "../icons.js";

export async function init(site) {
  const s = site.support || {};
  const intro = document.getElementById("support-intro");
  if (s.intro) intro.textContent = s.intro; else intro.hidden = true;

  const tiers = document.getElementById("tiers");
  const list = s.tiers || [];
  tiers.innerHTML = list.length
    ? list.map(function (t) {
        return '<article class="card tier"><h3>' + esc(t.name) + '</h3><p class="price">' + esc(t.price || "") + "</p><ul>" +
          (t.benefits || []).map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul></article>";
      }).join("")
    : '<div class="card empty"><p>Membership tiers are coming soon.</p></div>';

  const row = document.getElementById("support-buttons");
  let html = "";
  if (isUrl(site.links.patreon)) html += '<a class="btn btn-primary" href="' + esc(site.links.patreon.trim()) + '" target="_blank" rel="noopener noreferrer">' + icon("patreon") + " Join on Patreon</a>";
  if (isUrl(site.links.kofi)) html += '<a class="btn" href="' + esc(site.links.kofi.trim()) + '" target="_blank" rel="noopener noreferrer">' + icon("kofi") + " Support on Ko-fi</a>";
  row.innerHTML = html;
  row.hidden = !html;
}