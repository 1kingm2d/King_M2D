/* Lazy widgets with fallbacks: Instagram (Behold) and the Facebook Page Plugin.
   Each box keeps a fixed min-height (.widget-box) so nothing jumps when a fallback appears. */
import { CONFIG, path } from "./config.js";
import { esc, isUrl } from "./utils.js";
import { icon } from "./icons.js";

/** Accepts a full Behold embed code, a feeds.behold.so URL, or a bare feed id. */
export function parseBehold(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  let m = s.match(/feed-id\s*=\s*["']([^"']+)["']/i);
  if (m) return m[1];
  m = s.match(/feeds\.behold\.so\/([A-Za-z0-9_-]+)/i);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{8,}$/.test(s) ? s : "";
}

function loadScript(src) {
  return new Promise(function (resolve, reject) {
    if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
    const s = document.createElement("script");
    s.type = "module";
    s.src = src;
    s.onload = resolve;
    s.onerror = function () { reject(new Error("script blocked or failed")); };
    document.head.appendChild(s);
  });
}

function followBtn(site, key, label) {
  const url = site.links && site.links[key];
  return isUrl(url)
    ? '<a class="btn btn-primary" href="' + esc(url.trim()) + '" target="_blank" rel="noopener noreferrer">' + icon(key) + " " + label + "</a>"
    : "";
}

function showPinned(box, site, posts) {
  const cards = (posts || []).map(function (p) {
    const img = p.image || path("assets/placeholders/sample.svg");
    const inner = '<img src="' + esc(img) + '" alt="' + esc(p.caption || "Instagram post") + '" width="400" height="400" loading="lazy">' +
      '<p class="card-body small">' + esc(p.caption || "") + "</p>";
    return isUrl(p.link)
      ? '<a class="card pinned" href="' + esc(p.link) + '" target="_blank" rel="noopener noreferrer">' + inner + "</a>"
      : '<div class="card pinned">' + inner + "</div>";
  }).join("");
  box.innerHTML = '<div class="grid">' + cards + '</div><div class="btn-row">' + followBtn(site, "instagram", "Follow on Instagram") + "</div>";
}

export async function mountInstagram(box, site, posts) {
  box.classList.add("widget-box");
  box.innerHTML = '<div class="skeleton" style="min-height:420px"></div>';
  const id = parseBehold(site.behold);
  if (!id) { showPinned(box, site, posts); return; }
  try {
    await loadScript("https://w.behold.so/widget.js");
    const el = document.createElement("behold-widget");
    el.setAttribute("feed-id", id);
    box.appendChild(el);
    const start = Date.now();
    const timer = setInterval(function () {
      const rendered = (el.shadowRoot && el.shadowRoot.childElementCount > 0) || el.offsetHeight > 80;
      if (rendered) {
        clearInterval(timer);
        const sk = box.querySelector(".skeleton");
        if (sk) sk.remove();
      } else if (Date.now() - start > CONFIG.widgetTimeoutMs) {
        clearInterval(timer);
        showPinned(box, site, posts);
      }
    }, 500);
  } catch (err) {
    console.warn("[km2d] Instagram widget failed", err);
    showPinned(box, site, posts);
  }
}

export function mountFacebook(box, site) {
  box.classList.add("widget-box");
  const fallback = function () {
    box.innerHTML = '<div class="card empty"><p>See our latest posts on Facebook.</p><div class="btn-row">' +
      followBtn(site, "facebook", "Follow on Facebook") + "</div></div>";
  };
  const page = site.facebookPageUrl;
  if (!isUrl(page)) { fallback(); return; }
  box.innerHTML = '<div class="skeleton" style="min-height:500px"></div>';
  let done = false;
  const frame = document.createElement("iframe");
  frame.className = "fb-frame";
  frame.title = "Facebook Page feed";
  frame.loading = "lazy";
  frame.height = "500";
  frame.setAttribute("allow", "encrypted-media");
  frame.src = "https://www.facebook.com/plugins/page.php?href=" + encodeURIComponent(page.trim()) +
    "&tabs=timeline&width=500&height=500&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false";
widgets.js  frame.addEventListener("load", function () {
    done = true;
    const sk = box.querySelector(".skeleton");
    if (sk) sk.remove();
  });
  frame.addEventListener("error", function () { done = true; fallback(); });
  box.appendChild(frame);
  setTimeout(function () { if (!done) fallback(); }, CONFIG.widgetTimeoutMs);
}