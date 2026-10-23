// Shared helpers for the CCAR-F Field Guide build: escaping, inline code, icons, page layout.

export const SITE = {
  name: "CCAR-F Field Guide",
  short: "CCAR-F",
  exam: "Claude Certified Architect – Foundations",
  updated: "October 2026",
};

export const LANGS = ["en", "ar"];

export const DOMAINS = [
  { n: 1, weight: 27, color: "var(--d1)", icon: "network",
    title: { en: "Agentic Architecture & Orchestration", ar: "معمارية الوكلاء والتنسيق بينهم" },
    short: { en: "Orchestration", ar: "الوكلاء والتنسيق" } },
  { n: 2, weight: 18, color: "var(--d2)", icon: "plug",
    title: { en: "Tool Design & MCP Integration", ar: "تصميم الأدوات وربط MCP" },
    short: { en: "Tools & MCP", ar: "الأدوات وMCP" } },
  { n: 3, weight: 20, color: "var(--d3)", icon: "terminal",
    title: { en: "Claude Code Configuration & Workflows", ar: "إعدادات Claude Code وطريقة الشغل بيه" },
    short: { en: "Claude Code", ar: "Claude Code" } },
  { n: 4, weight: 20, color: "var(--d4)", icon: "braces",
    title: { en: "Prompt Engineering & Structured Output", ar: "هندسة البرومبت والمخرجات المنظّمة" },
    short: { en: "Prompts & Output", ar: "البرومبت والمخرجات" } },
  { n: 5, weight: 15, color: "var(--d5)", icon: "layers",
    title: { en: "Context Management & Reliability", ar: "إدارة السياق والاعتمادية" },
    short: { en: "Context & Reliability", ar: "السياق والاعتمادية" } },
];

// Interface text. Arabic is Egyptian colloquial on purpose; technical terms stay in English.
export const STR = {
  en: {
    nav: { home: "Home", notes: "Search", traps: "Exam Traps", cheat: "Cheat Tables", disclaimer: "Disclaimer" },
    tabs: { home: "Home", cheat: "Cheat tables", traps: "Traps", notes: "Search" },
    tabsLabel: "Sections of the site",
    toTop: "Back to top",
    skip: "Skip to content",
    themeBtn: "Switch between light and dark theme",
    langLabel: "Language",
    homeAria: "home",
    footer1: (exam) => `unofficial study notes for the ${exam} (CCAR-F) exam.`,
    footer2: `Not affiliated with or endorsed by Anthropic. Check the official documentation before relying on a detail. <a href="disclaimer.html">Read the disclaimer</a>.`,
  },
  ar: {
    nav: { home: "الرئيسية", notes: "بحث", traps: "مطبات الامتحان", cheat: "جداول المراجعة", disclaimer: "تنويه" },
    tabs: { home: "الرئيسية", cheat: "المراجعة", traps: "المطبات", notes: "بحث" },
    tabsLabel: "أقسام الموقع",
    toTop: "ارجع لفوق",
    skip: "روح للمحتوى على طول",
    themeBtn: "بدّل بين الوضع الفاتح والغامق",
    langLabel: "اللغة",
    homeAria: "الرئيسية",
    footer1: (exam) => `ملاحظات مذاكرة مش رسمية لامتحان ${exam} (CCAR-F).`,
    footer2: `مالوش علاقة بـ Anthropic ومش متعمد منها. ارجع للتوثيق الرسمي قبل ما تعتمد على أي تفصيلة. <a href="disclaimer.html">اقرا التنويه</a>.`,
    noticeTitle: "نصيحة قبل ما تكمّل:",
    noticeBody: "الامتحان بالإنجليزي، فالأحسن تذاكر من النسخة الإنجليزية وتستخدم زرار «ع» اللي جنب كل صف لما تحتاج ترجمة صف معيّن بس. كده هتتعوّد على المصطلحات زي ما هتشوفها في الامتحان بالظبط.",
    noticeEn: "كمّل بالإنجليزي",
    noticeStay: "تمام، هكمّل بالعربي",
  },
};

export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Escape, then turn `code` spans into <code>. In Arabic text, an English term in parentheses — e.g.
// "(Context rot)" — is wrapped in <bdi> so right-to-left layout doesn't reorder its pieces.
// A parenthetical that also holds Arabic words is left alone: forcing it left-to-right would scramble them.
const ARABIC = /[؀-ۿ]/;
const ARABIC_LETTER = /[ء-يٮ-ۓۺ-ۼ]/;
export const md = (s) => {
  const h = esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
  return ARABIC.test(h)
    ? h.replace(/\(([^()<>]*[A-Za-z][^()<>]*)\)/g, (m, inner) => (ARABIC_LETTER.test(inner) ? m : `<bdi class="iso">(${inner})</bdi>`))
    : h;
};

