/* Simple stroke icons (24x24). Brand glyphs are simplified on purpose to keep the site light. */
const PATHS = {
  youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10 9l5 3-5 3z"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8"/>',
  tiktok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.4 2.4 2 4 4.5 4.2"/>',
  facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>',
  x: '<path d="M4 4l16 16M20 4L4 20"/>',
  discord: '<path d="M7 7c3-1.5 7-1.5 10 0l2 9c-1.5 1.5-3.5 2.4-5 2.5l-1-2h-2l-1 2c-1.5-.1-3.5-1-5-2.5z"/><circle cx="9.5" cy="12.5" r="1"/><circle cx="14.5" cy="12.5" r="1"/>',
  patreon: '<circle cx="14.5" cy="9.5" r="5.5"/><path d="M4 4v16"/>',
  kofi: '<path d="M4 8h13v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M17 9h2a2 2 0 0 1 0 5h-2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'
};

export function icon(key, size) {
  const s = size || 20;
  return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    (PATHS[key] || "") + "</svg>";
}