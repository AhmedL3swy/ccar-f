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
     (#n-4-2, #t-4-2 or #d4) in the URL, and the filters (domain, search, row types) via sessionStorage. */
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

  /* ---------- Notes / Traps filtering ---------- */
  var page = $("[data-filter-page]");
  if (!page) return;

  var dbtns = $$(".dbtn[data-d]");
  var kindBtns = $$(".seg button[data-kind]");
  var search = $("#q");
  var countEl = $("[data-count]");
  var domains = $$(".domain", page);
  var emptyAll = $(".empty-all", page);
  var tocGroups = $$(".toc .tg[data-d]");
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
  }

  function setDomain(d) {
    state.d = d;
    dbtns.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.d === d ? "true" : "false"); });
    apply();
  }

  dbtns.forEach(function (b) {
    b.addEventListener("click", function () {
      setDomain(b.dataset.d);
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
    search.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(apply, 80); });
    search.addEventListener("keydown", function (e) { if (e.key === "Escape") { search.value = ""; apply(); } });
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== search && !/input|textarea|select/i.test(document.activeElement.tagName)) {
        e.preventDefault(); search.focus();
      }
    });
  }

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
      if (search && search.value) search.value = "";
      setDomain(dom.dataset.d);
    }
    if (scroll) el.scrollIntoView();
  }
  $$(".toc a[href^='#']").forEach(function (a) {
    a.addEventListener("click", function () { reveal(a.getAttribute("href"), false); });
  });
  window.addEventListener("hashchange", function () { reveal(location.hash, true); });

  /* ---------- "View summary" dialog (one shared <dialog>, filled from #sum-data) ---------- */
  var dlg = $("#sum-dialog");
  var sumData = null;
  try { sumData = JSON.parse(($("#sum-data") || {}).textContent || "null"); } catch (e) { sumData = null; }
  if (dlg && sumData) {
    var pageLang = root.getAttribute("lang") || "en";
    var otherLang = pageLang === "ar" ? "en" : "ar";
    var sumKey = null, sumAlt = false;
    var sumTrx = $("#sum-trx"), sumBody = $("#sum-body"), sumTitle = $("#sum-title"), sumLabel = $("#sum-label");
    var prefix = dlg.getAttribute("data-prefix");
    var renderSum = function () {
      var parts = sumKey.split(":"), dd = sumData[parts[0]];
      if (!dd) return;
      var D = sumAlt ? dd.alt : dd;
      var lang = sumAlt ? otherLang : pageLang;
      dlg.setAttribute("lang", lang);
      dlg.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
      dlg.style.setProperty("--c", dd.color);
      sumLabel.textContent = D.label;
      sumTrx.textContent = page.getAttribute(sumAlt ? "data-trx-on" : "data-trx-off");
      sumTrx.setAttribute("aria-pressed", sumAlt ? "true" : "false");
      if (parts.length > 1) {
        var t = dd.tasks[+parts[1]], T = sumAlt ? t.alt : t;
        sumTitle.innerHTML = '<span class="sum-code">' + t.code + "</span> " + T.task;
        sumBody.innerHTML = "<p>" + T.summary + "</p>";
      } else {
        sumTitle.innerHTML = D.title;
        sumBody.innerHTML = (D.intro ? '<p class="sum-intro">' + D.intro + "</p>" : "") +
          '<h3 class="sum-sub">' + dlg.getAttribute(sumAlt ? "data-alt-all" : "data-all") + "</h3>" +
          dd.tasks.map(function (t) {
            var T = sumAlt ? t.alt : t;
            return '<section class="sum-item"><h4><a href="#' + prefix + "-" + t.code.replace(".", "-") + '" data-sum-go><span class="sum-code">' + t.code + "</span> " + T.task + "</a></h4><p>" + T.summary + "</p></section>";
          }).join("");
      }
      sumBody.scrollTop = 0;
    };
    var openSum = function (key) {
      sumKey = key; sumAlt = false; renderSum();
      if (typeof dlg.showModal === "function") { if (!dlg.open) dlg.showModal(); } else { dlg.setAttribute("open", ""); }
    };
    var closeSum = function () { if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open"); };
    page.addEventListener("click", function (e) {
      var b = e.target.closest("[data-sum]");
      if (b) openSum(b.getAttribute("data-sum"));
    });
    $("#sum-close").addEventListener("click", closeSum);
    sumTrx.addEventListener("click", function () { sumAlt = !sumAlt; renderSum(); });
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) { closeSum(); return; } // click on the backdrop
      var go = e.target.closest("[data-sum-go]");
      if (go) { closeSum(); reveal(go.getAttribute("href"), false); } // the link then scrolls to the section
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
    setShort(store.get("ccarf-short") === "1", false);
    page.addEventListener("click", function (e) {
      var b = e.target.closest("[data-more]");
      if (b) b.closest("tr").classList.toggle("expanded");
    });
  }

  /* ---------- Translate a single row ---------- */
  var trxTitle = page.getAttribute("data-trx-title") || "";
  $$("[data-trx]", page).forEach(function (b) { b.title = trxTitle; b.setAttribute("aria-label", trxTitle); });
  page.addEventListener("click", function (e) {
    var b = e.target.closest("[data-trx]");
    if (!b) return;
    var row = b.closest("tr");
    var on = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.textContent = page.getAttribute(on ? "data-trx-on" : "data-trx-off");
    row.classList.toggle("translated", on);
    $$(".tx", row).forEach(function (t) { t.hidden = !t.hidden; });
  });

  /* ---------- Quiz mode (traps) ---------- */
  var quiz = $("#quiz");
  if (quiz) {
    var setQuiz = function (on) {
      page.classList.toggle("quiz", on);
      $$("tr.revealed", page).forEach(function (r) { r.classList.remove("revealed"); });
      store.set("ccarf-quiz", on ? "1" : "0");
    };
    quiz.addEventListener("change", function () { setQuiz(quiz.checked); });
    page.addEventListener("click", function (e) {
      if (!page.classList.contains("quiz") || e.target.closest("[data-trx]")) return;
      var row = e.target.closest("table.traps tbody tr");
      if (row) row.classList.toggle("revealed");
    });
    page.addEventListener("keydown", function (e) {
      if (!page.classList.contains("quiz")) return;
      if ((e.key === "Enter" || e.key === " ") && e.target.matches("table.traps tbody tr")) { e.preventDefault(); e.target.classList.toggle("revealed"); }
    });
    if (store.get("ccarf-quiz") === "1") { quiz.checked = true; setQuiz(true); }
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

  /* ---------- Start: restore filters carried over from the other language, then jump ---------- */
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
    apply();
  }
  if (location.hash) { reveal(location.hash, true); }
})();
