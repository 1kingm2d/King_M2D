/* Shared helpers. Every network and storage call is wrapped in try/catch. */
import { path } from "./config.js";

/** Escape text before putting it into innerHTML. */
export function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** True only for non-empty http(s) URLs. Empty or odd values mean "hide it". */
export function isUrl(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    var u = new URL(value.trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch (e) {
    return false;
  }
}

export function isEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Fetch JSON from the repo (relative path). Returns fallback on any failure. */
export async function loadJson(file, fallback) {
  try {
    const res = await fetch(path(file), { cache: "no-cache" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (err) {
    console.warn("[km2d] could not load " + file, err);
    return fallback;
  }
}

export function storageGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

export function storageSet(key, value) {
  try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
}

export function storageRemove(key) {
  try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
}

export function debounce(fn, ms) {
  let t;
  return function () {
    const args = arguments;
    clearTimeout(t);
    t = setTimeout(function () { fn.apply(null, args); }, ms);
  };
}

/** Run callback once when the element first scrolls near the viewport. */
export function whenVisible(el, callback, margin) {
  if (!el) return;
  if (!("IntersectionObserver" in window)) { callback(); return; }
  const io = new IntersectionObserver(function (entries) {
    if (entries.some(function (e) { return e.isIntersecting; })) {
      io.disconnect();
      callback();
    }
  }, { rootMargin: margin || "200px" });
  io.observe(el);
}

export function formatDate(iso) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch (e) {
    return "";
  }
}