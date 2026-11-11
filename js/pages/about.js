import { esc } from "../utils.js";

export async function init(site) {
  const a = site.about || {};
  const story = document.getElementById("about-story");
  story.innerHTML = a.story ? a.story.split(/\n+/).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") : '<p class="muted">My story is coming soon.</p>';

  const fill = function (id, arr, wrapId) {
    const el = document.getElementById(id);
    const box = document.getElementById(wrapId);
    if (!arr || !arr.length) { box.hidden = true; return; }
    el.innerHTML = arr.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
  };
  fill("about-gear", a.gear, "gear-wrap");
  fill("about-skills", a.skills, "skills-wrap");
}