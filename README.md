# CCAR-F Field Guide

Unofficial study site for the Claude Certified Architect – Foundations (CCAR-F) exam, in English and Egyptian Arabic: five one-page cheat tables (each with a decision table grouped by task statement, comparison tables, key facts and terms, and a plain-language summary of every task statement), exam traps with a quiz mode on their own page (for practice; the cheat tables don't link to them), a search page over all the notes (with short versions), a study plan page to tick off each task statement's steps (summary, decision table, exam traps, practice questions), a bookmarks page for the decision table rows, traps, notes and facts you save (kept in the browser's localStorage), and a disclaimer. On phones a bottom tab bar, a pinned search row and a pinned jump bar keep navigation one tap away.

Everything is in this one static folder. The build packs it into `website.zip` for upload.

```
website/
├─ index.html  plan.html  notes.html  traps.html  cheat-tables.html  cheat-table-1…5.html  bookmarks.html  disclaimer.html  404.html
├─ ar/          Arabic (right-to-left) versions of every page, same file names
├─ assets/      site.css, site.js (edit these), favicon.svg and pop/ (generated: pop-up content loaded on demand)
├─ data/        content: d1.json … d5.json (English), d1.ar.json … d5.ar.json (Arabic)
├─ src/         build.mjs, lib.mjs, cheatsheets.mjs, cheatsheets.ar.mjs
└─ README.md
```

## Deploy to Cloudflare Pages (upload, no Git)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Name the project (it becomes `<name>.pages.dev`) → **Create project**.
3. Drag **`website.zip`** (created next to this folder by the build) into the upload box → **Deploy site**.

Upload the zip, not the folder: the folder also holds the `.git` history, which would become public. The zip leaves out every dot-folder.

To publish an update: rebuild (below), then open the project → **Deployments** → **Create deployment** and upload the new zip.

- Cloudflare serves clean URLs: `/notes.html` also works as `/notes`.
- `404.html` is used automatically for missing pages.
- The Arabic site is under `/ar/` (e.g. `/ar/notes`).
- `data/` and `src/` are uploaded too and are publicly readable (e.g. `/data/d1.json`); they contain only the site's own content and build code.

The same folder works on any static host (Netlify Drop, Vercel, GitHub Pages, an S3 bucket…).

## Edit content, then rebuild

| File | What it holds |
|---|---|
| `data/d1.json` … `d5.json` | English: domain `intro`; per task statement `task`, `summary` (the plain-language summary shown by the Summary buttons: one or two paragraphs, about 170 words), `key_concept` (with `short`), `notes` (each with a `short` version), `facts`, `terms`, `traps`, `exam_tips`; plus the domain's `comparisons`. |
| `data/d1.ar.json` … `d5.ar.json` | The same in Egyptian Arabic, same structure. Code in `backticks` must match the English exactly. |
| `src/cheatsheets.mjs`, `src/cheatsheets.ar.mjs` | The five cheat tables, English and Arabic: the cards, plus each domain's decision table (`decide`: rows of symptom → usual answer for each task statement code; `recall`: question → answer rows covering that task's facts, terms, summary and comparison tables, shown after its decision rows under "Facts & terms"). The English and Arabic files must have the same rows in the same order for every task, since each row carries both languages; the build stops if they don't. |
| `src/lib.mjs` | Page layout, icons, domain names and interface text (`STR`). |
| `src/build.mjs` | Page text for both languages (`P`) and the page generator. |
| `assets/site.css`, `assets/site.js` | Styles and behaviour. |

When you change content, change it in both the English and the Arabic file. Then rebuild (Node 18 or later), from inside this folder:

```sh
node src/build.mjs
```

The build rewrites only the `.html` pages, `assets/favicon.svg` and `assets/pop/` (each domain's summaries, decision table rows and traps, which the decision table and study plan pop-ups load only when opened); it never touches `data/`, `src/`, `assets/site.css`, `assets/site.js` or this README. It also refreshes `website.zip` next to this folder. Don't edit the `.html` files by hand: the next build replaces them.

Text fields accept `` `backticks` `` for inline code. Summaries also accept `**bold**` for key terms (never inside code) and a blank line between paragraphs. Everything else is plain text.