const P = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  circleCheck: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  circleX: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  loop: '<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
  network: '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 7.5V12m0 0-5.2 5.2M12 12l5.2 5.2"/>',
  filePlus: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M9 15h6M12 18v-6"/>',
  gate: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M10 6.5h4a2 2 0 0 1 2 2V14"/>',
  hook: '<circle cx="16" cy="3.8" r="1.6"/><path d="M16 5.4V13a5 5 0 0 1-10 0V9l-2.6 2.6"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
  gear: '<circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.5"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  doc: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  pencil: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/><path d="m15 5 4 4"/>',
  terminal: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m7 11 2-2-2-2M11 13h4"/>',
  bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/>',
  star: '<path d="M12 2l3.1 6.3 6.9 1-5 4.8 1.2 6.9L12 17.8 5.8 21 7 14.1 2 9.3l6.9-1z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  branch: '<path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  play: '<path d="M6 3l14 9-14 9z"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  braces: '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
  chart: '<path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  dollar: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
  headset: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  route: '<circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 9h18M3 15h18"/>',
  fork: '<path d="M16 3h5v5M8 3H3v5M12 22v-8.3a4 4 0 0 0-1.17-2.87L3 3M15 9l6-6"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  scale: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1ZM2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1ZM7 21h10M12 3v18M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  merge: '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  repeat: '<path d="m17 2 4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3"/>',
  plug: '<path d="M12 22v-5M9 8V2M15 8V2M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
  filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
  sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  gauge: '<path d="m12 14 4-4M3.34 19a10 10 0 1 1 17.32 0"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
};

export const icon = (name, cls = "") =>
  `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.info}</svg>`;

// The notes page is the site's search page, so it is labelled "Search" everywhere.
const NAV = [
  { href: "index.html", key: "home" },
  { href: "cheat-tables.html", key: "cheat" },
  { href: "traps.html", key: "traps" },
  { href: "notes.html", key: "notes" },
  { href: "disclaimer.html", key: "disclaimer" },
];
// Phones get a fixed bottom tab bar instead of the header links, so navigation is always one tap away.
const TABS = [
  { href: "index.html", key: "home", icon: "home" },
  { href: "cheat-tables.html", key: "cheat", icon: "table" },
  { href: "traps.html", key: "traps", icon: "alert" },
  { href: "notes.html", key: "notes", icon: "search" },
];

// English pages live at the site root, Arabic pages under ar/ with the same file names.
export function layout({ lang = "en", page, title, description, active, body, bodyClass = "" }) {
  const S = STR[lang];
  const up = lang === "ar" ? "../" : "";
  const enHref = lang === "en" ? page : `../${page}`;
  const arHref = lang === "en" ? `ar/${page}` : page;
  const fullTitle = title ? `${title} · ${SITE.name}` : SITE.name;
  const nav = NAV.map(
    (n) => `<li><a href="${n.href}"${n.key === active ? ' aria-current="page"' : ""}><span>${S.nav[n.key]}</span></a></li>`
  ).join("");
  const tabs = TABS.map(
    (t) => `<a href="${t.href}"${t.key === active ? ' aria-current="page"' : ""}>${icon(t.icon)}<span>${S.tabs[t.key]}</span></a>`
  ).join("");
  return `<!doctype html>
<html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#f6f8fa" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#010409" media="(prefers-color-scheme: dark)">
<link rel="alternate" hreflang="en" href="${enHref}">
<link rel="alternate" hreflang="ar" href="${arHref}">
<link rel="icon" href="${up}assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${up}assets/site.css">
<script>try{var t=localStorage.getItem("ccarf-theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ""}>
<a class="skip" href="#main">${S.skip}</a>
<header class="site-header">
  <div class="container">
    <a class="brand" href="index.html" aria-label="${SITE.name} ${S.homeAria}">
      <span class="brand-mark">${icon("network")}</span>
      <span dir="ltr">CCAR-F <small>Field Guide</small></span>
    </a>
    <nav class="main-nav" aria-label="Main"><ul>${nav}</ul></nav>
    <div class="lang-switch" role="group" aria-label="${S.langLabel}">
      <a href="${enHref}" lang="en" hreflang="en" data-lang-link="en"${lang === "en" ? ' aria-current="true"' : ""}>EN</a>
      <a href="${arHref}" lang="ar" hreflang="ar" data-lang-link="ar"${lang === "ar" ? ' aria-current="true"' : ""}>عربي</a>
    </div>
    <button class="theme-btn" type="button" data-theme-toggle aria-label="${S.themeBtn}">${icon("moon", "i-moon")}${icon("sun", "i-sun")}</button>
  </div>
</header>
${lang === "ar" ? `<div class="lang-notice" data-ar-notice hidden><div class="container"><div class="flash notice-flash" role="note">
  <p><strong>${S.noticeTitle}</strong> ${S.noticeBody}</p>
  <div class="notice-actions"><a class="btn btn-primary" href="${enHref}" data-lang-link="en">${S.noticeEn}</a><button type="button" class="btn" data-ar-notice-close>${S.noticeStay}</button></div>
</div></div></div>` : ""}
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="container">
    <div>
      <p><strong>${SITE.name}</strong> · ${S.footer1(SITE.exam)}</p>
      <p>${S.footer2}</p>
    </div>
    <nav aria-label="Footer"><ul>${NAV.slice(1).map((n) => `<li><a href="${n.href}">${S.nav[n.key]}</a></li>`).join("")}</ul></nav>
  </div>
</footer>
<nav class="tabbar" aria-label="${S.tabsLabel}">${tabs}</nav>
<button type="button" class="totop" data-totop aria-label="${S.toTop}" title="${S.toTop}" hidden>${icon("arrowUp")}</button>
<script src="${up}assets/site.js"></script>
</body>
</html>
`;
}
