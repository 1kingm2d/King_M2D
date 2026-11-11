/* Central config. Change paths and platform order here, nowhere else. */

// Platform order is fixed by the brief: YouTube, Instagram, TikTok, Facebook, X, Discord, Patreon, Ko-fi.
export const PLATFORMS = [
  { key: "youtube",   label: "YouTube" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok",    label: "TikTok" },
  { key: "facebook",  label: "Facebook" },
  { key: "x",         label: "X" },
  { key: "discord",   label: "Discord" },
  { key: "patreon",   label: "Patreon" },
  { key: "kofi",      label: "Ko-fi" }
];

export const CONFIG = {
  dataDir: "data/",
  files: {
    site: "data/site.json",
    videos: "data/videos.json",
    downloads: "data/downloads.json",
    merch: "data/merch.json",
    pinned: "data/pinned-posts.json"
  },
  widgetTimeoutMs: 8000,      // how long to wait before showing a widget fallback
  fanCooldownMs: 60000,       // minimum time between Fan Corner submissions
  fanMaxLength: 1000,         // max characters in the Fan Corner message
  storageKeys: {
    fanCooldown: "km2d-fan-last",
    adminToken: "km2d-admin-token",
    adminRepo: "km2d-admin-repo"
  }
};

/* Relative-path helper so the site works under a GitHub Pages subpath
   (username.github.io/repo-name/). Each page sets <body data-root="./">
   (or "../" for pages inside a folder such as /admin/). */
export function root() {
  return (document.body && document.body.dataset.root) || "./";
}

export function path(p) {
  return root() + String(p).replace(/^\.?\//, "");
}