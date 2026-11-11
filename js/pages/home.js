import { CONFIG, path } from "../config.js";
import { loadJson, esc, isUrl } from "../utils.js";
import { renderVideoCards, renderWorkWithMe } from "../components.js";

export async function init(site) {
  const b = site.brand;
  document.getElementById("hero-name").textContent = b.name || "King M2D";
  document.getElementById("hero-tagline").textContent = b.tagline || "";
  const avatar = document.getElementById("hero-avatar");
  const src = b.avatar || b.logo;
  if (src) { avatar.src = src; avatar.hidden = false; }

  // Latest 3 videos
  const vBox = document.getElementById("latest-videos");
  const data = await loadJson(CONFIG.files.videos, { videos: [] });
  const vids = (data.videos || []).slice(0, 3);
  vBox.innerHTML = vids.length ? renderVideoCards(vids) : '<div class="card empty"><p>Videos will appear here soon.</p></div>';

  // Featured downloads (hidden when none are marked featured)
  const dl = await loadJson(CONFIG.files.downloads, { items: [] });
  const featured = (dl.items || []).filter(function (d) { return d.featured; }).slice(0, 3);
  if (featured.length) {
    document.getElementById("featured-downloads").innerHTML = featured.map(function (d) {
      return '<a class="card" href="' + path("downloads.html") + '"><div class="card-body"><h3>' + esc(d.name) +
        '</h3><p class="muted small">' + esc(d.description || "") + "</p></div></a>";
    }).join("");
    document.getElementById("featured-section").hidden = false;
  }

  // Patreon / Ko-fi teaser (needs at least one link)
  const sup = document.getElementById("support-teaser");
  const hasSupport = isUrl(site.links.patreon) || isUrl(site.links.kofi);
  if (hasSupport) sup.hidden = false;

  // Work With Me teaser
  const wwm = document.getElementById("wwm-teaser");
  const html = renderWorkWithMe(site, true);
  if (html) { wwm.innerHTML = html; wwm.hidden = false; }

  // Fan Corner teaser
  if (site.fanCorner.enabled !== false) document.getElementById("fan-teaser").hidden = false;
}