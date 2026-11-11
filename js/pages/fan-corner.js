import { CONFIG } from "../config.js";
import { isUrl, isEmail, storageGet, storageSet } from "../utils.js";
import { emailEntry, mailto } from "../components.js";

export async function init(site) {
  const fc = site.fanCorner || {};
  const wrap = document.getElementById("fan-wrap");
  const closed = document.getElementById("fan-closed");
  if (fc.enabled === false) { wrap.hidden = true; closed.hidden = false; return; }

  const form = document.getElementById("fan-form");
  const status = document.getElementById("fan-status");
  const msg = document.getElementById("f-message");
  const counter = document.getElementById("f-counter");
  const submit = document.getElementById("f-submit");
  msg.maxLength = CONFIG.fanMaxLength;

  const updateCounter = function () { counter.textContent = msg.value.length + " / " + CONFIG.fanMaxLength; };
  msg.addEventListener("input", updateCounter);
  updateCounter();

  function show(kind, text, withRetry) {
    status.hidden = false;
    status.className = "status " + (kind === "ok" ? "ok" : kind === "err" ? "err" : "");
    status.textContent = text;
    if (withRetry) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn";
      b.textContent = "Try again";
      b.addEventListener("click", handle);
      status.appendChild(document.createElement("br"));
      status.appendChild(b);
    }
  }

  function read() {
    const v = function (id) { return document.getElementById(id).value.trim(); };
    return { name: v("f-name"), email: v("f-email"), type: v("f-type"), message: v("f-message"), link: v("f-link"), trap: v("f-website") };
  }

  function validate(d) {
    if (!d.message) return "Please write a message.";
    if (d.message.length > CONFIG.fanMaxLength) return "Your message is too long.";
    if (d.email && !isEmail(d.email)) return "That contact email doesn't look right.";
    if (d.link && !isUrl(d.link)) return "Links must start with http:// or https://";
    return "";
  }

  function cooldownLeft() {
    const last = Number(storageGet(CONFIG.storageKeys.fanCooldown)) || 0;
    return Math.max(0, CONFIG.fanCooldownMs - (Date.now() - last));
  }

  function subjectOf(d) { return "[Fan Corner] " + d.type + (d.name ? " from " + d.name : ""); }

  function bodyOf(d) {
    return d.message + (d.link ? "\n\nLink: " + d.link : "") + (d.email ? "\n\nReply to: " + d.email : "");
  }

  async function post(d) {
    const ep = String(fc.endpoint || "").trim();
    const isFormspree = fc.service === "formspree";
    const url = isUrl(ep) ? ep : (isFormspree ? "https://formspree.io/f/" + ep : "https://api.web3forms.com/submit");
    const payload = { name: d.name, email: d.email, type: d.type, subject: subjectOf(d), message: d.message, link: d.link };
    if (!isFormspree && !isUrl(ep)) payload.access_key = ep; // Web3Forms public access key
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, 15000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl.signal
      });
      let json = {};
      try { json = await res.json(); } catch (e) { /* some services return no JSON */ }
      return res.ok && json.success !== false;
    } finally {
      clearTimeout(timer);
    }
  }

  async function handle(e) {
    if (e && e.preventDefault) e.preventDefault();
    const d = read();
    if (d.trap) { show("ok", "Thanks! Your idea was sent."); return; } // honeypot filled: act like success, send nothing
    const problem = validate(d);
    if (problem) { show("err", problem); return; }
    const wait = cooldownLeft();
    if (wait > 0) { show("err", "Please wait " + Math.ceil(wait / 1000) + " seconds before sending another one."); return; }

    const ep = String(fc.endpoint || "").trim();
    if (!ep) {
      const fan = emailEntry(site, "fans");
      if (!fan) { show("err", "The form isn't set up yet. Please check back soon."); return; }
      window.location.href = mailto(fan.address, subjectOf(d), bodyOf(d));
      show("ok", "Your email app should open with your message ready to send.");
      return;
    }

    submit.disabled = true;
    show("", "Sending...");
    try {
      const ok = await post(d);
      if (!ok) throw new Error("service rejected");
      storageSet(CONFIG.storageKeys.fanCooldown, String(Date.now()));
      form.reset(); // only cleared on success, never on error
      updateCounter();
      show("ok", "Thanks! Your idea was sent.");
    } catch (err) {
      console.warn("[km2d] fan form failed", err);
      show("err", "Something went wrong and your message was not sent. Your text is still here.", true);
    } finally {
      submit.disabled = false;
    }
  }

  form.addEventListener("submit", handle);
}