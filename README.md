# CCAR-F Field Guide

Unofficial revision site for the Claude Certified Architect – Foundations (CCAR-F) exam. It is one page: a study plan listing the exam's five domains and 30 task statements, with a checkbox for each study step (summary, decisions & terms, exam traps, practice questions). **Mark all** on each domain's heading opens a row of chips that tick one step for every task in the domain (e.g. all its summaries) or everything in it; tap a finished chip (✓) to clear it. **Continue**, above the plan, opens the first step you haven't ticked. Tapping a task opens it in a pop-up with three tabs:

- **Summary**: a plain-language summary of the task statement.
- **Decisions & terms**: the decisions (symptom in the question → usual answer), then, under their own heading, the facts & terms to recall (question → answer).
- **Traps**: beliefs that sound right but aren't, why each one fails and what's actually true, plus how the exam tests it.

Quiz mode hides the answers until you tap them. Everything is in English; the ع button on each row (and on the summary) shows it in Egyptian Arabic. The bookmark button on each decision, fact & term and trap row saves it; **Bookmarks** in the header opens them in a pop-up, with a search box and a filter by kind, each linking back to its task. **Practice test** (in the header, the Practice questions column heading, and beside each task's Practice Qs tick) opens CertSafari's practice quiz in a new tab. Ticks, folded domains, bookmarks, quiz mode and the theme are kept in the browser's localStorage.

Each pop-up has its own address (`#1.4/summary`, `#1.4/decisions`, `#1.4/traps`, `#bookmarks`, `#about`), so the phone's back button closes it and a link can open one directly.

```
website/
├─ index.html   the page (generated)
├─ _redirects   sends links to the old pages (cheat tables, traps, search, bookmarks, /ar/…) to the page
├─ assets/      site.css, site.js (edit these), favicon.svg and pop/ (generated: each domain's pop-up content, loaded on demand)
├─ data/        content: d1.json … d5.json (English), d1.ar.json … d5.ar.json (Arabic)
├─ src/         build.mjs, lib.mjs, decisions.mjs, decisions.ar.mjs
└─ README.md
```

## Deploy to Cloudflare Pages (upload, no Git)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Name the project (it becomes `<name>.pages.dev`) → **Create project**.
3. Drag **`website.zip`** (created next to this folder by the build) into the upload box → **Deploy site**.

Upload the zip, not the folder: the folder also holds the `.git` history, which would become public. The zip leaves out every dot-folder.

To publish an update: rebuild (below), then open the project → **Deployments** → **Create deployment** and upload the new zip.

- There is no `404.html`, so Cloudflare Pages serves the page for any unknown address.
- `data/` and `src/` are uploaded too and are publicly readable (e.g. `/data/d1.json`); they contain only the site's own content and build code.

The same folder works on any static host (Netlify Drop, Vercel, GitHub Pages, an S3 bucket…); `_redirects` is understood by Cloudflare Pages and Netlify.

## Edit content, then rebuild

| File | What it holds |
|---|---|
| `data/d1.json` … `d5.json` | English, per task statement: `task`, `summary` (the Summary tab: one or two paragraphs, about 170 words), `traps` and `exam_tips` (the Traps tab). The `notes`, `facts`, `terms`, `key_concept` and `comparisons` fields are source material the decisions & terms were written from; the page doesn't show them. |
| `data/d1.ar.json` … `d5.ar.json` | The same in Egyptian Arabic, same structure and order. Code in `backticks` must match the English exactly. |
| `src/decisions.mjs`, `src/decisions.ar.mjs` | The Decisions & terms tab, English and Arabic: `DECIDE` (symptom → usual answer rows for each task statement code) and `RECALL` (the facts & terms: question → answer rows covering that task's facts, terms, summary points and comparison tables). Both files must have the same rows in the same order for every task, since each row carries both languages; the build stops if they don't. |
| `src/lib.mjs` | The page shell, icons and domain names. |
| `src/build.mjs` | The page's text and the page generator. |
| `assets/site.css`, `assets/site.js` | Styles and behaviour. |

When you change content, change it in both the English and the Arabic file. Then rebuild (Node 18 or later), from inside this folder:

```sh
node src/build.mjs
```

The build rewrites only `index.html`, `assets/favicon.svg` and `assets/pop/`; it never touches `data/`, `src/`, `assets/site.css`, `assets/site.js` or this README. It also refreshes `website.zip` next to this folder. Don't edit `index.html` by hand: the next build replaces it.

Text fields accept `` `backticks` `` for inline code. Summaries also accept `**bold**` for key terms (never inside code) and a blank line between paragraphs. Everything else is plain text.
