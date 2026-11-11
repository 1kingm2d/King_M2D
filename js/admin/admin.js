/* Admin: edits the JSON data files in your GitHub repo through the Contents API.
   Flow: login -> load files (+ SHAs) -> edit in memory -> validate -> commit each changed file. */
import { CONFIG } from "../config.js";
import { esc, isUrl, isEmail, storageGet, storageSet, storageRemove, debounce } from "../utils.js";
import { createClient } from "./github.js";
import { compressImage, blobToBase64 } from "./image.js";
import { SECTIONS, FILE_DEFAULTS } from "./sections.js";
import { renderFollowSection, renderWorkWithMe } from "../components.js";

const FILES = {
  site: CONFIG.files.site,
  downloads: CONFIG.files.downloads,
  merch: CONFIG.files.merch,
  pinned: CONFIG.files.pinned
};

const state = { client: null, repo: "", data: {}, shas: {}, dirty: new Set(), section: SECTIONS[0].id, focusIdx: -1, pending: null };
const $ = function (id) { return document.getElementById(id); };
let uid = 0;
let toastTimer;

/* ---------- small helpers ---------- */
function clone(o) { return JSON.parse(JSON.stringify(o)); }

function getPath(obj, p) {
  return p.split(".").reduce(function (a, k) { return a == null ? undefined : a[k]; }, obj);
}

