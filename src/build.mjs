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
// Pop-up content (assets/pop/<lang>-d<n>.js) is generated too, so it's cleared and rewritten every build.
const POP_DIR = join(ROOT, "assets", "pop");
rmSync(POP_DIR, { recursive: true, force: true });
mkdirSync(POP_DIR, { recursive: true });

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
    homeDesc: (T) => `Unofficial cheat tables, summaries, exam traps and searchable notes for the ${SITE.exam} (CCAR-F) exam, organised by domain and task statement.`,
    homeLead: `One-page cheat tables with plain-language summaries, exam traps to drill, and every note searchable, for the ${SITE.exam} exam. Unofficial, written for our study group.`,
    btnNotes: "Search the notes", btnTraps: "Drill the exam traps", btnCheat: "Open the cheat tables",
    entryNotesTitle: "Search the notes",
    entryNotes: (T) => `Every note, fact and term for all ${T.lessons} task statements in one searchable list, for when you need to look something up.`,
    cNotes: (n) => `${n} notes`, cFacts: (n) => `${n} facts`, cTerms: (n) => `${n} terms`, cTraps: (n) => `${n} traps`, cTables: "5 tables", cDecide: (n) => `${n} decisions`,
    entryTrapsTitle: "Exam traps",
    entryTraps: "For extra practice once you know the decision tables: beliefs that sound right but aren't, with why each one fails and what's actually true. Quiz mode hides the answers.",
    entryCheatTitle: "Cheat tables",
    entryCheat: "Start here. One page per domain: key points, a decision table grouped by task statement, comparison tables, key facts and terms, and a plain-language summary of every task statement.",
    cSummaries: (n) => `${n} summaries`,
    domainsH: "Domains",
    th: ["Domain", "Exam weight", "Task statements", "Notes", "Traps", "Open"],
    linkNotes: "Notes", linkTraps: "Traps", linkCheat: "Cheat table", linkSummary: "Summary",
    footnote: `Reported exam format: 60 questions, 120 minutes, 720 of 1000 to pass. This comes from candidates and third-party guides; confirm it in the official exam guide. Not affiliated with Anthropic. See the <a href="disclaimer.html">disclaimer</a>.`,
    domainLabel: (n) => `Domain ${n}`,
    pctExam: (w) => `${w}% of exam`,
    nTasks: (n) => `${n} task statements`, nTraps: (n) => `${n} traps`,
    search: "Search", domainH: "Domain", allDomains: "All domains", all: "All",
    countTpl: "{shown} of {total} shown",
    notesTitle: "Search the notes",
    notesLead: `Every key concept, note, fact and term in one list. Type a word to search, or narrow it down by domain and row type.`,
    notesSearch: "Search notes (press /)",
    notesNote: `This page is for looking something up. To study, use the <a href="cheat-tables.html">cheat tables</a>: each one has the summaries and the decision table for its domain on one page.`,
    tryH: "Try",
    filters: "Filters", sections: "Sections", sectionsTitle: "Jump to a task statement",
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
    cheatLead: "One page per domain with the key points, anti-patterns, a decision table, comparison tables, and key facts and terms. Each has a Summary button that explains every task statement in plain language, and each prints cleanly from the browser.",
    cheatDesc: "Five one-page CCAR-F cheat tables, one per exam domain, with summaries, decision tables, comparison tables, and key facts and terms.",
    cheatPageTitle: (d) => `Cheat Table ${d.n}: ${d.title}`,
    cheatPageDesc: (d) => `One-page CCAR-F cheat table for Domain ${d.n}, ${d.title} (${d.weight}% of the exam), with a summary of every task statement.`,
    openTable: "Open the table", sumDomain: "Summary", jumpLabel: "On this page", dcOf: (c) => `Decision table for ${c}`, dcPicks: "Show rows for",
    compareH: "Comparison tables", compareJump: "Comparisons", nTables: (n) => `${n} tables`, nRows: (n) => `${n} rows`, decidePop: "Drill in a pop-up",
    factsH: "Key facts & terms", factsJump: "Facts & terms", factsCol: "Key facts", termsCol: "Terms",
    factsLead: "The exact names, values and definitions behind each task statement, for when you want more detail. The switch remembers your choice, and the translate button on each box switches it to Arabic.",
    ftCount: (f, t) => `${f} facts · ${t} terms`, ftShow: "Show",
    decideH: "Decision table", decideJump: "Decision table", decideTh: ["Symptom in the question", "Usual answer"],
    decideLead: "The usual fix for each symptom a question describes, grouped by task statement: pick one to drill it on its own. Use it to check your reasoning, not as a keyword lookup: the details of the scenario decide.",
    domNotes: (n) => `Domain ${n} notes`,
    discTitle: "Disclaimer",
    discDesc: "The CCAR-F Field Guide is an unofficial study aid, not affiliated with Anthropic. What it covers, accuracy notes and limits.",
    discLead: "This is a community study aid, not an official Anthropic product. Here's what it is and what its limits are.",
    disc: `
    <h2>Unofficial and independent</h2>
    <p>The ${SITE.name} is an independent study aid made by and for a study group. It is not affiliated with, endorsed by, sponsored by or approved by Anthropic, PBC. "Anthropic", "Claude", "Claude Code" and "Claude Certified Architect" are names and trademarks of Anthropic, used here only to identify the exam this guide helps people prepare for.</p>
    <h2>About the content</h2>
    <p>The notes and exam traps are study notes organised by the exam's five domains and its published task statements. The cheat tables summarise each domain on one page, with a plain-language summary of every task statement.</p>
    <h2>No real exam questions</h2>
    <p>Nothing on this site comes from the live exam. It contains no exam questions, answers or recalled items, and it should never be used to share them. Candidates are bound by the exam's confidentiality terms.</p>
    <h2>How to use it</h2>
    <p>The exam presents varied scenarios that need reasoning. The decision tables list the usual answer for each symptom a question describes, but use them to check your reasoning, not as keyword lookups: the details of the scenario decide. Start with the cheat tables and their summaries to understand why each mechanism works the way it does, use the traps to practise explaining why a plausible answer fails, and search the notes when you need the detail.</p>
    <h2>Accuracy</h2>
    <ul>
      <li>The notes and summaries were drafted with AI assistance and may contain mistakes or omissions.</li>
      <li>Claude, Claude Code, the Agent SDK and MCP change quickly. Flags, field names, limits and model behaviour described here may be out of date. Check the official Anthropic documentation before relying on any detail.</li>
      <li>Task statements 1.1, 2.4 and 3.6 are only partly covered.</li>
      <li>The exam format on the home page (60 questions, 120 minutes, 720 of 1000 to pass) is as reported by candidates and third-party guides, not from an official source.</li>
    </ul>
    <h2>No guarantee</h2>
    <p>Using this guide does not guarantee a passing score. Treat it as a review aid alongside the official documentation and hands-on practice.</p>
    <h2>Use</h2>
    <p>This guide is for our study group's own use. Please don't sell it or present it as official material. If you spot a mistake, tell the maintainer so it can be fixed for everyone.</p>`,
    bmBtn: "Bookmark", bmTitle: "Bookmarks", bmRemove: "Remove", bmClear: "Clear all", bmConfirm: "Remove all your bookmarks?",
    bmDesc: "Your saved decision table rows, exam traps, notes and facts for the CCAR-F exam, kept in this browser.",
    bmLead: `Decision table rows, exam traps, notes and facts you saved, in one place. Tap the ${icon("bookmark", "bm-ic")} button on any row to add it here. Bookmarks are kept in this browser only.`,
    bmEmpty: `Nothing saved yet. Tap the ${icon("bookmark", "bm-ic")} button on a row in a <a href="cheat-tables.html">decision table</a>, the <a href="traps.html">exam traps</a> or the <a href="notes.html">notes</a>, and it shows up here.`,
    bmGroups: { all: "All", trap: "Traps", decide: "Decisions", note: "Notes & facts" },
    bmKinds: { trap: "Trap", decide: "Decision", concept: "Key concept", note: "Note", fact: "Fact", term: "Term" },
    planTitle: "Study plan",
    planDesc: "Track your CCAR-F study progress per task statement: summary, decision table, exam traps and practice questions.",
    planLead: "Tick each step as you finish it, for every task statement: read its summary, study its decision table rows, practise its exam traps, then solve practice questions elsewhere. Your ticks are kept in this browser only.",
    planTh: ["Task statement", "Read summary", "Decision table", "Exam traps", "Solved questions (external)"],
    planShort: ["Summary", "Decisions", "Traps", "Solved Qs"], // phones: each step's name above its checkbox
    planFold: "Show or hide this domain's task statements",
    planOpen: ["Open the summary", "Open the decision table", "Open the exam traps"], popDone: "Mark this step done",
    popLoading: "Loading…", popFailed: "Couldn't load this. Check your connection and try again.",
    recallH: "Facts & terms",
    planDone: "{done} of {total} steps done · {pct}%", planReset: "Reset", planConfirm: "Clear all your ticks in the plan?",
    nfTitle: "Page not found",
    nfBody: `The page you asked for doesn't exist. Go to the <a href="index.html">home page</a>, the <a href="cheat-tables.html">cheat tables</a>, the <a href="traps.html">exam traps</a> or <a href="notes.html">search the notes</a>.`,
  },
  ar: {
    homeDesc: (T) => `جداول مراجعة وملخصات ومطبات وملاحظات تقدر تدوّر فيها لامتحان ${SITE.exam} (CCAR-F)، متقسمة على المجالات والمهام. مش محتوى رسمي.`,
    homeLead: `جداول مراجعة في صفحة واحدة لكل مجال ومعاها ملخصات بكلام بسيط، ومطبات تتمرن عليها، وكل الملاحظات تقدر تدوّر فيها، لامتحان ${SITE.exam}. مش محتوى رسمي، معمول لجروب المذاكرة بتاعنا.`,
    btnNotes: "دوّر في الملاحظات", btnTraps: "ذاكر المطبات", btnCheat: "افتح جداول المراجعة",
    entryNotesTitle: "دوّر في الملاحظات",
    entryNotes: (T) => `كل الملاحظات والمعلومات والمصطلحات بتاعة الـ ${T.lessons} مهمة في قايمة واحدة تقدر تدوّر فيها، لما تحتاج تدوّر على حاجة معيّنة.`,
    cNotes: (n) => `${n} ملاحظة`, cFacts: (n) => `${n} معلومة`, cTerms: (n) => `${n} مصطلح`, cTraps: (n) => `${n} مطب`, cTables: "5 جداول", cDecide: (n) => `${n} قرار`,
    entryTrapsTitle: "مطبات الامتحان",
    entryTraps: "تمرين زيادة بعد ما تذاكر جداول القرارات: أفكار شكلها صح بس هي غلط، وليه غلط، وإيه الصح فعلاً. وضع الاختبار بيخبّي الإجابات لحد ما تجاوب بنفسك.",
    entryCheatTitle: "جداول المراجعة",
    entryCheat: "ابدأ من هنا. صفحة لكل مجال: أهم النقط، وجدول قرارات متقسم على المهام، وجداول المقارنة، والمعلومات والمصطلحات المهمة، وملخص بكلام بسيط لكل مهمة.",
    cSummaries: (n) => `${n} ملخص`,
    domainsH: "المجالات",
    th: ["المجال", "الوزن في الامتحان", "المهام", "الملاحظات", "المطبات", "افتح"],
    linkNotes: "الملاحظات", linkTraps: "المطبات", linkCheat: "جدول المراجعة", linkSummary: "الملخص",
    footnote: `شكل الامتحان زي ما الناس اللي امتحنت والمواقع التانية بتقول: 60 سؤال، 120 دقيقة، ولازم تجيب 720 من 1000 عشان تنجح. اتأكد من دليل الامتحان الرسمي. الموقع ده مالوش علاقة بـ Anthropic، شوف <a href="disclaimer.html">التنويه</a>.`,
    domainLabel: (n) => `المجال ${n}`,
    pctExam: (w) => `${w}% من الامتحان`,
    nTasks: (n) => `${n} مهام`, nTraps: (n) => `${n} مطب`,
    search: "دوّر", domainH: "المجال", allDomains: "كل المجالات", all: "الكل",
    countTpl: "ظاهر {shown} من {total}",
    notesTitle: "دوّر في الملاحظات",
    notesLead: `كل الأفكار الأساسية والملاحظات والمعلومات والمصطلحات في قايمة واحدة. اكتب كلمة عشان تدوّر، أو ضيّق النتايج بالمجال ونوع الصف.`,
    notesSearch: "دوّر في الملاحظات (اضغط /)",
    notesNote: `الصفحة دي عشان تدوّر على معلومة معيّنة. لو بتذاكر، استخدم <a href="cheat-tables.html">جداول المراجعة</a>: كل جدول فيه الملخصات وجدول القرارات بتوع المجال بتاعه في صفحة واحدة.`,
    tryH: "جرّب",
    filters: "فلاتر", sections: "الأقسام", sectionsTitle: "روح لمهمة معيّنة",
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
    cheatLead: "صفحة لكل مجال فيها أهم النقط، والحاجات اللي تبعد عنها، وجدول قرارات، وجداول المقارنة، والمعلومات والمصطلحات المهمة. في كل صفحة زرار «الملخص» بيشرح كل مهمة بكلام بسيط، وكل صفحة بتتطبع كويس من المتصفح.",
    cheatDesc: "5 جداول مراجعة لامتحان CCAR-F، جدول لكل مجال، ومعاهم ملخصات وجداول قرارات وجداول مقارنة ومعلومات ومصطلحات مهمة.",
    cheatPageTitle: (d) => `جدول المراجعة ${d.n}: ${d.title}`,
    cheatPageDesc: (d) => `جدول مراجعة في صفحة واحدة للمجال ${d.n}، ${d.title} (${d.weight}% من الامتحان)، ومعاه ملخص لكل مهمة.`,
    openTable: "افتح الجدول", sumDomain: "الملخص", jumpLabel: "في الصفحة دي", dcOf: (c) => `جدول القرارات بتاع ${c}`, dcPicks: "اعرض صفوف",
    compareH: "جداول المقارنة", compareJump: "المقارنات", nTables: (n) => `${n} جداول`, nRows: (n) => `${n} صف`, decidePop: "ذاكره في نافذة",
    factsH: "معلومات ومصطلحات مهمة", factsJump: "المعلومات والمصطلحات", factsCol: "معلومات مهمة", termsCol: "مصطلحات",
    factsLead: "الأسامي والأرقام والتعريفات بالظبط لكل مهمة، لما تحب تعرف تفاصيل أكتر. الزرار بيفتكر اختيارك، وزرار الترجمة اللي في كل مربع بيعرضه بالإنجليزي.",
    ftCount: (f, t) => `${f} معلومة · ${t} مصطلح`, ftShow: "اعرض",
    decideH: "جدول القرارات", decideJump: "جدول القرارات", decideTh: ["اللي في السؤال", "الإجابة المعتادة"],
    decideLead: "الحل المعتاد لكل عرَض بيوصفه السؤال، متقسم على المهام: اختار مهمة عشان تذاكرها لوحدها. استخدمه عشان تراجع تفكيرك، مش عشان تطابق كلمات: تفاصيل السيناريو هي اللي بتحدد.",
    domNotes: (n) => `ملاحظات المجال ${n}`,
    discTitle: "تنويه",
    discDesc: "دليل CCAR-F Field Guide مجهود مذاكرة مش رسمي ومالوش علاقة بـ Anthropic. بيغطي إيه، وملاحظات عن الدقة، وحدوده.",
    discLead: "ده مجهود مذاكرة من جروب، مش منتج رسمي من Anthropic. هنا هتعرف هو إيه وحدوده إيه.",
    disc: `
    <h2>مش رسمي ومستقل</h2>
    <p>دليل ${SITE.name} معمول من جروب مذاكرة وليه. مالوش أي علاقة بشركة Anthropic، ولا هي راعياه أو موافقة عليه. الأسماء "Anthropic" و"Claude" و"Claude Code" و"Claude Certified Architect" أسماء وعلامات تجارية بتاعة Anthropic، واحنا بنستخدمها بس عشان نوضح الامتحان اللي الدليل ده بيساعدك تذاكر له.</p>
    <h2>عن المحتوى</h2>
    <p>الملاحظات والمطبات دي ملاحظات مذاكرة متقسمة على المجالات الخمسة بتوع الامتحان والمهام المنشورة بتاعته. وجداول المراجعة بتلخص كل مجال في صفحة واحدة، ومعاها ملخص بكلام بسيط لكل مهمة.</p>
    <h2>مفيش أسئلة امتحان حقيقية</h2>
    <p>مفيش أي حاجة هنا جاية من الامتحان نفسه: لا أسئلة ولا إجابات ولا حاجة حد افتكرها من الامتحان، وماينفعش الموقع يتستخدم عشان ينشر حاجة زي كده. اللي بيمتحن ملتزم بشروط السرية بتاعة الامتحان.</p>
    <h2>تستخدمه إزاي</h2>
    <p>الامتحان بالإنجليزي وبيجيب سيناريوهات مختلفة محتاجة تفكير. الأحسن تذاكر من النسخة الإنجليزية وتستخدم زرار الترجمة اللي جنب كل صف لما تحتاجه. جداول القرارات بتقولك الإجابة المعتادة لكل عرَض بيوصفه السؤال، بس استخدمها عشان تراجع تفكيرك، مش عشان تطابق كلمات: تفاصيل السيناريو هي اللي بتحدد. ابدأ بجداول المراجعة والملخصات بتاعتها عشان تفهم كل آلية شغالة كده ليه، واستخدم المطبات عشان تتمرن تشرح ليه إجابة شكلها منطقي طلعت غلط، ودوّر في الملاحظات لما تحتاج التفاصيل.</p>
    <h2>الدقة</h2>
    <ul>
      <li>الملاحظات والملخصات اتكتبت بمساعدة الذكاء الاصطناعي، وممكن يكون فيها غلطات أو حاجات ناقصة.</li>
      <li>Claude وClaude Code وAgent SDK وMCP بيتغيروا بسرعة. الخيارات وأسماء الحقول والحدود وسلوك الموديلات اللي هنا ممكن تكون قديمة. ارجع للتوثيق الرسمي بتاع Anthropic قبل ما تعتمد على أي تفصيلة.</li>
      <li>المهام 1.1 و2.4 و3.6 متغطية جزئياً بس.</li>
      <li>شكل الامتحان اللي في الصفحة الرئيسية (60 سؤال، 120 دقيقة، 720 من 1000 عشان تنجح) ده حسب كلام ناس امتحنت ومواقع تانية، مش من مصدر رسمي.</li>
    </ul>
    <h2>مفيش ضمان</h2>
    <p>إنك تستخدم الدليل ده مش ضمان إنك تنجح. اعتبره أداة مراجعة جنب التوثيق الرسمي والتطبيق العملي.</p>
    <h2>الاستخدام</h2>
    <p>الدليل ده لجروب المذاكرة بتاعنا. متبيعهوش، ومتقدموش على إنه محتوى رسمي. ولو لقيت غلطة، قول للي ماسك الموقع عشان تتصلح للكل.</p>`,
    bmBtn: "احفظ", bmTitle: "المحفوظات", bmRemove: "شيل", bmClear: "امسح الكل", bmConfirm: "تمسح كل المحفوظات؟",
    bmDesc: "الصفوف اللي حفظتها من جداول القرارات والمطبات والملاحظات والمعلومات لامتحان CCAR-F، متخزنة في المتصفح ده.",
    bmLead: `صفوف جداول القرارات والمطبات والملاحظات والمعلومات اللي حفظتها، في مكان واحد. دوس على زرار ${icon("bookmark", "bm-ic")} جنب أي صف عشان تضيفه هنا. المحفوظات بتتخزن في المتصفح ده بس.`,
    bmEmpty: `لسه ماحفظتش حاجة. دوس على زرار ${icon("bookmark", "bm-ic")} جنب أي صف في <a href="cheat-tables.html">جدول القرارات</a> أو <a href="traps.html">المطبات</a> أو <a href="notes.html">الملاحظات</a>، وهتلاقيه هنا.`,
    bmGroups: { all: "الكل", trap: "المطبات", decide: "القرارات", note: "الملاحظات والمعلومات" },
    bmKinds: { trap: "مطب", decide: "قرار", concept: "الفكرة الأساسية", note: "ملاحظة", fact: "معلومة", term: "مصطلح" },
    planTitle: "خطة المذاكرة",
    planDesc: "تابع مذاكرتك لامتحان CCAR-F في كل مهمة: الملخص، وجدول القرارات، ومطبات الامتحان، وأسئلة التمرين.",
    planLead: "علّم على كل خطوة لما تخلصها في كل مهمة: اقرا الملخص بتاعها، وذاكر صفوف جدول القرارات بتاعتها، واتمرن على المطبات بتاعتها، وبعدين حل أسئلة تمرين من برّه. العلامات بتتحفظ في المتصفح ده بس.",
    planTh: ["المهمة", "قريت الملخص", "جدول القرارات", "مطبات الامتحان", "حليت أسئلة (من برّه)"],
    planShort: ["الملخص", "القرارات", "المطبات", "الأسئلة"],
    planFold: "اعرض أو خبّي مهام المجال ده",
    planOpen: ["افتح الملخص", "افتح جدول القرارات", "افتح مطبات الامتحان"], popDone: "علّم الخطوة دي إنها خلصت",
    popLoading: "بيحمّل…", popFailed: "مقدرناش نحمّل ده. اتأكد من النت وجرّب تاني.",
    recallH: "معلومات ومصطلحات",
    planDone: "خلصت {done} من {total} خطوة · {pct}%", planReset: "ابدأ من الأول", planConfirm: "تمسح كل العلامات اللي في الخطة؟",
    nfTitle: "الصفحة مش موجودة",
    nfBody: `الصفحة اللي بتدوّر عليها مش موجودة. روح <a href="index.html">للرئيسية</a> أو <a href="cheat-tables.html">لجداول المراجعة</a> أو <a href="traps.html">لمطبات الامتحان</a>، أو <a href="notes.html">دوّر في الملاحظات</a>.`,
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

function site(lang, data, altData, SHEETS, ALT_SHEETS) {
  const S = P[lang];
  const altLang = lang === "en" ? "ar" : "en";
  const A = P[altLang];
  const T = totals(data);
  // Decision table rows per task statement ({ "1.1": [[symptom, answer], …] }) and, after them, its fact & term
  // recall rows ([[question, answer], …]). Both languages must line up row for row.
  const decideOf = (n) => SHEETS[n].decide || {};
  const recallOf = (n) => SHEETS[n].recall || {};
  for (const d of data)
    for (const kind of ["decide", "recall"])
      for (const [code, rows] of Object.entries(SHEETS[d.n][kind] || {}))
        if ((ALT_SHEETS[d.n][kind]?.[code] || []).length !== rows.length) throw new Error(`Decision table ${code} (${kind}): the English and Arabic rows don't line up`);
  const nTaskRows = (code) => {
    const n = code.split(".")[0];
    return (decideOf(n)[code] || []).length + (recallOf(n)[code] || []).length;
  };
  const nDecide = (n) => sum(data.find((d) => d.n === Number(n)).lessons, (l) => nTaskRows(l.code));
  T.decide = sum(data, (d) => nDecide(d.n));
  // Each table cell carries both languages; the row's translate button swaps which one is shown.
  const dual = (html, altHtml) =>
    `<div class="tx">${html}</div><div class="tx" lang="${altLang}" dir="${altLang === "ar" ? "rtl" : "ltr"}" hidden>${altHtml}</div>`;
  // Labels and title live once on the page container (data-trx-*); site.js applies them.
  // A row that can be bookmarked carries data-bm-* (a stable id, its kind, a link back and a one-line context);
  // site.js saves a copy of its cells to localStorage, which the bookmarks page lists.
  const bmBtn = `<button type="button" class="bm-btn" data-bm aria-pressed="false" title="${esc(S.bmBtn)}" aria-label="${esc(S.bmBtn)}">${icon("bookmark")}</button>`;
  const bmAttrs = (bmId, kind, href, ctx, altCtx) =>
    `data-bm-id="${bmId}" data-bm-kind="${kind}" data-bm-href="${href}" data-bm-ctx="${esc(ctx.replace(/`/g, ""))}" data-bm-ctx-alt="${esc(altCtx.replace(/`/g, ""))}"`;
  const altTask = (code) => altData.flatMap((x) => x.lessons).find((x) => x.code === code).task;
  const trxCell = `<td class="trx"><div class="row-acts">${bmBtn}<button type="button" class="trx-btn" data-trx aria-pressed="false">${S.trxOff}</button></div></td>`;
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
  <td><div class="links"><a href="cheat-table-${d.n}.html">${S.linkCheat}</a><a href="cheat-table-${d.n}.html#summary">${S.linkSummary}</a><a href="traps.html#d${d.n}">${S.linkTraps}</a></div></td>
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
      <a class="btn btn-primary" href="cheat-tables.html">${icon("table")}${S.btnCheat}</a>
      <a class="btn" href="traps.html">${icon("alert")}${S.btnTraps}</a>
      <a class="btn" href="notes.html">${icon("search")}${S.btnNotes}</a>
    </div>
  </section>
  <div class="entry-grid">
    <a class="Box entry entry-main" href="cheat-tables.html"><h2>${icon("table")}${S.entryCheatTitle}</h2><p>${S.entryCheat}</p><div class="stats"><span class="Counter">${S.cTables}</span><span class="Counter">${S.cDecide(T.decide)}</span><span class="Counter">${S.cSummaries(T.lessons)}</span><span class="Counter">${S.cFacts(T.facts)}</span><span class="Counter">${S.cTerms(T.terms)}</span></div></a>
    <a class="Box entry" href="traps.html"><h2>${icon("alert")}${S.entryTrapsTitle}</h2><p>${S.entryTraps}</p><div class="stats"><span class="Counter">${S.cTraps(T.traps)}</span></div></a>
    <a class="Box entry" href="notes.html"><h2>${icon("search")}${S.entryNotesTitle}</h2><p>${S.entryNotes(T)}</p><div class="stats"><span class="Counter">${S.cNotes(T.notes)}</span><span class="Counter">${S.cFacts(T.facts)}</span><span class="Counter">${S.cTerms(T.terms)}</span></div></a>
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
    // On phones the search row stays pinned at the top; Filters opens the rest, Sections opens the task list.
    return `<aside class="side" aria-label="Filters">
  <div class="side-bar">
    <label class="search">${icon("search")}<span class="sr-only">${S.search}</span><input class="input" id="q" type="search" placeholder="${esc(placeholder)}" autocomplete="off" enterkeyhint="search"></label>
    <button type="button" class="side-btn" data-side-filters aria-expanded="false" aria-controls="side-more-${prefix}">${icon("filter")}<span>${S.filters}</span></button>
    <button type="button" class="side-btn" data-side-sections aria-haspopup="dialog">${icon("list")}<span>${S.sections}</span></button>
  </div>
  <p class="count" data-count data-count-tpl="${esc(S.countTpl)}" aria-live="polite"></p>
  <div class="side-more" id="side-more-${prefix}">
    <div><h2>${S.domainH}</h2><ul class="dlist">
      <li><button class="dbtn" type="button" data-d="all" aria-pressed="true"><span class="dot all"></span><span><span class="long">${S.allDomains}</span><span class="short">${S.all}</span></span><span class="w">100%</span></button></li>
      ${data.map(dbtn).join("")}
    </ul></div>
    ${controls}
  </div>
  <nav class="toc" aria-label="Task statements">${toc}</nav>
</aside>`;
  };
  // Phones and tablets hide the sidebar task list; the Sections button shows a copy of it in this dialog (site.js fills it).
  const tocDialog = `
<dialog class="sum-dialog toc-dialog" id="toc-dialog" aria-labelledby="toc-title">
  <div class="sum-inner">
    <div class="sum-head"><h2 id="toc-title">${S.sectionsTitle}</h2><button type="button" class="sum-close" data-close aria-label="${esc(S.sumClose)}" title="${esc(S.sumClose)}">${icon("x")}</button></div>
    <div class="sum-body" id="toc-body"></div>
  </div>
</dialog>`;
  // Summary buttons open one shared dialog; data-sum is "d<n>" (whole domain) or a task code such as "5.1".
  const sumBtn = (key, label = S.viewSummary) => `<button type="button" class="sum-btn" data-sum="${key}">${icon("book")}<span>${label}</span></button>`;
  // extra: links shown beside the summary button (the traps page links each heading to its cheat table).
  const domainHead = (d, what, extra = "") =>
    `<header class="dom-head"><span class="Label">${S.domainLabel(d.n)}</span><h2>${esc(d.title)}</h2><span class="muted">${S.pctExam(d.weight)} · ${what}</span><div class="head-acts">${sumBtn(`d${d.n}`)}${extra}</div></header>`;
  const taskHead = (l, extra = "") => `<div class="task-head"><span class="code">${esc(l.code)}</span><h3>${md(l.task)}</h3><div class="head-acts">${sumBtn(l.code)}${extra}</div></div>`;
  const headLink = (href, ic, label) => `<a class="sum-btn" href="${href}">${icon(ic)}<span>${label}</span></a>`;
  const hasCard = (code) => SHEETS[code.split(".")[0]].cards.some((c) => c.includes(`id="c-${code.replace(".", "-")}"`));
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
  // Summaries in both languages for the given domains, read by site.js. "<" is escaped so the JSON can't close the script tag.
  const sumData = (list) =>
    Object.fromEntries(
      list.map((d) => {
        const ad = altData[data.indexOf(d)];
        return [`d${d.n}`, {
          color: d.color,
          label: S.domainLabel(d.n), title: esc(d.title), intro: md(d.intro || ""),
          alt: { label: A.domainLabel(d.n), title: esc(ad.title), intro: md(ad.intro || "") },
          tasks: d.lessons.map((l, li) => ({
            code: l.code, task: md(l.task), summary: paras(l.summary),
            alt: { task: md(ad.lessons[li].task), summary: paras(ad.lessons[li].summary) },
          })),
        }];
      })
    );
  // prefix: the anchor prefix of the sections the domain summary links to ("n" notes, "t" traps, "c" cheat cards).
  // A cheat table page passes its one domain; "#summary" in its URL opens that domain's summary on load.
  // linkPage: the page those sections live on when it isn't this one ("{n}" becomes the domain number).
  const sumDialog = (prefix, list = data, linkPage = "") => `
<script type="application/json" id="sum-data">${JSON.stringify(sumData(list)).replace(/</g, "\\u003c")}</script>
<dialog class="sum-dialog" id="sum-dialog" aria-labelledby="sum-title" data-prefix="${prefix}"${linkPage ? ` data-link-page="${linkPage}"` : ""} data-all="${esc(S.sumAll)}" data-alt-all="${esc(A.sumAll)}"${list.length === 1 ? ` data-default="d${list[0].n}"` : ""} ${trxAttrs}>
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
  const nrow = (d, l, kind, i, [topic, text, short], [aTopic, aText, aShort]) =>
    `<tr data-row data-d="${d.n}" data-kind="${kind}" ${bmAttrs(`${kind}:${l.code}${i < 0 ? "" : ":" + i}`, kind, `notes.html#${id("n", l.code)}`, `${l.code} ${l.task}`, `${l.code} ${altTask(l.code)}`)}><td class="topic">${dual(kindTag(S, kind) + md(topic), kindTag(A, kind) + md(aTopic))}</td><td>${dual(noteBlock(S, text, short), noteBlock(A, aText, aShort))}</td>${trxCell}</tr>`;
  const shortSwitch = (cls) => `<label class="${cls}"><input type="checkbox" class="switch-input" data-short-toggle> <span>${S.shortOnly}</span></label>`;
  const notesDomains = data
    .map((d, di) => {
      const tasks = d.lessons
        .map((l, li) => {
          const a = altData[di].lessons[li];
          const r = [
            l.key_concept ? nrow(d, l, "concept", -1, [l.key_concept.term, l.key_concept.definition, l.key_concept.short], [a.key_concept.term, a.key_concept.definition, a.key_concept.short]) : "",
            ...l.notes.map((n, i) => nrow(d, l, "note", i, [n.topic, n.note, n.short], [a.notes[i].topic, a.notes[i].note, a.notes[i].short])),
            ...(l.facts || []).map((f, i) => nrow(d, l, "fact", i, [f.item, f.detail], [a.facts[i].item, a.facts[i].detail])),
            ...(l.terms || []).map((t, i) => nrow(d, l, "term", i, [t.term, t.def], [a.terms[i].term, a.terms[i].def])),
          ].join("");
          return `<section class="task" id="${id("n", l.code)}">
  ${taskHead(l)}
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
  // Ready-made searches under the page title; each fills the search box.
  const tryChips = ["`stop_reason`", "`tool_choice`", "`CLAUDE.md`", "`PostToolUse`", "`fork_session`", "few-shot"]
    .map((q) => `<button type="button" class="qchip" data-q="${esc(q.replace(/`/g, ""))}">${md(q)}</button>`)
    .join("");
  write("notes.html", {
    title: S.notesTitle,
    description: S.notesDesc(T),
    active: "notes",
    body: `
<div class="container">
  <div class="layout" data-filter-page data-store="notes" ${trxAttrs}>
    ${sidebar({ prefix: "n", placeholder: S.notesSearch, controls: kindControls })}
    <div style="min-width:0">
      <div class="pagehead lead-only"><h1>${S.notesTitle}</h1><p class="flash study-note">${icon("info")}<span>${S.notesNote}</span></p><p>${S.notesLead}</p><div class="qchips"><span>${S.tryH}:</span>${tryChips}</div>${shortSwitch("short-switch")}</div>
      ${notesDomains}
      <p class="empty-all" hidden>${S.notesEmpty}</p>
    </div>
  </div>
  ${sumDialog("n")}
  ${tocDialog}
</div>`,
  });

  /* ------------------------------------------------------------ Traps */
  // One task's traps table and exam tips, on the traps page and (rows and tips only) in the plan page's pop-up.
  // The cheat tables don't link to the traps.
  const trapRows = (d, l, a) =>
    l.traps
      .map((t, i) => {
        const at = a.traps[i];
        return `<tr data-row data-d="${d.n}" data-kind="trap" tabindex="0" ${bmAttrs(`trap:${l.code}:${i}`, "trap", `traps.html#${id("t", l.code)}`, `${l.code} ${l.task}`, `${l.code} ${altTask(l.code)}`)}><td class="trapcol">${dual(md(t.trap), md(at.trap))}</td><td class="whycol">${dual(md(t.why), md(at.why))}</td><td class="fixcol">${dual(md(t.fix), md(at.fix))}</td>${trxCell}</tr>`;
      })
      .join("");
  const trapTips = (d, l) =>
    (l.exam_tips || []).length
      ? `<div class="flash tips"><div class="flash-title">${icon("bulb", "oc")}${S.tipsH}</div><ul>${l.exam_tips.map((t) => `<li data-row data-d="${d.n}" data-kind="tip">${md(t)}</li>`).join("")}</ul></div>`
      : "";
  const trapsHead = `<thead><tr>${S.trapsTh.map((h) => `<th>${h}</th>`).join("")}${trxTh}</tr></thead>`;
  const trapBlock = (d, l, a) => `<div class="Box"><div class="tscroll"><table class="gh stack traps">${trapsHead}<tbody>${trapRows(d, l, a)}</tbody></table></div></div>
  ${trapTips(d, l)}`;
  const trapsDomains = data
    .map((d, di) => {
      const tasks = d.lessons
        .map((l, li) => {
          const cheat = hasCard(l.code) ? headLink(`cheat-table-${d.n}.html#${id("c", l.code)}`, "table", S.linkCheat) : "";
          return `<section class="task" id="${id("t", l.code)}">
  ${taskHead(l, cheat)}
  ${trapBlock(d, l, altData[di].lessons[li])}
</section>`;
        })
        .join("\n");
      return `<section class="domain" id="d${d.n}" data-d="${d.n}" style="--c:${d.color}">
${domainHead(d, S.nTraps(stats(d).traps), headLink(`cheat-table-${d.n}.html`, "table", S.linkCheat))}
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
  <div class="layout" data-filter-page data-store="traps" ${trxAttrs}>
    ${sidebar({ prefix: "t", placeholder: S.trapsSearch, controls: `<label class="toggle"><input type="checkbox" data-quiz-toggle> ${S.quiz}</label>` })}
    <div style="min-width:0">
      <div class="pagehead lead-only"><h1>${S.trapsTitle}</h1><p>${S.trapsLead}</p><label class="short-switch"><input type="checkbox" class="switch-input" data-quiz-toggle> <span>${S.quiz}</span></label></div>
      ${trapsDomains}
      <p class="empty-all" hidden>${S.trapsEmpty}</p>
    </div>
  </div>
  ${sumDialog("t")}
  ${tocDialog}
</div>`,
  });

  /* ----------------------------------------------------- Cheat tables */
  // A task's decision table rows, as a small pill with their count. It opens the domain's decision table dialog
  // on that task (data-decide-pop), on a cheat table and on the index; the href is the no-JS fallback.
  const dcPill = (l) => {
    const n = nTaskRows(l.code);
    if (!n) return "";
    const attrs = `class="dc-pill" title="${esc(S.dcOf(l.code))}" aria-label="${esc(S.dcOf(l.code))}"`;
    return `<a ${attrs} href="cheat-table-${l.code.split(".")[0]}.html#${id("dc", l.code)}" data-decide-pop="${l.code}">${icon("target")}<span>${n}</span></a>`;
  };
  // A heading that carries both languages; the translate button of its box swaps them.
  const dualInline = (html, altHtml) =>
    `<span class="tx">${html}</span><span class="tx" lang="${altLang}" dir="${altLang === "ar" ? "rtl" : "ltr"}" hidden>${altHtml}</span>`;
  // One task's decision table rows: its scenario rows, then its fact & term recall rows under a sub-heading.
  // Each row carries both languages (translate button) and a bookmark button; a bookmarked row links to #dc-1-3.
  const dcRows = (d, l, a) => {
    const row = (bmId, [q, ans], [aq, aans]) =>
      `<tr tabindex="0" ${bmAttrs(bmId, "decide", `cheat-table-${d.n}.html#${id("dc", l.code)}`, `${l.code} ${l.task}`, `${l.code} ${a.task}`)}><td class="q">${dual(md(q), md(aq))}</td><td class="a"><span class="ans">${dualInline(md(ans), md(aans))}</span></td>${trxCell}</tr>`;
    const rows = decideOf(d.n)[l.code] || [], alt = ALT_SHEETS[d.n].decide?.[l.code] || [];
    const rc = recallOf(d.n)[l.code] || [], rcAlt = ALT_SHEETS[d.n].recall?.[l.code] || [];
    return rows.map((r, i) => row(`decide:${l.code}:${i}`, r, alt[i])).join("") +
      (rc.length ? `<tr class="dc-sub"><th colspan="3">${icon("book")}${S.recallH}</th></tr>` + rc.map((r, i) => row(`decide:${l.code}:r${i}`, r, rcAlt[i])).join("") : "");
  };
  const dcHead = `<thead><tr><th>${S.decideTh[0]}</th><th>${S.decideTh[1]}</th>${trxTh}</tr></thead>`;
  // A domain's decision table, grouped by task statement (one <tbody data-dc> each), on its cheat table. Its dialog
  // for drilling (data-dc-dialog, also on the index) is an empty frame that site.js fills from assets/pop/ on first
  // open, so pages don't carry a second copy. Both have the quiz switch (data-dq: each usual answer stays hidden
  // until tapped) and chips that show one task's rows (data-dc-pick).
  // data-decide-pop="d1" opens the dialog on all rows, "1.3" on one task.
  const decideFor = (d, di) => {
    const ad = altData[di];
    const groups = d.lessons.map((l, li) => ({ l, a: ad.lessons[li], k: nTaskRows(l.code) })).filter((g) => g.k);
    const n = nDecide(d.n);
    const pick = (key, label, k) => `<button type="button" data-dc-pick="${key}" aria-pressed="${key === "all"}">${label} <span class="Counter">${k}</span></button>`;
    const table = () => `<div class="dc-tools"><label class="toggle dq-toggle"><input type="checkbox" data-dq> ${S.quiz}</label>
  <div class="seg dc-picks" role="group" aria-label="${esc(S.dcPicks)}">${pick("all", S.all, n)}${groups.map((g) => pick(g.l.code, g.l.code, g.k)).join("")}</div></div>
  <div class="Box"><div class="tscroll"><table class="gh stack decide">${dcHead}${groups
    .map(({ l, a }) => `<tbody data-dc="${l.code}"><tr class="dc-h"><th colspan="3"><span class="code">${esc(l.code)}</span> ${md(l.task)}</th></tr>${dcRows(d, l, a)}</tbody>`)
    .join("")}</table></div></div>`;
    const dialog = n
      ? `
<dialog class="sum-dialog decide-dialog" id="dc-dialog-${d.n}" aria-labelledby="dc-title-${d.n}" style="--c:${d.color}" data-dc-dialog="${d.n}" data-dq-host ${trxAttrs}>
  <div class="sum-inner">
    <div class="sum-head">
      <div class="sum-titles"><span class="Label">${S.domainLabel(d.n)}</span><h2 id="dc-title-${d.n}">${S.decideH} · ${S.nRows(n)}</h2></div>
      <div class="sum-tools"><button type="button" class="sum-close" data-dc-close aria-label="${esc(S.sumClose)}" title="${esc(S.sumClose)}">${icon("x")}</button></div>
    </div>
    <div class="sum-body dc-body">
      <p class="section-lead">${S.decideLead}</p>
      <div class="dc-slot" data-dc-slot></div>
    </div>
  </div>
</dialog>`
      : "";
    return { n, table, dialog };
  };
  const decides = data.map((d, di) => decideFor(d, di));
  // Pop-up content, loaded only when a pop-up opens: assets/pop/<lang>-d<n>.js sets CCARF_POP[n] to the domain's
  // summaries (both languages), decision table rows and trap rows, ready-made. Labels the pop-ups build with are
  // in #pop-text on the pages that have them.
  data.forEach((d, di) => {
    const ad = altData[di];
    const pop = {
      color: d.color, label: S.domainLabel(d.n),
      tasks: d.lessons.map((l, li) => {
        const a = ad.lessons[li];
        return { code: l.code, task: md(l.task), sum: paras(l.summary), sumAlt: paras(a.summary), nDc: nTaskRows(l.code), dc: dcRows(d, l, a), nTraps: l.traps.length, traps: trapRows(d, l, a), tips: trapTips(d, l) };
      }),
    };
    writeFileSync(join(POP_DIR, `${lang}-d${d.n}.js`), `window.CCARF_POP=window.CCARF_POP||{};window.CCARF_POP[${d.n}]=${JSON.stringify(pop)};\n`, "utf8");
  });
  const popText = `<script type="application/json" id="pop-text">${JSON.stringify({
    quiz: S.quiz, all: S.all, dcPicks: S.dcPicks, decideTh: S.decideTh, trapsTh: S.trapsTh, trxTh: S.trxTh, loading: S.popLoading, failed: S.popFailed,
  }).replace(/</g, "\\u003c")}</script>`;
  write("cheat-tables.html", {
    title: S.cheatTitle,
    description: S.cheatDesc,
    active: "cheat",
    body: `
<div class="container" data-jump>
  <div class="pagehead"><h1>${S.cheatTitle}</h1><p>${S.cheatLead}</p></div>
  <nav class="jumpbar" aria-label="${esc(S.domainsH)}"><div class="jumpbar-in">${data
    .map((d) => `<a class="jump-dom" href="#d${d.n}" style="--c:${d.color}"><span class="dot"></span>D${d.n} ${esc(d.short)}</a>`)
    .join("")}</div></nav>
  <div class="cs-index">${data
    .map((d) => {
      const s = stats(d);
      return `<div class="Box cs-thumb" id="d${d.n}" style="--c:${d.color}">
  <a class="cs-thumb-main" href="cheat-table-${d.n}.html">
    <div class="Box-header"><span class="Label">${S.domainLabel(d.n)}</span><h2>${esc(d.title)}</h2></div>
  </a>
  <div class="Box-body"><ol>${d.lessons
    .map((l) => `<li><a class="cs-task" href="cheat-table-${d.n}.html${hasCard(l.code) ? `#${id("c", l.code)}` : ""}"><b>${esc(l.code)}</b><span>${md(l.task)}</span></a>${dcPill(l)}</li>`)
    .join("")}</ol></div>
  <div class="cs-thumb-foot">
    <a class="btn btn-sm" href="cheat-table-${d.n}.html">${icon("table")}${S.openTable}</a>
    <a class="btn btn-sm" href="cheat-table-${d.n}.html#summary" data-sum="d${d.n}">${icon("book")}${S.sumDomain}</a>
    <a class="btn btn-sm btn-decide" href="cheat-table-${d.n}.html#decisions" data-decide-pop="d${d.n}">${icon("target")}${S.decideH}<span class="Counter">${nDecide(d.n)}</span></a>
    <span class="stats"><span class="Counter">${S.cFacts(s.facts)}</span><span class="Counter">${S.cTerms(s.terms)}</span></span>
  </div>
</div>`;
    })
    .join("")}</div>
  ${sumDialog("c", data, "cheat-table-{n}.html")}
  ${decides.map((x) => x.dialog).join("")}
  ${popText}
</div>`,
  });
  // Key facts and terms of one task statement, in both languages.
  const ftItems = (xs = [], axs = [], k, v) =>
    `<ul class="ft-items">${xs.map((x, i) => `<li>${dual(`<b>${md(x[k])}</b> ${md(x[v])}`, `<b>${md(axs[i][k])}</b> ${md(axs[i][v])}`)}</li>`).join("")}</ul>`;
  const ftBlock = (l, a) => `<section class="Box ft-block" id="f-${l.code.replace(".", "-")}" data-trx-scope>
  <header class="ft-h"><span class="n">${esc(l.code)}</span><h3>${dualInline(md(l.task), md(a.task))}</h3><button type="button" class="trx-btn" data-trx aria-pressed="false">${S.trxOff}</button></header>
  <div class="ft-cols">
    <div class="ft-col"><h4 class="ft-k fact">${dualInline(S.factsCol, A.factsCol)} <span class="Counter">${(l.facts || []).length}</span></h4>${ftItems(l.facts, a.facts, "item", "detail")}</div>
    <div class="ft-col"><h4 class="ft-k term">${dualInline(S.termsCol, A.termsCol)} <span class="Counter">${(l.terms || []).length}</span></h4>${ftItems(l.terms, a.terms, "term", "def")}</div>
  </div>
</section>`;
  const sheetNav = (d) =>
    data.map((o) => `<a class="Label" style="--c:${o.color}" href="cheat-table-${o.n}.html"${o.n === d.n ? ' aria-current="page"' : ""}>${S.domainLabel(o.n)}</a>`).join("");
  // A section that folds away behind a switch, closed by default (comparisons, facts & terms). site.js remembers
  // each one's state (by key) across pages and visits.
  const fold = ({ key, title, meta = "", attrs = "" }, body) => `<details class="section fold" id="${key}" data-fold="${key}"${attrs}>
  <summary><h2>${title}</h2>${meta ? `<span class="ft-count">${meta}</span>` : ""}<span class="ft-switch"><span class="switch-vis" aria-hidden="true"></span>${S.ftShow}</span></summary>
  ${body}
</details>`;
  data.forEach((d, di) => {
    const sh = SHEETS[d.n];
    const ad = altData[di];
    // Each task card's summary button is followed by its decision table pill.
    const cards = sh.cards
      .join("\n")
      .replace(/(<button type="button" class="sum-mini" data-sum="(\d\.\d)"[^>]*>[\s\S]*?<\/button>)/g, (m, btn, code) => {
        const l = d.lessons.find((x) => x.code === code);
        return l ? btn + dcPill(l) : btn;
      });
    const cardId = (l) => `c-${l.code.replace(".", "-")}`;
    const carded = d.lessons.filter((l) => cards.includes(`id="${cardId(l)}"`));
    const facts = d.lessons.map((l, li) => ftBlock(l, ad.lessons[li])).join("\n");
    // The jump bar stays pinned under the header, in page order: each task card, the decision table,
    // comparisons, facts & terms. The Summary button opens the summary dialog.
    const jumpTasks = carded.map((l) => `<a href="#${cardId(l)}" title="${esc(l.task.replace(/`/g, ""))}">${esc(l.code)}</a>`).join("");
    const compare = (d.comparisons || [])
      .map(
        (c) => `<div><h3>${md(c.title)}</h3><div class="Box"><div class="tscroll"><table class="gh compare"><thead><tr>${c.columns.map((h) => `<th>${md(h)}</th>`).join("")}</tr></thead><tbody>${c.rows
          .map((r) => `<tr>${r.map((cell, i) => `<td data-label="${esc(c.columns[i].replace(/`/g, ""))}">${md(cell)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div></div></div>`
      )
      .join("");
    // The decision table section; its dialog comes from decideFor too.
    const { n: nDc, table: decideTable, dialog: decideDialog } = decides[di];
    const decidePop = (cls, label) => `<button type="button" class="${cls}" data-decide-pop="d${d.n}">${icon("target")}<span>${label}</span></button>`;
    const decide = nDc
      ? `<section class="section" id="decide" data-dq-host ${trxAttrs}><div class="sec-head"><h2>${S.decideH}</h2>${decidePop("sum-btn", S.decidePop)}</div><p class="section-lead">${S.decideLead}</p>
  ${decideTable()}</section>`
      : "";
    const s = stats(d);
    write(`cheat-table-${d.n}.html`, {
      title: S.cheatPageTitle(d),
      description: S.cheatPageDesc(d),
      active: "cheat",
      body: `
<div class="container" style="--c:${d.color}" data-sheet="${d.n}" data-jump>
  <header class="sheet-head"><span class="Label">${S.domainLabel(d.n)}</span><h1>${esc(d.title)}</h1><span class="Label">${S.pctExam(d.weight)}</span>${nDc ? `<button type="button" class="btn btn-sm btn-decide" data-decide-pop="d${d.n}">${icon("target")}${S.decideH}<span class="Counter">${nDc}</span></button>` : ""}<p>${esc(sh.sub)}</p>
    <div class="sheet-nav">${sheetNav(d)}</div>
  </header>
  <nav class="jumpbar" aria-label="${esc(S.jumpLabel)}"><div class="jumpbar-in">
    ${sumBtn(`d${d.n}`, S.sumDomain).replace('class="sum-btn"', 'class="sum-btn jump-sum"')}
    ${jumpTasks}${decide ? `<a class="jump-dc" href="#decide" data-decide-pop="d${d.n}">${icon("target")}${S.decideJump}</a>` : ""}${compare ? `<a href="#compare">${S.compareJump}</a>` : ""}<a href="#facts">${S.factsJump}</a>
  </div></nav>
  <div class="cs-grid">${cards}</div>
  ${decide}
  ${compare ? fold({ key: "compare", title: S.compareH, meta: S.nTables(d.comparisons.length) }, `<div class="compare-list">${compare}</div>`) : ""}
  ${fold({ key: "facts", title: S.factsH, meta: S.ftCount(s.facts, s.terms), attrs: ` ${trxAttrs}` }, `<p class="section-lead">${S.factsLead}</p>
  <div class="ft-list">${facts}</div>`)}
  <div class="sheet-foot">
    <div class="sheet-nav">${sheetNav(d)}</div>
    <div class="links"><a href="notes.html#d${d.n}">${S.domNotes(d.n)}</a></div>
  </div>
  ${sumDialog("c", [d])}
  ${decideDialog}
  ${popText}
</div>`,
    });
  });

  /* -------------------------------------------------------- Bookmarks */
  // site.js fills the list from localStorage; the labels it needs are in #bm-text.
  const bmText = { kinds: S.bmKinds, remove: S.bmRemove, confirm: S.bmConfirm, trapsTh: S.trapsTh, decideTh: S.decideTh };
  write("bookmarks.html", {
    title: S.bmTitle,
    description: S.bmDesc,
    active: "saved",
    body: `
<div class="container">
  <div class="pagehead"><h1>${S.bmTitle}</h1><p>${S.bmLead}</p></div>
  <div class="bm-page" data-bm-page ${trxAttrs}>
    <div class="bm-bar">
      <div class="seg bm-filter" role="group">${Object.entries(S.bmGroups)
        .map(([k, v]) => `<button type="button" data-bm-group="${k}" aria-pressed="${k === "all"}">${v} <span class="Counter" data-bm-n="${k}">0</span></button>`)
        .join("")}</div>
      <button type="button" class="btn btn-sm" data-bm-clear hidden>${icon("x")}${S.bmClear}</button>
    </div>
    <div class="bm-list" data-bm-list></div>
    <p class="bm-empty" data-bm-empty>${S.bmEmpty}</p>
  </div>
  <script type="application/json" id="bm-text">${JSON.stringify(bmText).replace(/</g, "\\u003c")}</script>
</div>`,
  });

  /* ------------------------------------------------------------- Plan */
  // A progress table: one row per task statement, one checkbox per study step (data-plan="1.1:sum").
  // site.js keeps the ticks in localStorage and fills in the counts and the progress bar. Each domain's heading
  // row folds its task rows away (data-plan-fold); which domains are folded is remembered too.
  // Beside the first three checkboxes, a button (data-pop="1.3:dc") opens that step for that task in the study
  // pop-up, whose content site.js loads from assets/pop/ when it opens; its tabs switch between the steps.
  const planSteps = ["sum", "dc", "traps", "q"];
  const planIcons = { sum: "book", dc: "target", traps: "alert" };
  // The 90 open buttons point at one copy of each icon (an inline sprite) instead of repeating its paths.
  const sprite = `<svg class="sprite" aria-hidden="true">${Object.values(planIcons)
    .map((n) => icon(n).replace(/^<svg[^>]*>/, `<symbol id="pi-${n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`).replace(/<\/svg>$/, "</symbol>"))
    .join("")}</svg>`;
  const planOpen = (l, k, i) =>
    planIcons[k] ? `<button type="button" class="plan-open" data-pop="${l.code}:${k}" title="${esc(`${S.planOpen[i]} · ${l.code}`)}" aria-label="${esc(`${S.planOpen[i]} · ${l.code}`)}"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#pi-${planIcons[k]}"/></svg></button>` : "";
  const popTab = (k, i) => `<button type="button" data-pop-tab="${k}" aria-pressed="false">${icon(planIcons[k])}<span>${S.planShort[i]}</span>${k === "sum" ? "" : ` <span class="Counter" data-pop-n="${k}"></span>`}</button>`;
  const popDialog = `
<dialog class="sum-dialog pop-dialog" id="pop-dialog" aria-labelledby="pop-title" data-pop-dialog data-dq-host ${trxAttrs}>
  <div class="sum-inner">
    <div class="sum-head">
      <div class="sum-titles"><span class="Label" data-pop-label></span><h2 id="pop-title" data-pop-title></h2></div>
      <div class="sum-tools"><button type="button" class="sum-close" data-pop-close aria-label="${esc(S.sumClose)}" title="${esc(S.sumClose)}">${icon("x")}</button></div>
    </div>
    <div class="pop-bar">
      <div class="seg pop-tabs" role="group" aria-label="${esc(S.planTitle)}">${["sum", "dc", "traps"].map(popTab).join("")}</div>
      <label class="toggle pop-done"><input type="checkbox" data-pop-done> ${S.popDone}</label>
    </div>
    <div class="sum-body pop-body" data-pop-body></div>
    <div class="pop-foot"><button type="button" class="btn btn-sm" data-pop-go="-1">${icon("arrowLeft")}<span></span></button><button type="button" class="btn btn-sm" data-pop-go="1"><span></span>${icon("arrowRight")}</button></div>
  </div>
</dialog>`;
  const planGroups = data
    .map((d) => `<tbody data-plan-d="${d.n}" style="--c:${d.color}"><tr class="plan-dh"><th colspan="5"><button type="button" class="plan-dh-in" data-plan-fold aria-expanded="true" title="${esc(S.planFold)}">${icon("chevronDown", "plan-chev")}<span class="Label">${S.domainLabel(d.n)}</span><span class="plan-dt">${esc(d.title)}</span><span class="Counter" data-plan-count>0/${d.lessons.length * planSteps.length}</span></button></th></tr>${d.lessons
      .map((l) => `<tr data-plan-row="${l.code}"><td class="plan-task"><a href="cheat-table-${d.n}.html${hasCard(l.code) ? `#${id("c", l.code)}` : ""}"><b>${esc(l.code)}</b><span>${md(l.task)}</span></a></td>${planSteps
        .map((k, i) => `<td class="plan-step" data-label="${esc(S.planShort[i])}"><div class="plan-cell"><label class="plan-cb"><input type="checkbox" data-plan="${l.code}:${k}" aria-label="${esc(`${l.code} · ${S.planTh[i + 1]}`)}"></label>${planOpen(l, k, i)}</div></td>`)
        .join("")}</tr>`)
      .join("")}</tbody>`)
    .join("");
  write("plan.html", {
    title: S.planTitle,
    description: S.planDesc,
    active: "plan",
    body: `
<div class="container">
  <div class="pagehead"><h1>${S.planTitle}</h1><p>${S.planLead}</p></div>
  <div class="plan" data-plan-page data-plan-tpl="${esc(S.planDone)}" data-plan-confirm="${esc(S.planConfirm)}">
    <div class="plan-top">
      <div class="plan-prog"><div class="plan-bar"><span data-plan-bar></span></div><p data-plan-total aria-live="polite"></p></div>
      <button type="button" class="btn btn-sm" data-plan-reset>${icon("x")}${S.planReset}</button>
    </div>
    <div class="Box"><div class="tscroll"><table class="gh plan-table"><thead><tr>${S.planTh.map((h, i) => `<th${i ? ' class="plan-step"' : ""}>${h}</th>`).join("")}</tr></thead>${planGroups}</table></div></div>
  </div>
  ${popDialog}
  ${popText}
  ${sprite}
</div>`,
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
  const T = site(lang, DATA[lang], DATA[lang === "en" ? "ar" : "en"], await sheetsFor(lang), await sheetsFor(lang === "en" ? "ar" : "en"));
  console.log(`${lang}: ${T.lessons} task statements, ${T.notes} notes, ${T.facts} facts, ${T.terms} terms, ${T.traps} traps, ${T.decide} decision table rows.\n`);
}

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
