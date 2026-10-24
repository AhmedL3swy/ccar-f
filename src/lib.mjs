// Shared helpers for the CCAR-F Field Guide build: escaping, inline code, icons, the page shell.

export const SITE = {
  name: "CCAR-F Field Guide",
  exam: "Claude Certified Architect – Foundations",
};

export const DOMAINS = [
  { n: 1, weight: 27, color: "var(--d1)", title: "Agentic Architecture & Orchestration" },
  { n: 2, weight: 18, color: "var(--d2)", title: "Tool Design & MCP Integration" },
  { n: 3, weight: 20, color: "var(--d3)", title: "Claude Code Configuration & Workflows" },
  { n: 4, weight: 20, color: "var(--d4)", title: "Prompt Engineering & Structured Output" },
  { n: 5, weight: 15, color: "var(--d5)", title: "Context Management & Reliability" },
];

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
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  network: '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 7.5V12m0 0-5.2 5.2M12 12l5.2 5.2"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
};

export const icon = (name, cls = "") =>
  `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.info}</svg>`;

// The whole site is this one page: a header with the theme switch, the body, and a footer whose link opens the
// About pop-up. Everything else opens in pop-ups over it.
export function layout({ description, body, about }) {
  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(SITE.name)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(SITE.name)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#f6f8fa" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#010409" media="(prefers-color-scheme: dark)">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="assets/site.css">
<script>try{var t=localStorage.getItem("ccarf-theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="container">
    <span class="brand"><span class="brand-mark">${icon("network")}</span><span>CCAR-F <small>Field Guide</small></span></span>
    <a class="head-link" href="#about">${icon("info")}<span>About</span></a>
    <button class="theme-btn" type="button" data-theme-toggle aria-label="Switch between light and dark theme" title="Switch between light and dark theme">${icon("moon", "i-moon")}${icon("sun", "i-sun")}</button>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="container">
    <p><strong>${esc(SITE.name)}</strong> · unofficial study notes for the ${esc(SITE.exam)} (CCAR-F) exam. Not affiliated with or endorsed by Anthropic; check the official documentation before relying on a detail. <a href="#about">About &amp; disclaimer</a></p>
  </div>
</footer>
${about}
<button type="button" class="totop" data-totop aria-label="Back to top" title="Back to top" hidden>${icon("arrowUp")}</button>
<script src="assets/site.js"></script>
</body>
</html>
`;
}