function setPath(obj, p, v) {
  const ks = p.split(".");
  let c = obj;
  for (let i = 0; i < ks.length - 1; i++) {
    if (c[ks[i]] == null || typeof c[ks[i]] !== "object") c[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {};
    c = c[ks[i]];
  }
  c[ks[ks.length - 1]] = v;
}

function toast(msg, kind) {
  const t = $("toast");
  t.textContent = msg;
  t.className = "toast " + (kind || "");
  t.hidden = false;
  clearTimeout(toastTimer);
  if (kind !== "err") toastTimer = setTimeout(function () { t.hidden = true; }, 6000);
}

function currentSection() {
  return SECTIONS.find(function (s) { return s.id === state.section; }) || SECTIONS[0];
}

/* ---------- rendering ---------- */
function fieldHtml(file, path, fd, value) {
  const id = "f" + (++uid);
  const attrs = 'id="' + id + '" data-file="' + file + '" data-path="' + esc(path) + '" data-kind="' + fd.kind + '"';
  const help = fd.help ? '<p class="help">' + esc(fd.help) + "</p>" : "";
  let control = "";
  switch (fd.kind) {
    case "textarea":
      control = '<textarea class="textarea" ' + attrs + ">" + esc(value || "") + "</textarea>";
      break;
    case "lines":
      control = '<textarea class="textarea" ' + attrs + ' placeholder="One per line">' + esc(Array.isArray(value) ? value.join("\n") : "") + "</textarea>";
      break;
    case "check": {
      const on = fd.on ? value !== false : !!value;
      return '<div class="field check"><label><input type="checkbox" ' + attrs + (on ? " checked" : "") + "> " + esc(fd.label) + "</label>" + help + "</div>";
    }
    case "select":
      control = '<select class="select" ' + attrs + ">" + fd.options.map(function (o) {
        return '<option value="' + esc(o[0]) + '"' + (o[0] === value ? " selected" : "") + ">" + esc(o[1]) + "</option>";
      }).join("") + "</select>";
      break;
    case "image": {
      const src = value ? (/^https?:/.test(value) ? value : "../" + value) : "";
      control = '<div class="img-row"><input class="input" type="text" ' + attrs + ' value="' + esc(value || "") + '" placeholder="assets/uploads/... or https://...">' +
        '<button type="button" class="btn" data-action="upload" data-file="' + file + '" data-path="' + esc(path) + '">Upload</button></div>' +
        '<img class="thumb" alt="" ' + (src ? 'src="' + esc(src) + '"' : "hidden") + ">";
      break;
    }
    default:
      control = '<input class="input" type="' + (fd.kind === "url" ? "url" : fd.kind === "email" ? "email" : "text") + '" ' + attrs + ' value="' + esc(value || "") + '">';
  }
  return '<div class="field"><label for="' + id + '">' + esc(fd.label) + (fd.required ? " *" : "") + "</label>" + control + help + "</div>";
}

function blockHtml(block) {
  const data = state.data[block.file];
  if (block.type === "fields") {
    return '<div class="block">' + (block.title ? "<h2>" + esc(block.title) + "</h2>" : "") +
      block.fields.map(function (fd) { return fieldHtml(block.file, fd.path, fd, getPath(data, fd.path)); }).join("") + "</div>";
  }
  const arr = getPath(data, block.path) || [];
  const items = arr.map(function (item, i) {
    const title = (item && item[block.titleKey]) || (block.label + " " + (i + 1));
    const where = 'data-file="' + block.file + '" data-path="' + esc(block.path) + '" data-index="' + i + '"';
    return "<details class=\"item\"" + (arr.length <= 3 || i === state.focusIdx ? " open" : "") + "><summary>" + esc(title) + "</summary>" +
      block.fields.map(function (fd) { return fieldHtml(block.file, block.path + "." + i + "." + fd.path, fd, getPath(item, fd.path)); }).join("") +
      '<div class="btn-row">' +
      '<button type="button" class="btn" data-action="up" ' + where + (i === 0 ? " disabled" : "") + ">Move up</button>" +
      '<button type="button" class="btn" data-action="down" ' + where + (i === arr.length - 1 ? " disabled" : "") + ">Move down</button>" +
      '<button type="button" class="btn" data-action="del" ' + where + ">Delete</button></div></details>";
  }).join("");
  return '<div class="block"><h2>' + esc(block.label.charAt(0).toUpperCase() + block.label.slice(1)) + "s</h2>" +
    (items || '<p class="muted">Nothing here yet.</p>') +
    '<button type="button" class="btn btn-primary" data-action="add" data-file="' + block.file + '" data-path="' + esc(block.path) + '">Add ' + esc(block.label) + "</button></div>";
}

function renderPreview() {
  const s = state.data.site || {};
  const b = s.brand || {};
  $("preview").innerHTML = "<h2>Live preview</h2><h3>" + esc(b.name || "King M2D") + '</h3><p class="muted">' + esc(b.tagline || "") + "</p>" +
    renderFollowSection(s) + renderWorkWithMe(s, false);
}

function updateDirtyUi() {
  const n = state.dirty.size;
  const btn = $("save-btn");
  btn.disabled = n === 0;
  btn.textContent = n ? "Save changes (" + n + " file" + (n > 1 ? "s" : "") + ")" : "Save changes";
}

function render() {
  const sec = currentSection();
  $("admin-nav").innerHTML = SECTIONS.map(function (s) {
    return '<button type="button" class="nav-item" data-section="' + s.id + '"' + (s.id === sec.id ? ' aria-current="page"' : "") + ">" + esc(s.title) + "</button>";
  }).join("");
  $("panel").innerHTML = "<h1>" + esc(sec.title) + "</h1>" + (sec.intro ? '<p class="muted">' + esc(sec.intro) + "</p>" : "") + sec.blocks.map(blockHtml).join("");
  renderPreview();
  updateDirtyUi();
}

/* ---------- editing ---------- */
function markDirty(file) {
  state.dirty.add(file);
  updateDirtyUi();
}

const refreshPreview = debounce(renderPreview, 200);

function onChange(e) {
  const t = e.target;
  if (!t.dataset || !t.dataset.path || !t.dataset.file) return;
  let v;
  if (t.dataset.kind === "check") v = t.checked;
  else if (t.dataset.kind === "lines") v = t.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
  else v = t.value;
  setPath(state.data[t.dataset.file], t.dataset.path, v);
  markDirty(t.dataset.file);
  refreshPreview();
}

function currentBlock(file, path) {
  return currentSection().blocks.find(function (b) { return b.type === "list" && b.file === file && b.path === path; });
}

function onClick(e) {
  const nav = e.target.closest("[data-section]");
  if (nav) { state.section = nav.dataset.section; state.focusIdx = -1; render(); window.scrollTo(0, 0); return; }

  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action, file = btn.dataset.file, path = btn.dataset.path, i = Number(btn.dataset.index);

  if (action === "upload") {
    state.pending = { file: file, path: path, btn: btn };
    $("file-input").value = "";
    $("file-input").click();
    return;
  }

  const block = currentBlock(file, path);
  if (!block) return;
  let arr = getPath(state.data[file], path);
  if (!Array.isArray(arr)) { arr = []; setPath(state.data[file], path, arr); }

  if (action === "add") {
    const item = clone(block.blank);
    if ("id" in item) item.id = "item-" + Date.now();
    arr.push(item);
    state.focusIdx = arr.length - 1;
  } else if (action === "del") {
    if (!confirm("Delete this item?")) return;
    arr.splice(i, 1);
    state.focusIdx = -1;
  } else if (action === "up" && i > 0) {
    const tmp = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = tmp; state.focusIdx = i - 1;
  } else if (action === "down" && i < arr.length - 1) {
    const tmp = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = tmp; state.focusIdx = i + 1;
  } else {
    return;
  }
  markDirty(file);
  render();
}

async function onFilePicked(e) {
  const file = e.target.files && e.target.files[0];
  const p = state.pending;
  if (!file || !p) return;
  try {
    toast("Compressing image...");
    const out = await compressImage(file, 1200, 0.82);
    const slug = (file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "image").slice(0, 30);
    const dest = "assets/uploads/" + Date.now() + "-" + slug + "." + out.ext;
    toast("Uploading to GitHub...");
    await state.client.putBase64(dest, await blobToBase64(out.blob), null, "admin: upload " + dest);
    setPath(state.data[p.file], p.path, dest);
    markDirty(p.file);
    const field = p.btn.closest(".field");
    field.querySelector("input").value = dest;
    const th = field.querySelector(".thumb");
    th.src = URL.createObjectURL(out.blob);
    th.hidden = false;
    renderPreview();
    toast("Image uploaded. Press Save to keep the new path.", "ok");
  } catch (err) {
    toast(err.message || "Upload failed.", "err");
  }
}

/* ---------- validation ---------- */
function checkField(fd, value) {
  const v = typeof value === "string" ? value.trim() : value;
  if (fd.required && !v) return "is required";
  if (fd.kind === "url" && v && !isUrl(v)) return "must be a full link starting with https://";
  if (fd.kind === "email" && v && !isEmail(v)) return "is not a valid email";
  if (fd.pattern && v && !fd.pattern.test(v)) return fd.patternMsg || "looks wrong";
  return "";
}

function collectErrors() {
  const errs = [];
  SECTIONS.forEach(function (sec) {
    sec.blocks.forEach(function (block) {
      const data = state.data[block.file];
      if (block.type === "fields") {
        block.fields.forEach(function (fd) {
          const m = checkField(fd, getPath(data, fd.path));
          if (m) errs.push(sec.title + ": " + fd.label + " " + m);
        });
      } else {
        (getPath(data, block.path) || []).forEach(function (item, i) {
          block.fields.forEach(function (fd) {
            const m = checkField(fd, getPath(item, fd.path));
            if (m) errs.push(sec.title + " #" + (i + 1) + ": " + fd.label + " " + m);
          });
        });
      }
    });
  });
  return errs;
}

function showErrors(errs) {
  const box = $("errors");
  box.hidden = errs.length === 0;
  box.innerHTML = errs.length ? "<strong>Fix these before saving:</strong><ul>" + errs.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul>" : "";
}

/* ---------- load and save ---------- */
async function loadAll() {
  state.data = {};
  state.shas = {};
  state.dirty.clear();
  for (const key of Object.keys(FILES)) {
    const file = await state.client.getFile(FILES[key]);
    if (file) {
      try {
        state.data[key] = JSON.parse(file.text);
      } catch (err) {
        throw new Error(FILES[key] + " on GitHub is not valid JSON. Fix it on GitHub first.");
      }
      state.shas[key] = file.sha;
    } else {
      state.data[key] = clone(FILE_DEFAULTS[key]);
      state.shas[key] = null;
    }
  }
}

async function save() {
  const errs = collectErrors();
  showErrors(errs);
  if (errs.length) { toast("Fix the problems listed at the top first.", "err"); return; }
  const btn = $("save-btn");
  btn.disabled = true;
  toast("Saving to GitHub...");
  try {
    for (const key of Array.from(state.dirty)) {
      if (key === "downloads") state.data.downloads.updated = new Date().toISOString().slice(0, 10);
      const text = JSON.stringify(state.data[key], null, 2) + "\n";
      state.shas[key] = await state.client.putText(FILES[key], text, state.shas[key], "admin: update " + FILES[key]);
      state.dirty.delete(key);
    }
    toast("Saved! Your changes go live in about a minute.", "ok");
  } catch (err) {
    toast(err.message || "Save failed.", "err");
  } finally {
    updateDirtyUi();
  }
}

/* ---------- login / logout ---------- */
function showLogin(message) {
  $("editor").hidden = true;
  $("login").hidden = false;
  const box = $("login-error");
  box.hidden = !message;
  box.textContent = message || "";
}

async function connect(token, repo) {
  const btn = $("login-btn");
  btn.disabled = true;
  try {
    const client = createClient(token, repo);
    await client.check();
    state.client = client;
    state.repo = repo;
    await loadAll();
    const stored = storageSet(CONFIG.storageKeys.adminToken, token) && storageSet(CONFIG.storageKeys.adminRepo, repo);
    $("repo-label").textContent = repo;
    $("login").hidden = true;
    $("editor").hidden = false;
    render();
    if (!stored) toast("Your browser blocked storage, so you will need to log in again next time.", "err");
  } catch (err) {
    showLogin(err.message || "Could not connect.");
  } finally {
    btn.disabled = false;
  }
}

function logout() {
  if (state.dirty.size && !confirm("You have unsaved changes. Log out anyway?")) return;
  storageRemove(CONFIG.storageKeys.adminToken);
  storageRemove(CONFIG.storageKeys.adminRepo);
  state.client = null;
  state.dirty.clear();
  $("login-token").value = "";
  showLogin("");
}

async function reload() {
  if (state.dirty.size && !confirm("Reloading discards your unsaved changes. Continue?")) return;
  try {
    await loadAll();
    showErrors([]);
    render();
    toast("Reloaded from GitHub.", "ok");
  } catch (err) {
    toast(err.message || "Reload failed.", "err");
  }
}

/* ---------- start ---------- */
function init() {
  document.addEventListener("click", onClick);
  $("panel").addEventListener("input", onChange);
  $("panel").addEventListener("change", onChange);
  $("file-input").addEventListener("change", onFilePicked);
  $("save-btn").addEventListener("click", save);
  $("logout-btn").addEventListener("click", logout);
  $("reload-btn").addEventListener("click", reload);

  $("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const repo = $("login-repo").value.trim();
    const token = $("login-token").value.trim();
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) { showLogin("Repo must look like username/repo-name."); return; }
    if (!token) { showLogin("Please paste your token."); return; }
    connect(token, repo);
  });

  window.addEventListener("beforeunload", function (e) {
    if (state.dirty.size) { e.preventDefault(); e.returnValue = ""; }
  });

  const token = storageGet(CONFIG.storageKeys.adminToken);
  const repo = storageGet(CONFIG.storageKeys.adminRepo);
  if (repo) $("login-repo").value = repo;
  if (token && repo) connect(token, repo); else showLogin("");
}

init();