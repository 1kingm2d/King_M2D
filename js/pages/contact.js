import { esc, isUrl } from "../utils.js";
import { icon } from "../icons.js";
import { emailEntry, mailto, renderWorkWithMe } from "../components.js";

export async function init(site) {
  let html = "";
  const biz = emailEntry(site, "business");
  if (biz) html += '<a class="btn btn-primary" href="' + esc(mailto(biz.address)) + '">' + icon("mail") + " " + esc(biz.label || "Business") + " email</a>";
  if (isUrl(site.links.discord)) html += '<a class="btn" href="' + esc(site.links.discord.trim()) + '" target="_blank" rel="noopener noreferrer">' + icon("discord") + " Join the Discord</a>";
  const row = document.getElementById("contact-buttons");
  row.innerHTML = html;
  if (!html) document.getElementById("contact-empty").hidden = false;

  const wwm = document.getElementById("contact-wwm");
  const block = renderWorkWithMe(site, false);
  if (block) { wwm.innerHTML = block; wwm.hidden = false; }
}