// The whole site lives in one static folder, website/ (this file is website/src/build.mjs):
//   website/*.html, website/ar/*.html   ← generated pages (rewritten on every build)
//   website/assets/                     ← site.css, site.js (edit these), favicon.svg (generated)
//   website/data/                       ← content JSON (edit these)
//   website/src/                        ← this build script and its modules
// Everything in website/ is uploaded as-is. The build also zips it to ../website.zip.
// Run from anywhere:  node website/src/build.mjs   (or, inside website/:  node src/build.mjs)
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync, unlinkSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { SITE, DOMAINS, LANGS, esc, md, icon, layout } from "./lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..");
const DATA_DIR = join(ROOT, "data");
const ZIP = join(ROOT, "..", "website.zip");
const outDir = (lang) => (lang === "en" ? ROOT : join(ROOT, "ar"));

// Only the generated .html pages are replaced; data/, src/, assets/ and README.md are left untouched.
for (const lang of LANGS) {
  mkdirSync(outDir(lang), { recursive: true });
  for (const f of readdirSync(outDir(lang))) if (f.endsWith(".html")) unlinkSync(join(outDir(lang), f));
}
mkdirSync(join(ROOT, "assets"), { recursive: true });

const sheetsFor = async (lang) => {
  const file = join(here, lang === "ar" ? "cheatsheets.ar.mjs" : "cheatsheets.mjs");
  return (await import(pathToFileURL(existsSync(file) ? file : join(here, "cheatsheets.mjs")).href)).SHEETS;
};
const dataFor = (lang) =>
  DOMAINS.map((d) => {
    const ar = join(DATA_DIR, `d${d.n}.ar.json`);
    const file = lang === "ar" && existsSync(ar) ? ar : join(DATA_DIR, `d${d.n}.json`);
    return { ...JSON.parse(readFileSync(file, "utf8")), n: d.n, weight: d.weight, color: d.color, icon: d.icon, title: d.title[lang], short: d.short[lang] };
  });

