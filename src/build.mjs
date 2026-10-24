// The whole site is one page, index.html: the study plan. Each task statement's summary, decisions & terms and
// exam traps open in a pop-up over it, loaded per domain from assets/pop/d<n>.js the first time one of its tasks
// opens. Everything is in English; a translate button on each row (and on the summary) shows its Arabic.
//   index.html, assets/favicon.svg, assets/pop/   ← generated (rewritten on every build)
//   assets/site.css, assets/site.js                ← styles and behaviour (edit these)
//   data/, src/decisions*.mjs                      ← content (edit these)
// Everything in this folder is uploaded as-is. The build also zips it to ../website.zip.
// Run from inside this folder:  node src/build.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { SITE, DOMAINS, esc, md, icon, layout } from "./lib.mjs";
import { DECIDE, RECALL } from "./decisions.mjs";
import { DECIDE as DECIDE_AR, RECALL as RECALL_AR } from "./decisions.ar.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..");
const ZIP = join(ROOT, "..", "website.zip");
const POP_DIR = join(ROOT, "assets", "pop");
rmSync(POP_DIR, { recursive: true, force: true });
mkdirSync(POP_DIR, { recursive: true });

const load = (n, ar) => JSON.parse(readFileSync(join(ROOT, "data", `d${n}${ar ? ".ar" : ""}.json`), "utf8"));
const data = DOMAINS.map((d) => ({ ...d, en: load(d.n).lessons, ar: load(d.n, true).lessons }));

/* --------------------------------------------------------------- Text */
const S = {
  description: `A study plan for the ${SITE.exam} (CCAR-F) exam: for every task statement, a plain-language summary, decisions & terms to recall, and exam traps to drill, with an Arabic translation on every row.`,
  title: "Study plan",
  lead: "Work through every task statement: read its summary, go over its decisions & terms, drill its exam traps, then solve practice questions elsewhere. Tap a task to open it, and tick each step as you finish it. Your ticks stay in this browser.",
  examNote: "Reported exam format: 60 questions, 120 minutes, 720 of 1000 to pass. It comes from candidates and third-party guides; confirm it in the official exam guide.",
  domainLabel: (n) => `Domain ${n}`,
  // The study steps of each task statement; the first three open in the pop-up.
  steps: [
    { k: "sum", hash: "summary", th: "Summary", short: "Summary", tab: "Summary", ic: "book", open: "Open the summary" },
    { k: "dc", hash: "decisions", th: "Decisions & terms", short: "Decisions & terms", tab: "Decisions & terms", ic: "target", open: "Open the decisions & terms" },
    { k: "traps", hash: "traps", th: "Exam traps", short: "Traps", tab: "Traps", ic: "alert", open: "Open the exam traps" },
    { k: "q", th: "Solved questions (external)", short: "Solved Qs" },
  ],
  taskTh: "Task statement",
  progress: "{done} of {total} steps done · {pct}%",
  reset: "Reset", resetConfirm: "Clear all your ticks in the plan?",
  fold: "Show or hide this domain's task statements",
  close: "Close", done: "Mark this step done", prev: "Previous task statement", next: "Next task statement",
  // Labels site.js builds the pop-up with.
  js: {
    loading: "Loading…", failed: "Couldn't load this. Check your connection and try again.",
    quiz: "Quiz mode: hide the answers",
    decisions: "Decisions", terms: "Facts & terms",
    decideTh: ["Symptom in the question", "Usual answer"], termsTh: ["Question", "Answer"],
    trapsTh: ["The trap", "Why it's wrong", "What's actually true"], tips: "How the exam tests this",
    trxTh: "Translate", trxOn: "EN", trxOff: "ع", trxTitle: "Show this in Arabic",
  },
  aboutTitle: "About & disclaimer",
  about: `
    <h3>Unofficial and independent</h3>
    <p>The ${SITE.name} is an independent study aid made by and for a study group. It is not affiliated with, endorsed by, sponsored by or approved by Anthropic, PBC. "Anthropic", "Claude", "Claude Code" and "Claude Certified Architect" are names and trademarks of Anthropic, used here only to identify the exam this guide helps people prepare for.</p>
    <h3>What's here</h3>
    <p>The study plan lists the exam's five domains and their task statements. Each task statement has a plain-language summary; its decisions (the usual answer for each symptom a question describes) followed by the facts &amp; terms to recall; and its exam traps, beliefs that sound right but aren't. Every row has an Arabic translation one tap away (the ع button).</p>
    <h3>No real exam questions</h3>
    <p>Nothing on this site comes from the live exam. It contains no exam questions, answers or recalled items, and it should never be used to share them. Candidates are bound by the exam's confidentiality terms.</p>
    <h3>How to use it</h3>
    <p>The exam presents varied scenarios that need reasoning. Use the decisions to check your reasoning, not as keyword lookups: the details of the scenario decide. Read the summary first to understand why each mechanism works the way it does, and use quiz mode on the decisions, facts &amp; terms and traps to test yourself.</p>
    <h3>Accuracy</h3>
    <ul>
      <li>The content was drafted with AI assistance and may contain mistakes or omissions.</li>
      <li>Claude, Claude Code, the Agent SDK and MCP change quickly. Flags, field names, limits and model behaviour described here may be out of date. Check the official Anthropic documentation before relying on any detail.</li>
      <li>Task statements 1.1, 2.4 and 3.6 are only partly covered.</li>
      <li>The exam format on the study plan (60 questions, 120 minutes, 720 of 1000 to pass) is as reported by candidates and third-party guides, not from an official source.</li>
    </ul>
    <h3>No guarantee</h3>
    <p>Using this guide does not guarantee a passing score. Treat it as a review aid alongside the official documentation and hands-on practice.</p>
    <h3>Use</h3>
    <p>This guide is for our study group's own use. Please don't sell it or present it as official material. If you spot a mistake, tell the maintainer so it can be fixed for everyone.</p>`,
};

