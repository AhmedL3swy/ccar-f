/* CCAR-F Field Guide — shared behaviour. Pages stay fully readable without JS. */
(function () {
  "use strict";
  var root = document.documentElement;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };
  var session = {
    take: function (k) { try { var v = window.sessionStorage.getItem(k); window.sessionStorage.removeItem(k); return v; } catch (e) { return null; } },
    set: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // While a dialog is open the page behind it is locked (html.modal-open), so scrolling only moves the dialog.
  var unlockIfClosed = function () { if (!$("dialog[open]")) root.classList.remove("modal-open"); };
  var showModal = function (d) {
    if (typeof d.showModal === "function") { if (!d.open) d.showModal(); } else { d.setAttribute("open", ""); }
    root.classList.add("modal-open");
    if (!d._unlock) { d._unlock = true; d.addEventListener("close", unlockIfClosed); } // Escape closes without our code
  };
  var closeModal = function (d) { if (typeof d.close === "function") d.close(); else d.removeAttribute("open"); unlockIfClosed(); };

  /* ---------- Theme toggle ---------- */
  function effectiveTheme() {
    var t = root.getAttribute("data-theme");
    if (t === "dark" || t === "light") return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  $$("[data-theme-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = effectiveTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      store.set("ccarf-theme", next);
    });
  });

  /* ---------- Language switch keeps your place ----------
     Both languages use the same file names and ids, so the switch carries the section in view
     (#n-4-2, #t-4-2, #c-4-2 or #d4) in the URL, and the filters (domain, search, row types) via sessionStorage. */
  var getAnchor = function () { return location.hash.replace(/^#/, ""); };
  var getCarry = null;
  $$("[data-lang-link]").forEach(function (a) {
    a.addEventListener("click", function () {
      var anchor = getAnchor();
      a.setAttribute("href", a.getAttribute("href").split("#")[0] + (anchor ? "#" + anchor : ""));
      try {
        if (getCarry) window.sessionStorage.setItem("ccarf-carry", JSON.stringify(getCarry()));
        if (a.dataset.langLink === "ar") window.sessionStorage.setItem("ccarf-ar-notice", "1");
      } catch (e) { /* storage blocked */ }
      store.set("ccarf-lang", a.dataset.langLink);
    });
  });

  /* ---------- Arabic pages: recommend studying in English (the exam is in English) ----------
     Shown every time someone switches to Arabic, and on a first visit straight to an Arabic page. */
  var notice = $("[data-ar-notice]");
  if (notice) {
    var force = false;
    try { force = window.sessionStorage.getItem("ccarf-ar-notice") === "1"; window.sessionStorage.removeItem("ccarf-ar-notice"); } catch (e) { force = true; }
    if (force || store.get("ccarf-ar-notice-seen") !== "1") notice.hidden = false;
    store.set("ccarf-ar-notice-seen", "1");
    var close = $("[data-ar-notice-close]", notice);
    if (close) close.addEventListener("click", function () { notice.hidden = true; });
  }

  /* ---------- Back to top (appears after scrolling down a while) ---------- */
  var toTop = $("[data-totop]");
  if (toTop) {
    var placeTop = function () {
      var hide = window.scrollY < window.innerHeight * 1.5;
      if (toTop.hidden !== hide) toTop.hidden = hide;
    };
    window.addEventListener("scroll", placeTop, { passive: true });
    placeTop();
    toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });
  }

  /* ---------- Getting to search ----------
     The notes page is the search page. Any link to it lands in its search box, and "/" on a page
     without a search box goes there too. */
  var search = $("#q");
  var onSearchPage = !!$('a[href="notes.html"][aria-current="page"]');
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href="notes.html"]');
    if (!a) return;
    if (onSearchPage && search) { e.preventDefault(); search.focus(); search.select(); }
    else session.set("ccarf-focus-q", "1");
  });
  if (!search) {
    document.addEventListener("keydown", function (e) {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || $("dialog[open]")) return;
      var el = document.activeElement;
      if (el && (/input|textarea|select/i.test(el.tagName) || el.isContentEditable)) return;
      e.preventDefault();
      session.set("ccarf-focus-q", "1");
      location.href = "notes.html";
    });
  }

  /* ---------- Translate one row or box ----------
     The button swaps the two .tx versions inside its row (or [data-trx-scope] box). Its labels live once on
     the nearest container with data-trx-on / data-trx-off / data-trx-title. */
  $$("[data-trx]").forEach(function (b) {
    var host = b.closest("[data-trx-title]");
    if (host) { b.title = host.getAttribute("data-trx-title"); b.setAttribute("aria-label", b.title); }
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-trx]");
    if (!b) return;
    var host = b.closest("[data-trx-on]"), scope = b.closest("[data-trx-scope]") || b.closest("tr");
    if (!host || !scope) return;
    var on = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.textContent = host.getAttribute(on ? "data-trx-on" : "data-trx-off");
    scope.classList.toggle("translated", on);
    $$(".tx", scope).forEach(function (t) { t.hidden = !t.hidden; });
  });

  /* ---------- Summary dialog (one shared <dialog>, filled from #sum-data) ----------
     data-sum is "d5" for a whole domain or a task code such as "5.1". */
  var onSumGo = null; // set on the notes / traps pages: shows a section the filters are hiding
  var dlg = $("#sum-dialog");
  var sumData = null;
  try { sumData = JSON.parse(($("#sum-data") || {}).textContent || "null"); } catch (e) { sumData = null; }
  if (dlg && sumData) {
    var pageLang = root.getAttribute("lang") || "en";
    var otherLang = pageLang === "ar" ? "en" : "ar";
    var sumKey = null, sumAlt = false;
    var sumTrx = $("#sum-trx"), sumBody = $("#sum-body"), sumTitle = $("#sum-title"), sumLabel = $("#sum-label");
    var prefix = dlg.getAttribute("data-prefix");
    var findSum = function (key) {
      if (/^d\d$/.test(key)) return { dd: sumData[key], task: null };
      var dd = sumData["d" + key.split(".")[0]];
      return { dd: dd, task: dd ? dd.tasks.filter(function (t) { return t.code === key; })[0] || null : null };
    };
    var renderSum = function () {
      var f = findSum(sumKey), dd = f.dd;
      var D = sumAlt ? dd.alt : dd;
      var lang = sumAlt ? otherLang : pageLang;
      dlg.setAttribute("lang", lang);
      dlg.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
      dlg.style.setProperty("--c", dd.color);
      sumLabel.textContent = D.label;
      sumTrx.textContent = dlg.getAttribute(sumAlt ? "data-trx-on" : "data-trx-off");
      sumTrx.setAttribute("aria-pressed", sumAlt ? "true" : "false");
      if (f.task) {
        var T = sumAlt ? f.task.alt : f.task;
        sumTitle.innerHTML = '<span class="sum-code">' + f.task.code + "</span> " + T.task;
        sumBody.innerHTML = T.summary;
      } else {
        sumTitle.innerHTML = D.title;
        sumBody.innerHTML = (D.intro ? '<p class="sum-intro">' + D.intro + "</p>" : "") +
          '<h3 class="sum-sub">' + dlg.getAttribute(sumAlt ? "data-alt-all" : "data-all") + "</h3>" +
          dd.tasks.map(function (t) {
            var T = sumAlt ? t.alt : t;
            return '<section class="sum-item"><h4><a href="#' + prefix + "-" + t.code.replace(".", "-") + '" data-sum-go><span class="sum-code">' + t.code + "</span> " + T.task + "</a></h4>" + T.summary + "</section>";
          }).join("");
      }
      sumBody.scrollTop = 0;
    };
    var openSum = function (key) {
      var f = findSum(key);
      if (!f.dd || (!/^d\d$/.test(key) && !f.task)) return;
      sumKey = key; sumAlt = false; renderSum();
      showModal(dlg);
    };
    // Cheat table pages: "#summary" in the URL (from the home page and the cheat tables index) opens the domain
    // summary; closing it drops the hash, so a refresh doesn't open it again.
    var dropSumHash = function () {
      if (location.hash === "#summary") { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* not allowed here */ } }
    };
    var closeSum = function () { closeModal(dlg); dropSumHash(); };
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-sum]");
      if (b) openSum(b.getAttribute("data-sum"));
    });
    $("#sum-close").addEventListener("click", closeSum);
    sumTrx.addEventListener("click", function () { sumAlt = !sumAlt; renderSum(); });
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) { closeSum(); return; } // click on the backdrop
      var go = e.target.closest("[data-sum-go]");
      if (go) { closeSum(); if (onSumGo) onSumGo(go.getAttribute("href")); } // the link then scrolls to the section
    });
    dlg.addEventListener("close", dropSumHash); // Escape key
    var defaultSum = dlg.getAttribute("data-default");
    if (defaultSum && location.hash === "#summary") openSum(defaultSum);
  }

  /* ---------- Cheat table pages: the pinned jump bar follows the scroll position ---------- */
  var sheet = $("[data-sheet]");
  if (sheet) {
    var jumpBar = $(".jumpbar", sheet);
    var jumpLinks = $$(".jumpbar a[href^='#']", sheet);
    var jumpTargets = jumpLinks.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
    // The first section that starts above the line and hasn't scrolled past it. Cards share rows on wide
    // screens, so this picks the row's first card; between sections it falls back to the last one started.
    var inView = function () {
      var line = jumpBar.getBoundingClientRect().bottom + 24, idx = -1, last = -1;
      jumpTargets.forEach(function (t, i) {
        if (!t) return;
        var r = t.getBoundingClientRect();
        if (r.top > line) return;
        last = i;
        if (idx < 0 && r.bottom > line) idx = i;
      });
      return idx >= 0 ? idx : last;
    };
    var current = -1, ticking = false;
    var follow = function () {
      ticking = false;
      var idx = inView();
      if (idx === current) return;
      if (current >= 0) jumpLinks[current].removeAttribute("aria-current");
      current = idx;
      if (idx < 0) return;
      var a = jumpLinks[idx], strip = a.parentNode;
      a.setAttribute("aria-current", "true");
      // On phones the bar scrolls sideways: bring the current chip into view.
      var ar = a.getBoundingClientRect(), sr = strip.getBoundingClientRect();
      if (ar.left < sr.left || ar.right > sr.right) strip.scrollBy({ left: ar.left - sr.left - (sr.width - ar.width) / 2, behavior: reduceMotion ? "auto" : "smooth" });
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; window.requestAnimationFrame(follow); } }, { passive: true });

    // Facts & terms is closed until its switch is turned on; the choice is remembered. Following a link into
    // the section (jump bar, language switch) opens it without changing the remembered choice.
    var facts = $("details#facts", sheet), linkOpened = false;
    var openFacts = function (target) {
      if (!facts || !target || !facts.contains(target) || facts.open) return;
      linkOpened = true;
      facts.open = true;
    };
    if (facts) {
      if (store.get("ccarf-ft") === "1") facts.open = true;
      facts.addEventListener("toggle", function () {
        if (!linkOpened) store.set("ccarf-ft", facts.open ? "1" : "0");
        linkOpened = false;
      });
    }
    jumpLinks.forEach(function (a, i) { a.addEventListener("click", function () { openFacts(jumpTargets[i]); }); });
    var hashTarget = location.hash.length > 1 ? document.getElementById(location.hash.slice(1)) : null;
    if (hashTarget && facts && facts.contains(hashTarget) && !facts.open) {
      openFacts(hashTarget);
      window.requestAnimationFrame(function () { hashTarget.scrollIntoView(); });
    }
    follow();
    getAnchor = function () {
      if (dlg && dlg.open) return "summary";
      var i = inView();
      return i >= 0 ? jumpLinks[i].getAttribute("href").slice(1) : "";
    };
  }

  /* ---------- Notes / Traps filtering ---------- */
  var page = $("[data-filter-page]");
  if (!page) return;

  var dbtns = $$(".dbtn[data-d]");
  var kindBtns = $$(".seg button[data-kind]");
  var countEl = $("[data-count]");
  var domains = $$(".domain", page);
  var emptyAll = $(".empty-all", page);
  var tocGroups = $$(".toc .tg[data-d]", page);
  var side = $(".side", page);
  var filtersBtn = $("[data-side-filters]", page);
  var state = { d: "all", kinds: {} };
  kindBtns.forEach(function (b) { state.kinds[b.dataset.kind] = b.getAttribute("aria-pressed") === "true"; });

  // Search text = the row's content only; button labels ("EN", "More"…) and the "In short" tag are left out.
  var rows = $$("[data-row]", page);
  rows.forEach(function (r) {
    var c = r.cloneNode(true);
    $$("button, .short-tag", c).forEach(function (n) { n.parentNode.removeChild(n); });
    r._txt = c.textContent.toLowerCase();
  });

  function kindOn(kind) {
    if (!kindBtns.length) return true;
    if (kind === "concept") kind = "note";
    return state.kinds[kind] !== false;
  }

  // Matches are highlighted with the CSS Custom Highlight API, which leaves the page's HTML untouched.
  // Browsers without it simply show no highlight.
  var canMark = !!(window.CSS && CSS.highlights && window.Highlight);
  function mark(terms) {
    if (!canMark) return;
    CSS.highlights.delete("q");
    terms = terms.filter(function (w) { return w.length > 1; });
    if (!terms.length) return;
    var hl = new window.Highlight(), count = 0;
    for (var i = 0; i < rows.length && count < 2000; i++) {
      if (rows[i].hidden) continue;
      var walk = document.createTreeWalker(rows[i], NodeFilter.SHOW_TEXT), node;
      while ((node = walk.nextNode()) && count < 2000) {
        if (node.parentNode.closest("button")) continue;
        var txt = node.data.toLowerCase();
        for (var j = 0; j < terms.length; j++) {
          for (var at = txt.indexOf(terms[j]); at !== -1; at = txt.indexOf(terms[j], at + terms[j].length)) {
            var rg = document.createRange();
            rg.setStart(node, at);
            rg.setEnd(node, at + terms[j].length);
            hl.add(rg);
            count++;
          }
        }
      }
    }
    CSS.highlights.set("q", hl);
  }

  function apply() {
    var terms = (search ? search.value : "").toLowerCase().trim().split(/\s+/).filter(Boolean);
    var shown = 0, total = 0;
    rows.forEach(function (r) {
      var counted = r.dataset.kind !== "tip";
      if (counted) total++;
      var ok = (state.d === "all" || r.dataset.d === state.d) && kindOn(r.dataset.kind) &&
        terms.every(function (w) { return r._txt.indexOf(w) !== -1; });
      r.hidden = !ok;
      if (ok && counted) shown++;
    });
    var anyDomain = false;
    domains.forEach(function (dom) {
      var anyTask = false;
      $$(".task", dom).forEach(function (t) {
        var vis = false;
        $$(".Box, .tips", t).forEach(function (block) {
          var any = $$("[data-row]", block).some(function (r) { return !r.hidden; });
          block.hidden = !any;
          if (any) vis = true;
        });
        t.hidden = !vis;
        if (vis) anyTask = true;
      });
      dom.hidden = !anyTask;
      if (anyTask) anyDomain = true;
    });
    tocGroups.forEach(function (g) { g.hidden = !(state.d === "all" || g.dataset.d === state.d); });
    if (emptyAll) emptyAll.hidden = anyDomain;
    if (countEl) {
      var tpl = countEl.getAttribute("data-count-tpl") || "{shown} of {total} shown";
      countEl.textContent = tpl.replace("{shown}", shown).replace("{total}", total);
    }
    if (filtersBtn) {
      var narrowed = state.d !== "all" || kindBtns.some(function (b) { return state.kinds[b.dataset.kind] === false; });
      filtersBtn.classList.toggle("narrowed", narrowed);
    }
    mark(terms);
  }

  // The search stays in the URL (?q=…), so a refresh or a shared link shows the same results.
  function keepQuery() {
    if (!search || !window.URL) return;
    try {
      var u = new URL(location.href), q = search.value.trim();
      if (q) u.searchParams.set("q", q); else u.searchParams.delete("q");
      history.replaceState(null, "", u.pathname + u.search + u.hash);
    } catch (e) { /* not allowed here */ }
  }

  function setDomain(d) {
    state.d = d;
    dbtns.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.d === d ? "true" : "false"); });
    apply();
  }

  function setFiltersOpen(open) {
    if (!side || !filtersBtn) return;
    side.classList.toggle("open", open);
    filtersBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (filtersBtn) filtersBtn.addEventListener("click", function () { setFiltersOpen(!side.classList.contains("open")); });

  dbtns.forEach(function (b) {
    b.addEventListener("click", function () {
      setDomain(b.dataset.d);
      setFiltersOpen(false);
      // Keep the choice in the URL so a refresh or a shared link opens the same domain.
      try { history.replaceState(null, "", b.dataset.d === "all" ? location.pathname + location.search : "#d" + b.dataset.d); } catch (e) { /* not allowed here */ }
      var top = $(".layout");
      if (top && window.scrollY > top.offsetTop) window.scrollTo({ top: top.offsetTop - 70 });
    });
  });
  kindBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var on = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", on ? "true" : "false");
      state.kinds[b.dataset.kind] = on;
      apply();
    });
  });
  if (search) {
    var timer;
    // Touch screens have no "/" shortcut, so drop the "(press /)" hint from the placeholder.
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) search.placeholder = search.placeholder.replace(/\s*\([^()]*\/\)\s*$/, "");
    search.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { apply(); keepQuery(); }, 80); });
    search.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { search.value = ""; apply(); keepQuery(); }
      if (e.key === "Enter" && window.matchMedia && window.matchMedia("(pointer: coarse)").matches) search.blur(); // phones: close the keyboard to see the results
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== search && !/input|textarea|select/i.test(document.activeElement.tagName) && !$("dialog[open]")) {
        e.preventDefault(); search.focus();
      }
    });
  }
  // "Try" suggestions under the title fill the search box.
  $$("[data-q]", page).forEach(function (b) {
    b.addEventListener("click", function () {
      if (!search) return;
      search.value = b.getAttribute("data-q");
      apply(); keepQuery();
    });
  });

  /* Deep links: #d2 shows Domain 2; a task anchor switches to its domain if it is filtered out. */
  function reveal(hash, scroll) {
    var id = (hash || "").replace(/^#/, "");
    if (!id) return;
    var m = /^d([1-5])$/.exec(id);
    if (m) { setDomain(m[1]); return; }
    var el = document.getElementById(id);
    if (!el) return;
    var dom = el.closest(".domain");
    if (dom && (dom.hidden || el.hidden)) {
      if (search && search.value) { search.value = ""; keepQuery(); }
      setDomain(dom.dataset.d);
    }
    if (scroll) el.scrollIntoView();
  }
  onSumGo = function (href) { reveal(href, false); };
  $$(".toc a[href^='#']", page).forEach(function (a) {
    a.addEventListener("click", function () { reveal(a.getAttribute("href"), false); });
  });
  window.addEventListener("hashchange", function () { reveal(location.hash, true); });

  /* ---------- Sections: phones and tablets hide the sidebar task list; this button shows it in a dialog ---------- */
  var tocDlg = $("#toc-dialog"), tocBody = $("#toc-body"), toc = $(".toc", page), sectionsBtn = $("[data-side-sections]", page);
  if (tocDlg && tocBody && toc && sectionsBtn) {
    sectionsBtn.addEventListener("click", function () {
      var copy = toc.cloneNode(true);
      $$("[hidden]", copy).forEach(function (g) { g.hidden = false; }); // list every domain; picking a task reveals it
      tocBody.innerHTML = "";
      tocBody.appendChild(copy);
      showModal(tocDlg);
    });
    tocDlg.addEventListener("click", function (e) {
      if (e.target === tocDlg || e.target.closest("[data-close]")) { closeModal(tocDlg); return; }
      var a = e.target.closest("a[href^='#']");
      if (a) { closeModal(tocDlg); setFiltersOpen(false); reveal(a.getAttribute("href"), false); } // the link then scrolls
    });
  }

  /* ---------- Notes: "short notes only" switch + per-row More/Less ---------- */
  var shortToggles = $$("[data-short-toggle]", page);
  if (shortToggles.length) {
    var setShort = function (on, save) {
      page.classList.toggle("short-only", on);
      shortToggles.forEach(function (t) { t.checked = on; });
      if (!on) $$("tr.expanded", page).forEach(function (r) { r.classList.remove("expanded"); });
      if (save) store.set("ccarf-short", on ? "1" : "0");
    };
    shortToggles.forEach(function (t) { t.addEventListener("change", function () { setShort(t.checked, true); }); });
    setShort(store.get("ccarf-short") !== "0", false); // on by default; full notes stay one tap away (More)
    page.addEventListener("click", function (e) {
      var b = e.target.closest("[data-more]");
      if (b) b.closest("tr").classList.toggle("expanded");
    });
  }

  /* ---------- Quiz mode (traps) ----------
     "Why it's wrong" and "What's actually true" reveal separately, so you can check one without seeing the other.
     The trap cell (or Enter on the row) reveals or hides both at once. */
  var quizToggles = $$("[data-quiz-toggle]", page);
  if (quizToggles.length) {
    var answerCells = $$("table.traps td.whycol, table.traps td.fixcol", page);
    var setQuiz = function (on) {
      page.classList.toggle("quiz", on);
      quizToggles.forEach(function (t) { t.checked = on; });
      answerCells.forEach(function (c) {
        c.classList.remove("revealed");
        if (on) c.setAttribute("tabindex", "0"); else c.removeAttribute("tabindex");
      });
      store.set("ccarf-quiz", on ? "1" : "0");
    };
    var revealAnswer = function (row, cell) {
      if (cell) { cell.classList.toggle("revealed"); return; }
      var cells = $$("td.whycol, td.fixcol", row);
      var show = cells.some(function (c) { return !c.classList.contains("revealed"); });
      cells.forEach(function (c) { c.classList.toggle("revealed", show); });
    };
    quizToggles.forEach(function (t) { t.addEventListener("change", function () { setQuiz(t.checked); }); });
    page.addEventListener("click", function (e) {
      if (!page.classList.contains("quiz") || e.target.closest("[data-trx]")) return;
      var row = e.target.closest("table.traps tbody tr");
      if (row) revealAnswer(row, e.target.closest("td.whycol, td.fixcol"));
    });
    page.addEventListener("keydown", function (e) {
      if (!page.classList.contains("quiz") || (e.key !== "Enter" && e.key !== " ")) return;
      var t = e.target;
      if (t.matches("table.traps tbody tr")) { e.preventDefault(); revealAnswer(t, null); }
      else if (t.matches("table.traps td.whycol, table.traps td.fixcol")) { e.preventDefault(); revealAnswer(t.closest("tr"), t); }
    });
    if (store.get("ccarf-quiz") === "1") setQuiz(true);
  }

  /* ---------- Where am I? (used by the language switch) ---------- */
  getAnchor = function () {
    var line = 150; // px below the top of the window: sticky header + domain heading
    var current = null;
    $$(".task", page).forEach(function (t) {
      if (!t.hidden && !t.closest("[hidden]") && t.getBoundingClientRect().top <= line) current = t;
    });
    if (current) return current.id;
    return state.d !== "all" ? "d" + state.d : "";
  };
  getCarry = function () { return { d: state.d, q: search ? search.value : "", kinds: state.kinds }; };

  /* ---------- Start: restore filters carried over from the other language (or ?q=), then jump ---------- */
  var carried = null;
  try {
    carried = JSON.parse(window.sessionStorage.getItem("ccarf-carry") || "null");
    window.sessionStorage.removeItem("ccarf-carry");
  } catch (e) { carried = null; }
  if (carried) {
    if (search && typeof carried.q === "string") search.value = carried.q;
    kindBtns.forEach(function (b) {
      if (carried.kinds && b.dataset.kind in carried.kinds) {
        var on = carried.kinds[b.dataset.kind] !== false;
        b.setAttribute("aria-pressed", on ? "true" : "false");
        state.kinds[b.dataset.kind] = on;
      }
    });
    setDomain(/^(all|[1-5])$/.test(carried.d) ? carried.d : "all");
  } else {
    var q = null;
    try { q = new URLSearchParams(location.search).get("q"); } catch (e) { q = null; }
    if (search && q) search.value = q;
    apply();
  }
  if (search && search.value) keepQuery();
  if (location.hash) { reveal(location.hash, true); }
  if (search && session.take("ccarf-focus-q") === "1") search.focus({ preventScroll: true });
})();
