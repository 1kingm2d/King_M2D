/* Shared UI pieces injected on every page: header, footer, follow bar, Work With Me, video cards. */
import { PLATFORMS, path } from "./config.js";
import { icon } from "./icons.js";
import { esc, isUrl, isEmail, formatDate } from "./utils.js";

const NAV = [
  ["home", "index.html", "Home"],
  ["videos", "videos.html", "Videos"],
  ["social", "social.html", "Social Feed"],
  ["downloads", "downloads.html", "Downloads"],
  ["merch", "merch.html", "Merch"],
  ["support", "support.html", "Support"],
  ["fan-corner", "fan-corner.html", "Fan Corner"],
  ["about", "about.html", "About"],
  ["contact", "contact.html", "Contact"]
];

const STATUS = {
  available: { text: "Available for work", cls: "ok" },
  limited: { text: "Limited availability", cls: "warn" },
  unavailable: { text: "Not taking work right now", cls: "off" }
};

export function mailto(address, subject, body) {
  let q = [];
  if (subject) q.push("subject=" + encodeURIComponent(subject));
  if (body) q.push("body=" + encodeURIComponent(body));
  return "mailto:" + address.trim() + (q.length ? "?" + q.join("&") : "");
}

/** Visible email entry or null. Hidden or invalid emails never render. */
export function emailEntry(site, which) {
  const e = site.emails && site.emails[which];
  if (!e || e.visible === false || !isEmail(e.address)) return null;
  return e;
}

function brandMark(site) {
  const b = site.brand || {};
  const img = b.logo || b.avatar;
  return img
    ? '<img src="' + esc(img) + '" alt="" width="36" height="36" class="brand-img">'
    : '<span class="brand-dot" aria-hidden="true">M2D</span>';
}

export function renderHeader(site, page) {
  const fanOn = !(site.fanCorner && site.fanCorner.enabled === false);
  const items = NAV.filter(function (n) { return n[0] !== "fan-corner" || fanOn; });
  const links = items.map(function (n) {
    return '<a href="' + path(n[1]) + '"' + (n[0] === page ? ' aria-current="page"' : "") + ">" + n[2] + "</a>";
  }).join("");
  return '<header class="site-header"><div class="container header-inner">' +
    '<a class="brand" href="' + path("index.html") + '">' + brandMark(site) +
    "<span>" + esc((site.brand && site.brand.name) || "King M2D") + "</span></a>" +
    '<nav id="site-nav" class="nav" aria-label="Main">' + links + "</nav>" +
    '<button type="button" class="btn theme-btn" id="theme-btn" aria-label="Change theme"></button>' +
    '<button type="button" class="menu-btn" id="menu-btn" aria-expanded="false" aria-controls="site-nav" aria-label="Menu">' +
    "<span></span><span></span><span></span></button></div></header>";
}

export function followButtons(site) {
  const links = site.links || {};
  return PLATFORMS.filter(function (p) { return isUrl(links[p.key]); }).map(function (p) {
    return '<a class="follow-btn" href="' + esc(links[p.key].trim()) + '" target="_blank" rel="noopener noreferrer" aria-label="' +
      esc(p.label) + '">' + icon(p.key) + "<span>" + esc(p.label) + "</span></a>";
  }).join("");
}

export function renderFollowSection(site) {
  const btns = followButtons(site);
  return '<div class="container"><h2>Follow ' + esc((site.brand && site.brand.name) || "King M2D") + "</h2>" +
    (btns ? '<div class="follow-row">' + btns + "</div>" : '<p class="muted">Social links are coming soon.</p>') + "</div>";
}

export function renderFooter(site) {
  const btns = followButtons(site);
  const mails = ["fans", "business"].map(function (k) {
    const e = emailEntry(site, k);
    return e ? '<a class="follow-btn" href="' + esc(mailto(e.address)) + '">' + icon("mail") + "<span>" +
      esc(e.label || k) + "</span></a>" : "";
  }).join("");
  return '<footer class="site-footer"><div class="container"><p class="footer-title">Follow ' +
    esc((site.brand && site.brand.name) || "King M2D") + "</p>" +
    '<div class="follow-row">' + (btns + mails || '<span class="muted">Links coming soon.</span>') + "</div>" +
    '<p class="muted small">&copy; ' + new Date().getFullYear() + " " + esc((site.brand && site.brand.name) || "King M2D") +
    ". All rights reserved.</p></div></footer>";
}

/** Work With Me block. Returns "" when the master toggle is off (section disappears). */
export function renderWorkWithMe(site, teaser) {
  const w = site.workWithMe;
  if (!w || w.enabled === false) return "";
  const biz = emailEntry(site, "business");
  const buttons = (w.buttons || []).filter(function (b) { return b && b.enabled !== false && b.label; })
    .map(function (b) {
      const href = isUrl(b.link) ? b.link.trim() : (biz ? mailto(biz.address, b.label) : "");
      return href ? '<a class="btn btn-primary" href="' + esc(href) + '">' + esc(b.label) + "</a>" : "";
    }).join("");
  const st = STATUS[w.status] || STATUS.available;
  return '<div class="container"><div class="card wwm"><div class="wwm-head"><h2>Work With Me</h2>' +
    '<span class="badge ' + st.cls + '">' + st.text + "</span></div>" +
    (w.offer ? "<p>" + esc(w.offer) + "</p>" : "") +
    (!teaser && w.note ? '<p class="muted">' + esc(w.note) + "</p>" : "") +
    (buttons ? '<div class="btn-row">' + buttons + "</div>" : "") +
    (teaser ? '<a href="' + path("contact.html") + '">More details</a>' : "") + "</div></div>";
}

export function renderVideoCards(videos) {
  return videos.map(function (v) {
    return '<a class="card video-card" href="' + esc(v.url) + '" target="_blank" rel="noopener noreferrer">' +
      '<img src="' + esc(v.thumbnail) + '" alt="" width="480" height="360" loading="lazy">' +
      '<div class="card-body"><h3>' + esc(v.title) + '</h3><p class="muted small">' + esc(formatDate(v.published)) + "</p></div></a>";
  }).join("");
}

/** Wire up the menu button and the theme button after the header is in the DOM. */
export function wireHeader() {
  const menu = document.getElementById("menu-btn");
  const nav = document.getElementById("site-nav");
  if (menu && nav) {
    menu.addEventListener("click", function () {
      const open = nav.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(open));
    });
  }
  const tb = document.getElementById("theme-btn");
  if (tb) {
    const label = function () {
      const c = window.KingTheme ? window.KingTheme.get() : "dark";
      tb.textContent = "Theme: " + c;
    };
    tb.addEventListener("click", function () {
      if (window.KingTheme) window.KingTheme.cycle();
      label();
    });
    label();
  }
}