/* ------------------------------------------------------------- Page text */
const P = {
  en: {
    homeDesc: (T) => `Unofficial notes and exam traps for the ${SITE.exam} (CCAR-F) exam, organised by domain and task statement.`,
    homeLead: `Notes and exam traps for the ${SITE.exam} exam, organised by domain and task statement. Unofficial, written for our study group.`,
    btnNotes: "Open the notes", btnTraps: "Drill the exam traps", btnCheat: "Cheat tables",
    entryNotesTitle: "Notes",
    entryNotes: (T) => `Rules, mechanisms and distinctions for all ${T.lessons} task statements, with key facts and terms. Grouped by domain; search and filter.`,
    cNotes: (n) => `${n} notes`, cFacts: (n) => `${n} facts`, cTerms: (n) => `${n} terms`, cTraps: (n) => `${n} traps`, cTables: "5 tables",
    entryTrapsTitle: "Exam traps",
    entryTraps: "Beliefs that sound right but aren't, with why each one fails and what's actually true. Quiz mode hides the answers.",
    entryCheatTitle: "Cheat tables",
    entryCheat: "One page per domain: key points, anti-patterns, configuration and comparison tables for a last review.",
    domainsH: "Domains",
    th: ["Domain", "Exam weight", "Task statements", "Notes", "Traps", "Open"],
    linkNotes: "Notes", linkTraps: "Traps", linkCheat: "Cheat table",
    footnote: `Reported exam format: 60 questions, 120 minutes, 720 of 1000 to pass. This comes from candidates and third-party guides; confirm it in the official exam guide. Not affiliated with Anthropic. See the <a href="disclaimer.html">disclaimer</a>.`,
    domainLabel: (n) => `Domain ${n}`,
    pctExam: (w) => `${w}% of exam`,
    nTasks: (n) => `${n} task statements`, nTraps: (n) => `${n} traps`,
    search: "Search", domainH: "Domain", allDomains: "All domains", all: "All",
    countTpl: "{shown} of {total} shown",
    notesTitle: "Notes",
    notesLead: `Key concepts, notes, facts and terms for every task statement. Pick a domain on the left, toggle row types, or search for a keyword such as <code>tool_choice</code> or <code>CLAUDE.md</code>.`,
    notesSearch: "Search notes (press /)",
    showH: "Show", tNotes: "Notes", tFacts: "Facts", tTerms: "Terms",
    notesTh: ["Topic", "Note"],
    kinds: { concept: "Key concept", fact: "Fact", term: "Term" },
    trxTh: "Translate", trxTitle: "Show this row in Arabic", trxOff: "ع", trxOn: "EN",
    viewSummary: "View summary", sumClose: "Close", sumAll: "Sub-domains in this domain",
    shortOnly: "Short notes only", inShort: "In short", more: "More", less: "Less",
    notesEmpty: "No notes match. Clear the search, turn row types back on, or pick another domain.",
    notesDesc: (T) => `${T.notes} notes, ${T.facts} key facts and ${T.terms} terms for the CCAR-F exam, grouped by domain and task statement.`,
    trapsTitle: "Exam traps",
    trapsLead: "Each row is a belief that sounds right, why it fails, and what's actually true. Turn on quiz mode, explain to yourself why the belief is wrong, then click a hidden cell to reveal just that answer, or click the trap to reveal both.",
    trapsSearch: "Search traps (press /)",
    quiz: "Quiz mode: hide the answers",
    trapsTh: ["The trap", "Why it's wrong", "What's actually true"],
    tipsH: "How the exam tests this",
    trapsEmpty: "No traps match. Clear the search or pick another domain.",
    trapsDesc: (T) => `${T.traps} CCAR-F exam traps grouped by domain and task statement: why each belief is wrong and what's actually true, with a quiz mode.`,
    cheatTitle: "Cheat tables",
    cheatLead: "One page per domain with the key points, anti-patterns, configuration details and comparison tables. Use them for a last review; each prints cleanly from the browser.",
    cheatDesc: "Five one-page CCAR-F cheat tables, one per exam domain, with comparison tables.",
    cheatPageTitle: (d) => `Cheat Table ${d.n}: ${d.title}`,
    cheatPageDesc: (d) => `One-page CCAR-F cheat table for Domain ${d.n}, ${d.title} (${d.weight}% of the exam).`,
    compareH: "Comparison tables",
    domNotes: (n) => `Domain ${n} notes`, domTraps: (n) => `Domain ${n} traps`,
    discTitle: "Disclaimer",
    discDesc: "The CCAR-F Field Guide is an unofficial study aid, not affiliated with Anthropic. What it covers, accuracy notes and limits.",
    discLead: "This is a community study aid, not an official Anthropic product. Here's what it is and what its limits are.",
    disc: `
    <h2>Unofficial and independent</h2>
    <p>The ${SITE.name} is an independent study aid made by and for a study group. It is not affiliated with, endorsed by, sponsored by or approved by Anthropic, PBC. "Anthropic", "Claude", "Claude Code" and "Claude Certified Architect" are names and trademarks of Anthropic, used here only to identify the exam this guide helps people prepare for.</p>
    <h2>About the content</h2>
    <p>The notes and exam traps are study notes organised by the exam's five domains and its published task statements. The cheat tables summarise each domain on one page.</p>
    <h2>No real exam questions</h2>
    <p>Nothing on this site comes from the live exam. It contains no exam questions, answers or recalled items, and it should never be used to share them. Candidates are bound by the exam's confidentiality terms.</p>
    <h2>How to use it</h2>
    <p>The exam presents varied scenarios that need reasoning, so this guide doesn't map keywords to answers. Use the notes to understand why each mechanism works the way it does, and the traps to practise explaining why a plausible answer fails.</p>
    <h2>Accuracy</h2>
    <ul>
      <li>The notes were drafted with AI assistance and may contain mistakes or omissions.</li>
      <li>Claude, Claude Code, the Agent SDK and MCP change quickly. Flags, field names, limits and model behaviour described here may be out of date. Check the official Anthropic documentation before relying on any detail.</li>
      <li>Task statements 1.1, 2.4 and 3.6 are only partly covered.</li>
      <li>The exam format on the home page (60 questions, 120 minutes, 720 of 1000 to pass) is as reported by candidates and third-party guides, not from an official source.</li>
    </ul>
    <h2>No guarantee</h2>
    <p>Using this guide does not guarantee a passing score. Treat it as a review aid alongside the official documentation and hands-on practice.</p>
    <h2>Use</h2>
    <p>This guide is for our study group's own use. Please don't sell it or present it as official material. If you spot a mistake, tell the maintainer so it can be fixed for everyone.</p>`,
    nfTitle: "Page not found",
    nfBody: `The page you asked for doesn't exist. Go to the <a href="index.html">home page</a>, the <a href="notes.html">notes</a> or the <a href="traps.html">exam traps</a>.`,
  },
  ar: {
    homeDesc: (T) => `ملاحظات ومطبات مش رسمية لامتحان ${SITE.exam} (CCAR-F)، متقسمة على المجالات والمهام.`,
    homeLead: `ملاحظات ومطبات لامتحان ${SITE.exam}، متقسمة على المجالات والمهام. مش محتوى رسمي، معمول لجروب المذاكرة بتاعنا.`,
    btnNotes: "افتح الملاحظات", btnTraps: "ذاكر المطبات", btnCheat: "جداول المراجعة",
    entryNotesTitle: "الملاحظات",
    entryNotes: (T) => `القواعد وطريقة شغل كل حاجة والفروقات المهمة في الـ ${T.lessons} مهمة، ومعاها المعلومات الأساسية والمصطلحات. متقسمة حسب المجال، وتقدر تدوّر وتفلتر.`,
    cNotes: (n) => `${n} ملاحظة`, cFacts: (n) => `${n} معلومة`, cTerms: (n) => `${n} مصطلح`, cTraps: (n) => `${n} مطب`, cTables: "5 جداول",
    entryTrapsTitle: "مطبات الامتحان",
    entryTraps: "أفكار شكلها صح بس هي غلط، وليه غلط، وإيه الصح فعلاً. وضع الاختبار بيخبّي الإجابات لحد ما تجاوب بنفسك.",
    entryCheatTitle: "جداول المراجعة",
    entryCheat: "صفحة واحدة لكل مجال: أهم النقط، الحاجات اللي تبعد عنها، الإعدادات، وجداول المقارنة للمراجعة الأخيرة.",
    domainsH: "المجالات",
    th: ["المجال", "الوزن في الامتحان", "المهام", "الملاحظات", "المطبات", "افتح"],
    linkNotes: "الملاحظات", linkTraps: "المطبات", linkCheat: "جدول المراجعة",
    footnote: `شكل الامتحان زي ما الناس اللي امتحنت والمواقع التانية بتقول: 60 سؤال، 120 دقيقة، ولازم تجيب 720 من 1000 عشان تنجح. اتأكد من دليل الامتحان الرسمي. الموقع ده مالوش علاقة بـ Anthropic، شوف <a href="disclaimer.html">التنويه</a>.`,
    domainLabel: (n) => `المجال ${n}`,
    pctExam: (w) => `${w}% من الامتحان`,
    nTasks: (n) => `${n} مهام`, nTraps: (n) => `${n} مطب`,
    search: "دوّر", domainH: "المجال", allDomains: "كل المجالات", all: "الكل",
    countTpl: "ظاهر {shown} من {total}",
    notesTitle: "الملاحظات",
    notesLead: `الأفكار الأساسية والملاحظات والمعلومات والمصطلحات لكل مهمة. اختار مجال من على الجنب، شغّل أو اقفل أنواع الصفوف، أو دوّر على كلمة زي <code>tool_choice</code> أو <code>CLAUDE.md</code>.`,
    notesSearch: "دوّر في الملاحظات (اضغط /)",
    showH: "اعرض", tNotes: "الملاحظات", tFacts: "المعلومات", tTerms: "المصطلحات",
    notesTh: ["الموضوع", "الملاحظة"],
    kinds: { concept: "الفكرة الأساسية", fact: "معلومة", term: "مصطلح" },
    trxTh: "ترجمة", trxTitle: "اعرض الصف ده بالإنجليزي", trxOff: "EN", trxOn: "ع",
    viewSummary: "عرض الملخص", sumClose: "إغلاق", sumAll: "المهام اللي في المجال ده",
    shortOnly: "الملاحظات المختصرة بس", inShort: "باختصار", more: "اقرا أكتر", less: "اختصر",
    notesEmpty: "مفيش ملاحظات مطابقة. امسح البحث، أو شغّل أنواع الصفوف تاني، أو اختار مجال تاني.",
    notesDesc: (T) => `${T.notes} ملاحظة و${T.facts} معلومة و${T.terms} مصطلح لامتحان CCAR-F، متقسمين حسب المجال والمهمة.`,
    trapsTitle: "مطبات الامتحان",
    trapsLead: "كل صف فيه فكرة شكلها صح، وليه هي غلط، وإيه الصح فعلاً. شغّل وضع الاختبار، قول لنفسك الفكرة دي غلط ليه، وبعدين دوس على أي خانة مخفية عشان تشوفها لوحدها، أو دوس على المطب نفسه عشان تشوف الاتنين.",
    trapsSearch: "دوّر في المطبات (اضغط /)",
    quiz: "وضع الاختبار: خبّي الإجابات",
    trapsTh: ["المطب", "ليه غلط", "الصح إيه"],
    tipsH: "الامتحان بيختبر ده إزاي",
    trapsEmpty: "مفيش مطبات مطابقة. امسح البحث أو اختار مجال تاني.",
    trapsDesc: (T) => `${T.traps} مطب في امتحان CCAR-F متقسمين حسب المجال والمهمة: الفكرة غلط ليه والصح إيه، ومعاهم وضع اختبار.`,
    cheatTitle: "جداول المراجعة",
    cheatLead: "صفحة لكل مجال فيها أهم النقط، والحاجات اللي تبعد عنها، وتفاصيل الإعدادات، وجداول المقارنة. استخدمها في المراجعة الأخيرة، وكل صفحة بتتطبع كويس من المتصفح.",
    cheatDesc: "5 جداول مراجعة لامتحان CCAR-F، جدول لكل مجال، ومعاهم جداول مقارنة.",
    cheatPageTitle: (d) => `جدول المراجعة ${d.n}: ${d.title}`,
    cheatPageDesc: (d) => `جدول مراجعة في صفحة واحدة للمجال ${d.n}، ${d.title} (${d.weight}% من الامتحان).`,
    compareH: "جداول المقارنة",
    domNotes: (n) => `ملاحظات المجال ${n}`, domTraps: (n) => `مطبات المجال ${n}`,
    discTitle: "تنويه",
    discDesc: "دليل CCAR-F Field Guide مجهود مذاكرة مش رسمي ومالوش علاقة بـ Anthropic. بيغطي إيه، وملاحظات عن الدقة، وحدوده.",
    discLead: "ده مجهود مذاكرة من جروب، مش منتج رسمي من Anthropic. هنا هتعرف هو إيه وحدوده إيه.",
    disc: `
    <h2>مش رسمي ومستقل</h2>
    <p>دليل ${SITE.name} معمول من جروب مذاكرة وليه. مالوش أي علاقة بشركة Anthropic، ولا هي راعياه أو موافقة عليه. الأسماء "Anthropic" و"Claude" و"Claude Code" و"Claude Certified Architect" أسماء وعلامات تجارية بتاعة Anthropic، واحنا بنستخدمها بس عشان نوضح الامتحان اللي الدليل ده بيساعدك تذاكر له.</p>
    <h2>عن المحتوى</h2>
    <p>الملاحظات والمطبات دي ملاحظات مذاكرة متقسمة على المجالات الخمسة بتوع الامتحان والمهام المنشورة بتاعته. وجداول المراجعة بتلخص كل مجال في صفحة واحدة.</p>
    <h2>مفيش أسئلة امتحان حقيقية</h2>
    <p>مفيش أي حاجة هنا جاية من الامتحان نفسه: لا أسئلة ولا إجابات ولا حاجة حد افتكرها من الامتحان، وماينفعش الموقع يتستخدم عشان ينشر حاجة زي كده. اللي بيمتحن ملتزم بشروط السرية بتاعة الامتحان.</p>
    <h2>تستخدمه إزاي</h2>
    <p>الامتحان بالإنجليزي وبيجيب سيناريوهات مختلفة محتاجة تفكير، عشان كده الدليل ده مش بيربط كلمات بإجابات جاهزة. الأحسن تذاكر من النسخة الإنجليزية وتستخدم زرار الترجمة اللي جنب كل صف لما تحتاجه. استخدم الملاحظات عشان تفهم كل آلية شغالة كده ليه، والمطبات عشان تتمرن تشرح ليه إجابة شكلها منطقي طلعت غلط.</p>
    <h2>الدقة</h2>
    <ul>
      <li>الملاحظات اتكتبت بمساعدة الذكاء الاصطناعي، وممكن يكون فيها غلطات أو حاجات ناقصة.</li>
      <li>Claude وClaude Code وAgent SDK وMCP بيتغيروا بسرعة. الخيارات وأسماء الحقول والحدود وسلوك الموديلات اللي هنا ممكن تكون قديمة. ارجع للتوثيق الرسمي بتاع Anthropic قبل ما تعتمد على أي تفصيلة.</li>
      <li>المهام 1.1 و2.4 و3.6 متغطية جزئياً بس.</li>
      <li>شكل الامتحان اللي في الصفحة الرئيسية (60 سؤال، 120 دقيقة، 720 من 1000 عشان تنجح) ده حسب كلام ناس امتحنت ومواقع تانية، مش من مصدر رسمي.</li>
    </ul>
    <h2>مفيش ضمان</h2>
    <p>إنك تستخدم الدليل ده مش ضمان إنك تنجح. اعتبره أداة مراجعة جنب التوثيق الرسمي والتطبيق العملي.</p>
    <h2>الاستخدام</h2>
    <p>الدليل ده لجروب المذاكرة بتاعنا. متبيعهوش، ومتقدموش على إنه محتوى رسمي. ولو لقيت غلطة، قول للي ماسك الموقع عشان تتصلح للكل.</p>`,
    nfTitle: "الصفحة مش موجودة",
    nfBody: `الصفحة اللي بتدوّر عليها مش موجودة. روح <a href="index.html">للرئيسية</a> أو <a href="notes.html">للملاحظات</a> أو <a href="traps.html">لمطبات الامتحان</a>.`,
  },
};

