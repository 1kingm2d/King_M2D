import { CONFIG } from "../config.js";
import { loadJson, esc, isUrl } from "../utils.js";
import { path } from "../config.js";

export async function init(site) {
  const grid = document.getElementById("merch-grid");
  const shop = document.getElementById("shop-btn");
  if (isUrl(site.merch.storeUrl)) {
    shop.href = site.merch.storeUrl.trim();
    shop.hidden = false;
  }

  const data = await loadJson(CONFIG.files.merch, { products: [] });
  const list = data.products || [];
  if (!list.length) {
    grid.innerHTML = '<div class="card empty"><p>Merch is coming soon.</p></div>';
    return;
  }
  grid.innerHTML = list.map(function (p) {
    const img = p.image || path("assets/placeholders/sample.svg");
    const inner = '<img src="' + esc(img) + '" alt="' + esc(p.name) + '" width="400" height="400" loading="lazy">' +
      '<div class="card-body"><h3>' + esc(p.name) + '</h3><p class="price">' + esc(p.price || "") + "</p>" +
      (isUrl(p.link) ? "" : '<p class="muted small">Coming soon</p>') + "</div>";
    return isUrl(p.link)
      ? '<a class="card product" href="' + esc(p.link.trim()) + '" target="_blank" rel="noopener noreferrer">' + inner + "</a>"
      : '<div class="card product">' + inner + "</div>";
  }).join("");
}