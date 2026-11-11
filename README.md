# King M2D website

A static site (plain HTML, CSS and JavaScript, no build step) for GitHub Pages. All content lives in JSON files in `data/`, and you edit it from `/admin/` without touching code.

## 1. Put it online

1. Create a new GitHub repo (public). Upload every file from this project, keeping the folders. Also create an empty file named `.nojekyll` in the root.
2. Go to **Settings > Pages**. Under "Build and deployment" choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
3. After about a minute your site is at `https://YOUR-USERNAME.github.io/YOUR-REPO/`.
4. Open `sitemap.xml` and `robots.txt` and replace `YOUR-USERNAME` and `YOUR-REPO` with your real address.

All links are relative, so the site works under a repo subpath and on a custom domain.

## 2. Create the admin token

1. GitHub > your profile picture > **Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token**.
2. Name it `king-m2d-admin`. Pick an expiration (90 days is a good start; you can make a new one later).
3. **Repository access: Only select repositories**, then choose this one repo.
4. **Permissions > Repository permissions > Contents: Read and write.** Leave everything else alone.
5. Generate, then copy the token right away (GitHub shows it once).

## 3. First admin login

1. Open `https://YOUR-USERNAME.github.io/YOUR-REPO/admin/`.
2. Enter `YOUR-USERNAME/YOUR-REPO` and paste the token, then press Connect.
3. Edit anything, then press **Save changes**. Each saved file becomes a commit, and the site updates in about a minute.

How the admin works: it reads the JSON files with the GitHub API, lets you edit them in the browser, and commits them back. Images are resized in your browser (max 1200px, WebP) and uploaded to `assets/uploads/`. Image uploads are committed immediately; the new path is saved into the JSON when you press Save.

**Security:** the admin page is public, but it can do nothing without your token. The token is the real security, and a front-end password alone would not be secure. The token is stored only in this browser (localStorage). Use **Log out / forget token** on shared computers. If a token leaks, delete it in GitHub settings and make a new one.

Conflicts: if a file changed on GitHub after you loaded it, saving shows a CONFLICT message instead of overwriting. Press Reload and redo your edit.

## 4. YouTube auto-update

1. Put your channel ID (starts with `UC`) in the admin under **Widgets**. Find it in YouTube Studio > Settings > Channel > Advanced settings.
2. In the repo go to **Actions**, enable workflows if asked, open **Update YouTube videos** and press **Run workflow**.
3. After that it runs every 4 hours. If the channel ID is empty, it skips quietly.
4. If the commit step fails, go to **Settings > Actions > General > Workflow permissions** and choose **Read and write permissions**.

## 5. Instagram (Behold)

1. Sign up free at behold.so, connect your Instagram, and create a feed.
2. Copy the embed code (or the feed URL or feed ID) and paste it into the admin under **Widgets > Behold**.
3. The free plan has a monthly view limit. When it runs out or fails, the site automatically shows your **Instagram pinned posts** (manage them in the admin) plus a Follow button.

## 6. Facebook

Paste your Facebook **Page** URL in the admin. The official Page Plugin only works for Pages, not personal profiles. If it is empty or blocked, a "Follow on Facebook" button is shown instead.

## 7. Fan Corner form

Pick one service and set it up with your **fan email**:

- **Web3Forms:** go to web3forms.com, enter your fan email, and they email you an access key. In the admin choose Web3Forms and paste the key.
- **Formspree:** go to formspree.io, create a form with your fan email. Paste the form ID (the part after `/f/`) or the full URL. In the admin choose Formspree.

Only the public key or endpoint is stored. Never paste a secret key. With nothing set, the form opens a pre-filled email to the fan email instead. If a service rejects the form, check its dashboard settings (domain allow-lists, AJAX or JSON submissions).

## 8. Social preview image

`og:image` currently points at a placeholder SVG. Many apps need an absolute PNG or JPG. Upload a 1200x630 image and, in each page's `<head>`, change `og:image` to its full URL, for example `https://YOUR-USERNAME.github.io/YOUR-REPO/assets/og.png`.

## 9. Custom domain later

1. Buy a domain. In **Settings > Pages > Custom domain** enter it and Save.
2. At your registrar add the DNS records GitHub shows (A records for an apex domain, or a CNAME for `www`).
3. Tick **Enforce HTTPS** once it is available.
4. Update `sitemap.xml`, `robots.txt` and the `og:image` URLs to the new domain.

## 10. Add a new page

1. Copy an existing page such as `about.html`, rename it, and change the `<title>`, description and `data-page="yourpage"` on `<body>`.
2. Create `js/pages/yourpage.js` exporting `export async function init(site) { ... }`.
3. Add `"yourpage"` to the `PAGES` list in `js/main.js` and a row to `NAV` in `js/components.js`.
4. Add the URL to `sitemap.xml`.

## 11. Add a new admin field

Add one line to `js/admin/sections.js`. The form, validation and saving pick it up automatically.

## Retheming

All colors, spacing, radius and shadows are CSS variables in `css/tokens.css`. Theme logic is in `js/theme.js` (dark, light, system; falls back to dark on any error).

## Sample content

Anything marked "SAMPLE" is placeholder content. Replace it from the admin.

## Troubleshooting

- Blank page: open the site through GitHub Pages (not by double-clicking the file), because JavaScript modules need a web server.
- Admin says 404: check the repo name and that the token was given access to that repo.
- Admin says 403: the token needs **Contents: Read and write**.