/* --------------------------------------------------------------- Helpers */
const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
const stats = (d) => ({
  lessons: d.lessons.length,
  notes: sum(d.lessons, (l) => l.notes.length),
  traps: sum(d.lessons, (l) => l.traps.length),
  facts: sum(d.lessons, (l) => (l.facts || []).length),
  terms: sum(d.lessons, (l) => (l.terms || []).length),
});
const totals = (data) => Object.fromEntries(["lessons", "notes", "traps", "facts", "terms"].map((k) => [k, sum(data, (d) => stats(d)[k])]));
const id = (prefix, code) => `${prefix}-${code.replace(".", "-")}`;
const range = (d) => `${d.lessons[0].code}–${d.lessons[d.lessons.length - 1].code}`;

function site(lang, data, altData, SHEETS) {
  const S = P[lang];
  const altLang = lang === "en" ? "ar" : "en";
  const A = P[altLang];
  const T = totals(data);
  // Each table cell carries both languages; the row's translate button swaps which one is shown.
  const dual = (html, altHtml) =>
    `<div class="tx">${html}</div><div class="tx" lang="${altLang}" dir="${altLang === "ar" ? "rtl" : "ltr"}" hidden>${altHtml}</div>`;
  // Labels and title live once on the page container (data-trx-*); site.js applies them.
  const trxCell = `<td class="trx"><button type="button" class="trx-btn" data-trx aria-pressed="false">${S.trxOff}</button></td>`;
  const trxAttrs = `data-trx-on="${S.trxOn}" data-trx-off="${S.trxOff}" data-trx-title="${esc(S.trxTitle)}"`;
  const trxTh = `<th class="trx"><span class="sr-only">${S.trxTh}</span></th>`;
  const dir = outDir(lang);
  const write = (page, opts) => {
    const html = layout({ lang, page, ...opts });
    writeFileSync(join(dir, page), html, "utf8");
    console.log("wrote", (lang === "ar" ? "ar/" : "") + page, (html.length / 1024).toFixed(1) + " KB");
  };

  /* ------------------------------------------------------------ Home */
  const rows = data
    .map((d) => {
      const s = stats(d);
      return `<tr style="--c:${d.color}">
  <td><div class="dname"><span class="dot"></span>${d.n} · ${esc(d.title)}</div></td>
  <td><div class="wbar"><span style="width:${d.weight * 4}px"></span><b>${d.weight}%</b></div></td>
  <td dir="ltr">${range(d)}</td><td>${s.notes + s.facts + s.terms}</td><td>${s.traps}</td>
  <td><div class="links"><a href="notes.html#d${d.n}">${S.linkNotes}</a><a href="traps.html#d${d.n}">${S.linkTraps}</a><a href="cheat-table-${d.n}.html">${S.linkCheat}</a></div></td>
</tr>`;
    })
    .join("");
  write("index.html", {
    title: "",
    description: S.homeDesc(T),
    active: "home",
    body: `
<div class="container">
  <section class="home-intro">
    <h1 dir="ltr">CCAR-F Field Guide</h1>
    <p>${S.homeLead}</p>
    <div class="actions">
      <a class="btn btn-primary" href="notes.html">${icon("list")}${S.btnNotes}</a>
      <a class="btn" href="traps.html">${icon("alert")}${S.btnTraps}</a>
      <a class="btn" href="cheat-tables.html">${icon("table")}${S.btnCheat}</a>
    </div>
  </section>
  <div class="entry-grid">
    <a class="Box entry" href="notes.html"><h2>${icon("list")}${S.entryNotesTitle}</h2><p>${S.entryNotes(T)}</p><div class="stats"><span class="Counter">${S.cNotes(T.notes)}</span><span class="Counter">${S.cFacts(T.facts)}</span><span class="Counter">${S.cTerms(T.terms)}</span></div></a>
    <a class="Box entry" href="traps.html"><h2>${icon("alert")}${S.entryTrapsTitle}</h2><p>${S.entryTraps}</p><div class="stats"><span class="Counter">${S.cTraps(T.traps)}</span></div></a>
    <a class="Box entry" href="cheat-tables.html"><h2>${icon("table")}${S.entryCheatTitle}</h2><p>${S.entryCheat}</p><div class="stats"><span class="Counter">${S.cTables}</span></div></a>
  </div>
  <section class="section">
    <h2>${S.domainsH}</h2>
    <div class="Box"><div class="tscroll"><table class="gh">
      <thead><tr>${S.th.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody>
    </table></div></div>
    <p class="footnote">${S.footnote}</p>
  </section>
</div>`,
  });

  /* ------------------------------------------- Shared filter sidebar */
  const sidebar = ({ prefix, placeholder, controls }) => {
    const dbtn = (d) =>
      `<li><button class="dbtn" type="button" data-d="${d.n}" aria-pressed="false" style="--c:${d.color}"><span class="dot"></span><span><span class="long">${d.n} · ${esc(d.title)}</span><span class="short">D${d.n} ${esc(d.short)}</span></span><span class="w">${d.weight}%</span></button></li>`;
    const toc = data
      .map(
        (d) => `<div class="tg" data-d="${d.n}" style="--c:${d.color}"><a href="#d${d.n}"><span class="dot"></span>${S.domainLabel(d.n)} · ${esc(d.short)}</a><ol>${d.lessons
          .map((l) => `<li><a href="#${id(prefix, l.code)}"><b>${esc(l.code)}</b><span>${md(l.task)}</span></a></li>`)
          .join("")}</ol></div>`
      )
      .join("");
    return `<aside class="side" aria-label="Filters">
  <label class="search">${icon("search")}<span class="sr-only">${S.search}</span><input class="input" id="q" type="search" placeholder="${esc(placeholder)}" autocomplete="off"></label>
  <div><h2>${S.domainH}</h2><ul class="dlist">
    <li><button class="dbtn" type="button" data-d="all" aria-pressed="true"><span class="dot all"></span><span><span class="long">${S.allDomains}</span><span class="short">${S.all}</span></span><span class="w">100%</span></button></li>
    ${data.map(dbtn).join("")}
  </ul></div>
  ${controls}
  <p class="count" data-count data-count-tpl="${esc(S.countTpl)}" aria-live="polite"></p>
  <nav class="toc" aria-label="Task statements">${toc}</nav>
</aside>`;
  };
  // "View summary" buttons open one shared dialog; data-sum is "d<n>" (whole domain) or "d<n>:<lesson index>".
  const sumBtn = (key) => `<button type="button" class="sum-btn" data-sum="${key}">${icon("book")}<span>${S.viewSummary}</span></button>`;
  const domainHead = (d, what) =>
    `<header class="dom-head"><span class="Label">${S.domainLabel(d.n)}</span><h2>${esc(d.title)}</h2><span class="muted">${S.pctExam(d.weight)} · ${what}</span>${sumBtn(`d${d.n}`)}</header>`;
  const taskHead = (l, d, li) => `<div class="task-head"><span class="code">${esc(l.code)}</span><h3>${md(l.task)}</h3>${sumBtn(`d${d.n}:${li}`)}</div>`;
  // Summaries in both languages, read by site.js. "<" is escaped so the JSON can't close the script tag.
  const sumData = Object.fromEntries(
    data.map((d, di) => {
      const ad = altData[di];
      return [`d${d.n}`, {
        color: d.color,
        label: S.domainLabel(d.n), title: esc(d.title), intro: md(d.intro || ""),
        alt: { label: A.domainLabel(d.n), title: esc(ad.title), intro: md(ad.intro || "") },
        tasks: d.lessons.map((l, li) => ({
          code: l.code, task: md(l.task), summary: md(l.summary || ""),
          alt: { task: md(ad.lessons[li].task), summary: md(ad.lessons[li].summary || "") },
        })),
      }];
    })
  );
  const sumDialog = (prefix) => `
<script type="application/json" id="sum-data">${JSON.stringify(sumData).replace(/</g, "\\u003c")}</script>
<dialog class="sum-dialog" id="sum-dialog" aria-labelledby="sum-title" data-prefix="${prefix}" data-all="${esc(S.sumAll)}" data-alt-all="${esc(A.sumAll)}">
  <div class="sum-inner">
    <div class="sum-head">
      <div class="sum-titles"><span class="Label" id="sum-label"></span><h2 id="sum-title"></h2></div>
      <div class="sum-tools"><button type="button" class="trx-btn" id="sum-trx" title="${esc(S.trxTitle)}" aria-label="${esc(S.trxTitle)}">${S.trxOff}</button><button type="button" class="sum-close" id="sum-close" aria-label="${esc(S.sumClose)}" title="${esc(S.sumClose)}">${icon("x")}</button></div>
    </div>
    <div class="sum-body" id="sum-body"></div>
  </div>
</dialog>`;

  /* ------------------------------------------------------------ Notes */
  const kindTag = (K, kind) => (kind === "note" ? "" : `<span class="kind ${kind}">${K.kinds[kind]}</span>`);
  // Notes and key concepts carry a short version: shown under the full text, or alone in "short notes only" mode
  // (where the More button reopens the full text for that row).
  const noteBlock = (K, full, short) =>
    short
      ? `<div class="v-full">${md(full)}</div><div class="v-short"><span class="short-tag">${K.inShort}</span>${md(short)}</div><button type="button" class="more-btn" data-more><span class="m">${K.more}</span><span class="l">${K.less}</span></button>`
      : md(full);
  const nrow = (d, kind, [topic, text, short], [aTopic, aText, aShort]) =>
    `<tr data-row data-d="${d.n}" data-kind="${kind}"><td class="topic">${dual(kindTag(S, kind) + md(topic), kindTag(A, kind) + md(aTopic))}</td><td>${dual(noteBlock(S, text, short), noteBlock(A, aText, aShort))}</td>${trxCell}</tr>`;
  const shortSwitch = (cls) => `<label class="${cls}"><input type="checkbox" class="switch-input" data-short-toggle> <span>${S.shortOnly}</span></label>`;
  const notesDomains = data
    .map((d, di) => {
      const tasks = d.lessons
        .map((l, li) => {
          const a = altData[di].lessons[li];
          const r = [
            l.key_concept ? nrow(d, "concept", [l.key_concept.term, l.key_concept.definition, l.key_concept.short], [a.key_concept.term, a.key_concept.definition, a.key_concept.short]) : "",
            ...l.notes.map((n, i) => nrow(d, "note", [n.topic, n.note, n.short], [a.notes[i].topic, a.notes[i].note, a.notes[i].short])),
            ...(l.facts || []).map((f, i) => nrow(d, "fact", [f.item, f.detail], [a.facts[i].item, a.facts[i].detail])),
            ...(l.terms || []).map((t, i) => nrow(d, "term", [t.term, t.def], [a.terms[i].term, a.terms[i].def])),
          ].join("");
          return `<section class="task" id="${id("n", l.code)}">
  ${taskHead(l, d, li)}
  <div class="Box"><div class="tscroll"><table class="gh stack"><thead><tr><th>${S.notesTh[0]}</th><th>${S.notesTh[1]}</th>${trxTh}</tr></thead><tbody>${r}</tbody></table></div></div>
</section>`;
        })
        .join("\n");
      return `<section class="domain" id="d${d.n}" data-d="${d.n}" style="--c:${d.color}">
${domainHead(d, S.nTasks(stats(d).lessons))}
${tasks}
</section>`;
    })
    .join("\n");
  const kindControls = `<div><h2>${S.showH}</h2><div class="seg" role="group">
    <button type="button" data-kind="note" aria-pressed="true">${S.tNotes} <span class="Counter">${T.notes}</span></button>
    <button type="button" data-kind="fact" aria-pressed="true">${S.tFacts} <span class="Counter">${T.facts}</span></button>
    <button type="button" data-kind="term" aria-pressed="true">${S.tTerms} <span class="Counter">${T.terms}</span></button>
  </div></div>
  ${shortSwitch("toggle short-side")}`;
  write("notes.html", {
    title: S.notesTitle,
    description: S.notesDesc(T),
    active: "notes",
    body: `
<div class="container">
  <div class="layout" data-filter-page ${trxAttrs}>
    ${sidebar({ prefix: "n", placeholder: S.notesSearch, controls: kindControls })}
    <div style="min-width:0">
      <div class="pagehead lead-only"><h1>${S.notesTitle}</h1><p>${S.notesLead}</p>${shortSwitch("short-switch")}</div>
      ${notesDomains}
      <p class="empty-all" hidden>${S.notesEmpty}</p>
    </div>
  </div>
  ${sumDialog("n")}
</div>`,
  });

  /* ------------------------------------------------------------ Traps */
  const trapsDomains = data
    .map((d, di) => {
      const tasks = d.lessons
        .map((l, li) => {
          const a = altData[di].lessons[li];
          const r = l.traps
            .map((t, i) => {
              const at = a.traps[i];
              return `<tr data-row data-d="${d.n}" data-kind="trap" tabindex="0"><td class="trapcol">${dual(md(t.trap), md(at.trap))}</td><td class="whycol">${dual(md(t.why), md(at.why))}</td><td class="fixcol">${dual(md(t.fix), md(at.fix))}</td>${trxCell}</tr>`;
            })
            .join("");
          const tips = (l.exam_tips || []).length
            ? `<div class="flash tips"><div class="flash-title">${icon("bulb", "oc")}${S.tipsH}</div><ul>${l.exam_tips.map((t) => `<li data-row data-d="${d.n}" data-kind="tip">${md(t)}</li>`).join("")}</ul></div>`
            : "";
          return `<section class="task" id="${id("t", l.code)}">
  ${taskHead(l, d, li)}
  <div class="Box"><div class="tscroll"><table class="gh stack traps"><thead><tr>${S.trapsTh.map((h) => `<th>${h}</th>`).join("")}${trxTh}</tr></thead><tbody>${r}</tbody></table></div></div>
  ${tips}
</section>`;
        })
        .join("\n");
      return `<section class="domain" id="d${d.n}" data-d="${d.n}" style="--c:${d.color}">
${domainHead(d, S.nTraps(stats(d).traps))}
${tasks}
</section>`;
    })
    .join("\n");
  write("traps.html", {
    title: S.trapsTitle,
    description: S.trapsDesc(T),
    active: "traps",
    body: `
<div class="container">
  <div class="layout" data-filter-page ${trxAttrs}>
    ${sidebar({ prefix: "t", placeholder: S.trapsSearch, controls: `<label class="toggle"><input type="checkbox" id="quiz"> ${S.quiz}</label>` })}
    <div style="min-width:0">
      <div class="pagehead lead-only"><h1>${S.trapsTitle}</h1><p>${S.trapsLead}</p></div>
      ${trapsDomains}
      <p class="empty-all" hidden>${S.trapsEmpty}</p>
    </div>
  </div>
  ${sumDialog("t")}
</div>`,
  });

  /* ----------------------------------------------------- Cheat tables */
  write("cheat-tables.html", {
    title: S.cheatTitle,
    description: S.cheatDesc,
    active: "cheat",
    body: `
<div class="container">
  <div class="pagehead"><h1>${S.cheatTitle}</h1><p>${S.cheatLead}</p></div>
  <div class="cs-index">${data
    .map(
      (d) => `<a class="Box cs-thumb" style="--c:${d.color}" href="cheat-table-${d.n}.html">
  <div class="Box-header"><span class="Label">${S.domainLabel(d.n)}</span><h2>${esc(d.title)}</h2></div>
  <div class="Box-body"><ol>${d.lessons.map((l) => `<li><b>${esc(l.code)}</b><span>${md(l.task)}</span></li>`).join("")}</ol></div>
</a>`
    )
    .join("")}</div>
</div>`,
  });
  data.forEach((d) => {
    const sh = SHEETS[d.n];
    const compare = (d.comparisons || [])
      .map(
        (c) => `<div><h3>${md(c.title)}</h3><div class="Box"><div class="tscroll"><table class="gh compare"><thead><tr>${c.columns.map((h) => `<th>${md(h)}</th>`).join("")}</tr></thead><tbody>${c.rows
          .map((r) => `<tr>${r.map((cell) => `<td>${md(cell)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div></div></div>`
      )
      .join("");
    write(`cheat-table-${d.n}.html`, {
      title: S.cheatPageTitle(d),
      description: S.cheatPageDesc(d),
      active: "cheat",
      body: `
<div class="container" style="--c:${d.color}">
  <header class="sheet-head"><span class="Label">${S.domainLabel(d.n)}</span><h1>${esc(d.title)}</h1><span class="Label">${S.pctExam(d.weight)}</span><p>${esc(sh.sub)}</p></header>
  <div class="cs-grid">${sh.cards.join("\n")}</div>
  ${compare ? `<section class="section"><h2>${S.compareH}</h2><div class="compare-list">${compare}</div></section>` : ""}
  <div class="sheet-foot">
    <div class="sheet-nav">${data.map((o) => `<a class="Label" style="--c:${o.color}" href="cheat-table-${o.n}.html"${o.n === d.n ? ' aria-current="page"' : ""}>${S.domainLabel(o.n)}</a>`).join("")}</div>
    <div class="links"><a href="notes.html#d${d.n}">${S.domNotes(d.n)}</a><a href="traps.html#d${d.n}">${S.domTraps(d.n)}</a></div>
  </div>
</div>`,
    });
  });

  /* ------------------------------------------------------- Disclaimer */
  write("disclaimer.html", {
    title: S.discTitle,
    description: S.discDesc,
    active: "disclaimer",
    body: `
<div class="container">
  <div class="pagehead"><h1>${S.discTitle}</h1><p>${S.discLead}</p></div>
  <div class="prose">${S.disc}
  </div>
</div>`,
  });

  /* --------------------------------------------------------------- 404 */
  write("404.html", {
    title: S.nfTitle,
    description: S.nfTitle,
    active: "",
    body: `<div class="container"><div class="pagehead"><h1>${S.nfTitle}</h1><p>${S.nfBody}</p></div></div>`,
  });
  return T;
}

writeFileSync(
  join(ROOT, "assets", "favicon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#1f2328"/><circle cx="16" cy="9.5" r="3" fill="#4493f8"/><circle cx="9.5" cy="21.5" r="3" fill="#3fb950"/><circle cx="22.5" cy="21.5" r="3" fill="#d29922"/><path d="M16 12.5v3.5l-4.6 3.8M16 16l4.6 3.8" stroke="#f0f6fc" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`,
  "utf8"
);

const DATA = Object.fromEntries(LANGS.map((lang) => [lang, dataFor(lang)]));
for (const lang of LANGS) {
  const T = site(lang, DATA[lang], DATA[lang === "en" ? "ar" : "en"], await sheetsFor(lang));
  console.log(`${lang}: ${T.lessons} task statements, ${T.notes} notes, ${T.facts} facts, ${T.terms} terms, ${T.traps} traps.\n`);
}

/* ---------------------------------------------------------------- Report + zip */
const files = [];
const walk = (dir) => readdirSync(dir).forEach((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : files.push(join(dir, f))));
walk(ROOT);
const kb = Math.round(files.reduce((a, f) => a + statSync(f).size, 0) / 1024);
console.log(`website/: ${files.length} files, ${kb} KB, index.html at the root.`);
// The zip holds the folder's contents (index.html at the zip root), which is what Cloudflare Pages expects.
// Tries the zip-capable bsdtar (Windows 10+ System32, macOS), then the `zip` command (Linux).
// If none works, upload the website/ folder instead — Cloudflare accepts a folder too.
// Top-level names (not ".") so entries read "index.html", not "./index.html".
const top = readdirSync(ROOT);
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
