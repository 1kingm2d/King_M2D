import { CONFIG } from "../config.js";
import { loadJson, esc, isUrl, debounce, formatDate } from "../utils.js";

export async function init(site) {
  const grid = document.getElementById("dl-grid");
  const filters = document.getElementById("dl-filters");
  const search = document.getElementById("dl-search");
  const updated = document.getElementById("dl-updated");

  const data = await loadJson(CONFIG.files.downloads, { items: [] });
  const items = Array.isArray(data.items) ? data.items : [];
  if (data.updated && updated) updated.textContent = "Last updated: " + formatDate(data.updated);

  const cats = ["All"];
  items.forEach(function (i) { if (i.category && cats.indexOf(i.category) === -1) cats.push(i.category); });

  let cat = "All";
  let query = "";

  function action(d) {
    if (d.patreonOnly) {
      return isUrl(site.links.patreon)
        ? '<a class="btn btn-primary" href="' + esc(site.links.patreon.trim()) + '" target="_blank" rel="noopener noreferrer">Get on Patreon</a>'
        : '<span class="muted small">Patreon members only</span>';
    }
    return isUrl(d.url)
      ? '<a class="btn btn-primary" href="' + esc(d.url.trim()) + '" target="_blank" rel="noopener noreferrer">Download</a>'
      : '<span class="muted small">Coming soon</span>';
  }

  function drawFilters() {
    filters.innerHTML = cats.map(function (c) {
      return '<button type="button" class="chip" data-cat="' + esc(c) + '" aria-pressed="' + (c === cat) + '">' + esc(c) + "</button>";
    }).join("");
  }

  function draw() {
    const list = items.filter(function (d) {
      const okCat = cat === "All" || d.category === cat;
      const hay = ((d.name || "") + " " + (d.description || "") + " " + (d.fileType || "")).toLowerCase();
      return okCat && hay.indexOf(query) !== -1;
    });
    if (!list.length) {
      grid.innerHTML = '<div class="card empty"><p>No downloads found.</p></div>';
      return;
    }
    grid.innerHTML = list.map(function (d) {
      return '<article class="card dl-card"><div class="card-body"><h3>' + esc(d.name) + "</h3>" +
        '<p class="muted small">' + esc(d.description || "") + "</p>" +
        '<div class="meta">' +
        (d.fileType ? '<span class="tag">' + esc(d.fileType) + "</span>" : "") +
        (d.size ? '<span class="tag">' + esc(d.size) + "</span>" : "") +
        (d.category ? '<span class="tag">' + esc(d.category) + "</span>" : "") +
        (d.patreonOnly ? '<span class="tag patreon">Patreon only</span>' : "") + "</div>" +
        (d.license ? '<p class="muted small">License: ' + esc(d.license) + "</p>" : "") +
        action(d) + "</div></article>";
    }).join("");
  }

  filters.addEventListener("click", function (e) {
    const b = e.target.closest("button[data-cat]");
    if (!b) return;
    cat = b.dataset.cat;
    drawFilters();
    draw();
  });
  search.addEventListener("input", debounce(function () {
    query = search.value.trim().toLowerCase();
    draw();
  }, 150));

  drawFilters();
  draw();
}