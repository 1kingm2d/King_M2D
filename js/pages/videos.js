import { CONFIG } from "../config.js";
import { loadJson, formatDate } from "../utils.js";
import { renderVideoCards } from "../components.js";

export async function init() {
  const box = document.getElementById("video-grid");
  const data = await loadJson(CONFIG.files.videos, { videos: [] });
  const vids = data.videos || [];
  box.innerHTML = vids.length ? renderVideoCards(vids) : '<div class="card empty"><p>No videos yet. They will show up here automatically once the YouTube channel ID is set.</p></div>';
  const u = document.getElementById("videos-updated");
  if (u && data.updated) u.textContent = "Last updated: " + formatDate(data.updated);
}