/* ------------------------------------------------------------- Content */
// Summary text: paragraphs split on blank lines; **bold** marks a key term. Bold markers are swapped for a
// placeholder outside `code` first, so globs like `src/**/*.ts` stay intact and md() leaves the markers alone.
const paras = (s) =>
  String(s || "").split(/\n\s*\n/).filter((p) => p.trim())
    .map((p) => {
      const marked = p.trim().split(/(`[^`]+`)/).map((x, i) => (i % 2 ? x : x.replace(/\*\*/g, "\u0001"))).join("");
      let open = false;
      return `<p>${md(marked).replace(/\u0001/g, () => ((open = !open) ? "<strong>" : "</strong>"))}</p>`;
    })
    .join("");
// Question → answer rows in both languages: [[q, a, qAr, aAr], …]. The two files must line up row for row.
const pairs = (code, en = [], ar = []) => {
  if (en.length !== ar.length) throw new Error(`${code}: the English and Arabic rows don't line up (${en.length} vs ${ar.length})`);
  return en.map(([q, a], i) => [md(q), md(a), md(ar[i][0]), md(ar[i][1])]);
};
// One pop-up file per domain: assets/pop/d<n>.js sets CCARF_POP[n] to its tasks, every field ready-made HTML.
// A script tag (not fetch) loads it, so the page also works opened straight from disk.
const tasks = [];
for (const d of data) {
  const pop = d.en.map((l, i) => {
    const a = d.ar[i];
    if (a.code !== l.code) throw new Error(`d${d.n}.ar.json: task ${i + 1} is ${a.code}, expected ${l.code}`);
    const t = {
      code: l.code,
      sum: [paras(l.summary), paras(a.summary)],
      dc: pairs(l.code, DECIDE[d.n]?.[l.code], DECIDE_AR[d.n]?.[l.code]),
      terms: pairs(l.code, RECALL[d.n]?.[l.code], RECALL_AR[d.n]?.[l.code]),
      traps: l.traps.map((x, k) => [md(x.trap), md(x.why), md(x.fix), md(a.traps[k].trap), md(a.traps[k].why), md(a.traps[k].fix)]),
      tips: (l.exam_tips || []).map((x, k) => [md(x), md(a.exam_tips[k])]),
    };
    tasks.push({ code: l.code, d: d.n, task: md(l.task), n: [t.dc.length + t.terms.length, t.traps.length] });
    return t;
  });
  writeFileSync(join(POP_DIR, `d${d.n}.js`), `window.CCARF_POP=window.CCARF_POP||{};window.CCARF_POP[${d.n}]=${JSON.stringify(pop)};\n`, "utf8");
}

/* ---------------------------------------------------------------- Page */
// The plan: one row per task statement, one checkbox per step (data-plan="1.1:sum"), kept in localStorage by
// site.js, which also works out the counts and the progress bar. Each domain's heading row folds its task rows
// away. The task and the button beside each step's checkbox are links (#1.3/decisions) that open the pop-up.
const steps = S.steps;
const popSteps = steps.filter((s) => s.hash);
// The 90 open buttons, and the pop-up's section headings, point at one copy of each icon (an inline sprite)
// instead of repeating its paths.
const sprite = `<svg class="sprite" aria-hidden="true">${[...popSteps.map((s) => s.ic), "bulb"]
  .map((n) => icon(n).replace(/^<svg[^>]*>/, `<symbol id="pi-${n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`).replace(/<\/svg>$/, "</symbol>"))
  .join("")}</svg>`;
const openLink = (code, s) =>
  s.hash ? `<a class="plan-open" href="#${code}/${s.hash}" title="${esc(`${s.open} · ${code}`)}" aria-label="${esc(`${s.open} · ${code}`)}"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#pi-${s.ic}"/></svg></a>` : "";
const planGroups = data
  .map((d) => `<tbody data-plan-d="${d.n}" style="--c:${d.color}"><tr class="plan-dh"><th colspan="${steps.length + 1}"><button type="button" class="plan-dh-in" data-plan-fold aria-expanded="true" title="${esc(S.fold)}">${icon("chevronDown", "plan-chev")}<span class="Label">${S.domainLabel(d.n)}</span><span class="plan-dt">${esc(d.title)} <span class="plan-w">${d.weight}%</span></span><span class="Counter" data-plan-count>0/${d.en.length * steps.length}</span></button></th></tr>${d.en
    .map((l) => `<tr data-plan-row="${l.code}"><td class="plan-task"><a href="#${l.code}/summary"><b>${esc(l.code)}</b><span>${md(l.task)}</span></a></td>${steps
      .map((s) => `<td class="plan-step" data-label="${esc(s.short)}"><div class="plan-cell"><label class="plan-cb"><input type="checkbox" data-plan="${l.code}:${s.k}" aria-label="${esc(`${l.code} · ${s.th}`)}"></label>${openLink(l.code, s)}</div></td>`)
      .join("")}</tr>`)
    .join("")}</tbody>`)
  .join("");

const closeBtn = `<button type="button" class="dialog-close" data-close aria-label="${S.close}" title="${S.close}">${icon("x")}</button>`;
// The study pop-up: tabs for the three steps, "Mark this step done" between the previous and next arrows.
const popDialog = `
<dialog class="dialog pop" id="pop" aria-labelledby="pop-title" data-pop>
  <div class="dialog-in">
    <div class="dialog-head">
      <div class="dialog-titles"><span class="Label" data-pop-label></span><h2 id="pop-title" data-pop-title></h2></div>
      ${closeBtn}
    </div>
    <div class="pop-bar"><div class="seg pop-tabs" role="group" aria-label="${esc(S.title)}">${popSteps
      .map((s, i) => `<button type="button" data-pop-tab="${s.k}" aria-pressed="false">${icon(s.ic)}<span>${s.tab}</span>${i ? ` <span class="Counter" data-pop-n="${i - 1}"></span>` : ""}</button>`)
      .join("")}</div></div>
    <div class="dialog-body pop-body" data-pop-body></div>
    <div class="pop-foot"><button type="button" class="btn" data-pop-go="-1" title="${S.prev}">${icon("arrowLeft")}<span></span></button><label class="toggle pop-done"><input type="checkbox" data-pop-done> <span>${S.done}</span></label><button type="button" class="btn" data-pop-go="1" title="${S.next}"><span></span>${icon("arrowRight")}</button></div>
  </div>
</dialog>`;
const aboutDialog = `
<dialog class="dialog about" id="about" aria-labelledby="about-title" data-about>
  <div class="dialog-in">
    <div class="dialog-head"><div class="dialog-titles"><h2 id="about-title">${esc(S.aboutTitle)}</h2></div>${closeBtn}</div>
    <div class="dialog-body prose">${S.about}
    </div>
  </div>
</dialog>`;
// What site.js needs to fill the pop-up's head straight away and move between tasks: the task list, the domains
// and the labels. "<" is escaped so the JSON can't close the script tag.
const planData = {
  tasks,
  domains: Object.fromEntries(data.map((d) => [d.n, { label: S.domainLabel(d.n), color: d.color }])),
  steps: Object.fromEntries(popSteps.map((s) => [s.k, s.hash])),
  text: S.js,
};
const body = `
<div class="container">
  <div class="pagehead"><h1>${S.title}</h1><p>${S.lead}</p><p class="exam-note">${S.examNote}</p></div>
  <div class="plan" data-plan-page data-plan-tpl="${esc(S.progress)}" data-plan-confirm="${esc(S.resetConfirm)}">
    <div class="plan-top">
      <div class="plan-prog"><div class="plan-bar"><span data-plan-bar></span></div><p data-plan-total aria-live="polite"></p></div>
      <button type="button" class="btn btn-sm" data-plan-reset>${icon("x")}${S.reset}</button>
    </div>
    <div class="Box"><div class="tscroll"><table class="gh plan-table"><thead><tr><th>${S.taskTh}</th>${steps.map((s) => `<th class="plan-step">${s.th}</th>`).join("")}</tr></thead>${planGroups}</table></div></div>
  </div>
</div>
${popDialog}
<script type="application/json" id="plan-data">${JSON.stringify(planData).replace(/</g, "\\u003c")}</script>
${sprite}`;
writeFileSync(join(ROOT, "index.html"), layout({ description: S.description, body, about: aboutDialog }), "utf8");

writeFileSync(
  join(ROOT, "assets", "favicon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#1f2328"/><circle cx="16" cy="9.5" r="3" fill="#4493f8"/><circle cx="9.5" cy="21.5" r="3" fill="#3fb950"/><circle cx="22.5" cy="21.5" r="3" fill="#d29922"/><path d="M16 12.5v3.5l-4.6 3.8M16 16l4.6 3.8" stroke="#f0f6fc" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`,
  "utf8"
);
const sum = (f) => tasks.reduce((a, t) => a + f(t), 0);
console.log(`index.html: ${tasks.length} task statements, ${sum((t) => t.n[0])} decisions & terms rows, ${sum((t) => t.n[1])} traps.`);

/* ---------------------------------------------------------------- Report + zip */
// Dot entries (.git, .gitignore, editor folders) are never published.
const published = (dir) => readdirSync(dir).filter((f) => !f.startsWith("."));
const files = [];
const walk = (dir) => published(dir).forEach((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : files.push(join(dir, f))));
walk(ROOT);
const kb = Math.round(files.reduce((a, f) => a + statSync(f).size, 0) / 1024);
console.log(`website/: ${files.length} files, ${kb} KB, index.html at the root.`);
// The zip holds the folder's contents (index.html at the zip root), which is what Cloudflare Pages expects.
// Tries the zip-capable bsdtar (Windows 10+ System32, macOS), then the `zip` command (Linux).
// If none works, upload the website/ folder instead — Cloudflare accepts a folder too.
// Top-level names (not ".") so entries read "index.html", not "./index.html".
const top = published(ROOT);
const zippers = [
  ...(process.platform === "win32" ? [[join(process.env.SystemRoot || "C:\\Windows", "System32", "tar.exe"), ["-a", "-c", "-f", ZIP, "-C", ROOT, ...top], {}]] : []),
  ["tar", ["-a", "-c", "-f", ZIP, "-C", ROOT, ...top], {}],
  ["zip", ["-r", "-q", ZIP, ...top], { cwd: ROOT }],
];
let zipped = false;
for (const [cmd, args, opts] of zippers) {
  try {
    rmSync(ZIP, { force: true });
    execFileSync(cmd, args, { stdio: "pipe", ...opts });
    if (existsSync(ZIP) && statSync(ZIP).size > 0 && readFileSync(ZIP).subarray(0, 2).toString() === "PK") { zipped = true; break; }
  } catch { /* try the next tool */ }
}
if (!zipped) rmSync(ZIP, { force: true });
console.log(zipped
  ? `website.zip: ${Math.round(statSync(ZIP).size / 1024)} KB, ready for Cloudflare Pages "Upload assets".`
  : "website.zip not created (no zip tool found). Upload the website/ folder instead.");
