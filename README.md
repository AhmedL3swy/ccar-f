# CCAR-F Field Guide

Unofficial study site for the Claude Certified Architect – Foundations (CCAR-F) exam, in English and Egyptian Arabic: notes (with short versions), exam traps with a quiz mode, "View summary" popups, five one-page cheat tables and a disclaimer.

Everything is in this one static folder. Upload the whole folder as it is.

```
website/
├─ index.html  notes.html  traps.html  cheat-tables.html  cheat-table-1…5.html  disclaimer.html  404.html
├─ ar/          Arabic (right-to-left) versions of every page, same file names
├─ assets/      site.css, site.js (edit these), favicon.svg (generated)
├─ data/        content: d1.json … d5.json (English), d1.ar.json … d5.ar.json (Arabic)
├─ src/         build.mjs, lib.mjs, cheatsheets.mjs, cheatsheets.ar.mjs
└─ README.md
```

## Deploy to Cloudflare Pages (upload, no Git)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Name the project (it becomes `<name>.pages.dev`) → **Create project**.
3. Drag this **`website` folder** (or `website.zip`, created next to it by the build) into the upload box → **Deploy site**.

To publish an update: rebuild (below), then open the project → **Deployments** → **Create deployment** and upload the folder or zip again.

- Cloudflare serves clean URLs: `/notes.html` also works as `/notes`.
- `404.html` is used automatically for missing pages.
- The Arabic site is under `/ar/` (e.g. `/ar/notes`).
- `data/` and `src/` are uploaded too and are publicly readable (e.g. `/data/d1.json`); they contain only the site's own content and build code.

The same folder works on any static host (Netlify Drop, Vercel, GitHub Pages, an S3 bucket…).

## Edit content, then rebuild

| File | What it holds |
|---|---|
| `data/d1.json` … `d5.json` | English: domain `intro`; per task statement `task`, `summary`, `key_concept` (with `short`), `notes` (each with a `short` version), `facts`, `terms`, `traps`, `exam_tips`; plus the domain's `comparisons`. |
| `data/d1.ar.json` … `d5.ar.json` | The same in Egyptian Arabic, same structure. Code in `backticks` must match the English exactly. |
| `src/cheatsheets.mjs`, `src/cheatsheets.ar.mjs` | The five cheat tables, English and Arabic. |
| `src/lib.mjs` | Page layout, icons, domain names and interface text (`STR`). |
| `src/build.mjs` | Page text for both languages (`P`) and the page generator. |
| `assets/site.css`, `assets/site.js` | Styles and behaviour. |

When you change content, change it in both the English and the Arabic file. Then rebuild (Node 18 or later), from inside this folder:

```sh
node src/build.mjs
```

The build rewrites only the `.html` pages (and `assets/favicon.svg`); it never touches `data/`, `src/`, `assets/site.css`, `assets/site.js` or this README. It also refreshes `website.zip` next to this folder. Don't edit the `.html` files by hand: the next build replaces them.

Text fields accept `` `backticks` `` for inline code; everything else is plain text.
