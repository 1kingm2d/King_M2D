/* Tiny GitHub Contents API client. Saves = commits to your repo. The token never leaves this browser except to api.github.com. */
const API = "https://api.github.com";

export class GitHubError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function friendly(status) {
  if (status === 401) return "The token is invalid or expired. Create a new one and log in again.";
  if (status === 403) return "The token lacks permission (it needs Contents: Read and write on this repo), or GitHub is rate limiting you.";
  if (status === 404) return "Repo or file not found. Check the repo name and that the token has access to it.";
  if (status === 409 || status === 422) return "CONFLICT: this file changed on GitHub after you loaded it. Press Reload (your unsaved edits will be lost) and try again.";
  return "GitHub error (HTTP " + status + "). Try again in a moment.";
}

export function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach(function (b) { bin += String.fromCharCode(b); });
  return btoa(bin);
}

function base64ToUtf8(b64) {
  const bin = atob(b64.replace(/\s/g, ""));
  const bytes = Uint8Array.from(bin, function (c) { return c.charCodeAt(0); });
  return new TextDecoder().decode(bytes);
}

export function createClient(token, repo) {
  const headers = {
    "Authorization": "Bearer " + token,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json"
  };
  const contents = API + "/repos/" + repo + "/contents/";

  async function call(method, url, body) {
    let res;
    try {
      res = await fetch(url, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
    } catch (err) {
      throw new GitHubError(0, "Network problem. Check your connection and try again.");
    }
    if (!res.ok) throw new GitHubError(res.status, friendly(res.status));
    return res.json();
  }

  return {
    /** Confirms the repo exists and the token can see it. */
    async check() { await call("GET", API + "/repos/" + repo); },

    /** Returns { sha, text } or null when the file does not exist yet. */
    async getFile(path) {
      try {
        const j = await call("GET", contents + path);
        return { sha: j.sha, text: base64ToUtf8(j.content) };
      } catch (err) {
        if (err.status === 404) return null;
        throw err;
      }
    },

    /** Create (sha = null) or update (sha = last known sha). Returns the new sha. */
    async putBase64(path, b64, sha, message) {
      const body = { message: message, content: b64 };
      if (sha) body.sha = sha;
      const j = await call("PUT", contents + path, body);
      return j.content.sha;
    },

    putText(path, text, sha, message) {
      return this.putBase64(path, utf8ToBase64(text), sha, message);
    }
  };
}