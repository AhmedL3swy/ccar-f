/* CCAR-F Field Guide — shared behaviour. Pages stay fully readable without JS. */
(function () {
  "use strict";
  var root = document.documentElement;
  var siteJs = (document.currentScript || {}).src || location.href; // for finding assets/pop/ from any page
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
    // The cheat tables index lists every domain but holds none of their cards: its links go to each domain's page.
    var linkPage = dlg.getAttribute("data-link-page") || "";
    var sectionHref = function (code) { return linkPage.replace("{n}", code.split(".")[0]) + "#" + prefix + "-" + code.replace(".", "-"); };
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
            return '<section class="sum-item"><h4><a href="' + sectionHref(t.code) + '" data-sum-go><span class="sum-code">' + t.code + "</span> " + T.task + "</a></h4>" + T.summary + "</section>";
          }).join("");
      }
      sumBody.scrollTop = 0;
    };
    var openSum = function (key) {
      var f = findSum(key);
      if (!f.dd || (!/^d\d$/.test(key) && !f.task)) return false;
      sumKey = key; sumAlt = false; renderSum();
      showModal(dlg);
      return true;
    };
    // Cheat table pages: "#summary" in the URL (from the home page) opens the domain
    // summary; closing it drops the hash, so a refresh doesn't open it again.
    var dropSumHash = function () {
      if (location.hash === "#summary") { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* not allowed here */ } }
    };
    var closeSum = function () { closeModal(dlg); dropSumHash(); };
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-sum]");
      // A Summary link (cheat tables index) opens the dialog here instead of following its no-JS fallback href.
      if (b && openSum(b.getAttribute("data-sum"))) e.preventDefault();
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

  /* ---------- Pop-up content, loaded on first use ----------
     The decision table dialogs and the plan page's study pop-up carry no rows in the page: the build writes each
     domain's content to assets/pop/<lang>-d<n>.js, which sets CCARF_POP[n]. A script tag (not fetch) loads it, so
     it also works on pages opened straight from disk. #pop-text holds the labels for what's built here. */
  var popText = {};
  try { popText = JSON.parse(($("#pop-text") || {}).textContent || "{}"); } catch (e) { popText = {}; }
  var popWaiting = {};
  var loadPop = function (n, done) {
    var got = window.CCARF_POP && window.CCARF_POP[n];
    if (got) { done(got); return; }
    if (popWaiting[n]) { popWaiting[n].push(done); return; }
    popWaiting[n] = [done];
    var s = document.createElement("script");
    var finish = function () {
      var list = popWaiting[n], data = (window.CCARF_POP && window.CCARF_POP[n]) || null;
      delete popWaiting[n];
      list.forEach(function (cb) { cb(data); });
    };
    s.onload = finish;
    s.onerror = function () { s.parentNode.removeChild(s); finish(); }; // a later open tries again
    s.src = new URL("pop/" + (root.getAttribute("lang") || "en") + "-d" + n + ".js", siteJs).href;
    document.head.appendChild(s);
  };
  var popEsc = function (t) { var d = document.createElement("div"); d.textContent = t == null ? "" : t; return d.innerHTML; };
  var popNote = function (t) { return '<p class="pop-note">' + popEsc(t) + "</p>"; };
  var quizSwitch = function () { return '<label class="toggle dq-toggle"><input type="checkbox" data-dq> ' + popEsc(popText.quiz) + "</label>"; };
  var tableHead = function (cols) {
    return "<thead><tr>" + cols.map(function (c) { return "<th>" + popEsc(c) + "</th>"; }).join("") + '<th class="trx"><span class="sr-only">' + popEsc(popText.trxTh) + "</span></th></tr></thead>";
  };

  /* ---------- Decision table: quiz mode and task chips on the page and in its dialogs (cheat tables and index) ----------
     Quiz mode hides every usual answer until its row is tapped (or Enter on the row); the switch is shared by
     every copy on the page (and the plan page's pop-up), and remembered. The chips (data-dc-pick) show one task
     statement's rows or all of them. Each domain has its own dialog (data-dc-dialog="1"; the index holds all five),
     filled on first open. data-decide-pop="d1" opens it on all rows and "1.3" on one task; "#decisions" (a cheat
     table's own), "#dc-1" or "#dc-1-3" opens it on load. */
  var dcDlgs = $$("[data-dc-dialog]");
  // Traps left the cheat tables: an old link or bookmark to a cheat table's traps goes to the traps page instead.
  var sheetN = ($("[data-sheet]") || { getAttribute: function () { return ""; } }).getAttribute("data-sheet");
  var oldTraps = /^#(?:traps|tr-(\d-\d))$/.exec(location.hash);
  if (sheetN && oldTraps) { location.replace("traps.html#" + (oldTraps[1] ? "t-" + oldTraps[1] : "d" + sheetN)); return; }
  var dcKey = function (host) {
    var b = $("[data-dc-pick][aria-pressed='true']", host);
    return b ? b.getAttribute("data-dc-pick") : "all";
  };
  var dcPick = function (host, key) {
    if (!$("[data-dc-pick='" + key + "']", host)) key = "all";
    $$("[data-dc-pick]", host).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-dc-pick") === key ? "true" : "false"); });
    $$("tbody[data-dc]", host).forEach(function (g) { g.hidden = key !== "all" && g.getAttribute("data-dc") !== key; });
  };
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-dc-pick]");
    if (b) dcPick(b.closest("[data-dq-host]"), b.getAttribute("data-dc-pick"));
  });
  var dqOn = store.get("ccarf-dq") === "1";
  var setDq = function (on) {
    dqOn = on;
    $$("[data-dq-host]").forEach(function (h) {
      h.classList.toggle("quiz", on);
      $$("td.a, td.whycol, td.fixcol", h).forEach(function (c) { c.classList.remove("revealed"); });
    });
    $$("[data-dq]").forEach(function (t) { t.checked = on; });
  };
  document.addEventListener("change", function (e) {
    if (!e.target.matches("[data-dq]")) return;
    setDq(e.target.checked);
    store.set("ccarf-dq", e.target.checked ? "1" : "0");
  });
  // A data row (not a task heading or the "Facts & terms" sub-heading) in a host with quiz mode on.
  var dqRow = function (e) {
    var row = e.target.closest("table.decide tbody tr[tabindex]"), host = row && row.closest("[data-dq-host]");
    return host && host.classList.contains("quiz") && !e.target.closest("button, a") ? row : null;
  };
  document.addEventListener("click", function (e) {
    var row = dqRow(e);
    if (row) $("td.a", row).classList.toggle("revealed");
  });
  document.addEventListener("keydown", function (e) {
    if ((e.key !== "Enter" && e.key !== " ") || !e.target.matches("table.decide tbody tr[tabindex]")) return;
    var row = dqRow(e);
    if (row) { e.preventDefault(); $("td.a", row).classList.toggle("revealed"); }
  });
  setDq(dqOn);

  // A decision table dialog's switch, chips and table, built from the domain's pop-up content on first open.
  var fillDecide = function (d) {
    if (d._filled) return;
    d._filled = true;
    var slot = $("[data-dc-slot]", d);
    slot.innerHTML = popNote(popText.loading);
    loadPop(d.getAttribute("data-dc-dialog"), function (P) {
      if (!P) { d._filled = false; slot.innerHTML = popNote(popText.failed); return; }
      var tasks = P.tasks.filter(function (t) { return t.nDc; });
      var pick = function (key, label, k) {
        return '<button type="button" data-dc-pick="' + key + '" aria-pressed="false">' + label + ' <span class="Counter">' + k + "</span></button>";
      };
      var total = tasks.reduce(function (a, t) { return a + t.nDc; }, 0);
      slot.innerHTML = '<div class="dc-tools">' + quizSwitch() + '<div class="seg dc-picks" role="group" aria-label="' + popEsc(popText.dcPicks) + '">' +
        pick("all", popEsc(popText.all), total) + tasks.map(function (t) { return pick(t.code, t.code, t.nDc); }).join("") + "</div></div>" +
        '<div class="Box"><div class="tscroll"><table class="gh stack decide">' + tableHead(popText.decideTh || []) +
        tasks.map(function (t) {
          return '<tbody data-dc="' + t.code + '"><tr class="dc-h"><th colspan="3"><span class="code">' + t.code + "</span> " + t.task + "</th></tr>" + t.dc + "</tbody>";
        }).join("") + "</table></div></div>";
      $$("[data-dq]", slot).forEach(function (t) { t.checked = dqOn; });
      dcPick(d, d._want || "all");
      bmMarks();
    });
  };
  // The open decision table dialog, if any (the language switch carries it over as #dc-1 or #dc-1-3).
  var dcOpen = function () { return dcDlgs.filter(function (d) { return d.open; })[0] || null; };
  if (dcDlgs.length) {
    var dcHash = /^#(?:decisions|dc-(\d)(?:-(\d))?)$/;
    var dropDcHash = function () {
      if (dcHash.test(location.hash)) { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* not allowed here */ } }
    };
    // key: "d1" (all rows), "1.3" (one task) or "" (the page's own domain).
    var openDecide = function (key) {
      var n = /^d?(\d)/.exec(key || "");
      var d = n ? dcDlgs.filter(function (x) { return x.getAttribute("data-dc-dialog") === n[1]; })[0] : dcDlgs[0];
      if (!d) return false;
      d._want = /^\d\.\d$/.test(key) ? key : "all";
      dcPick(d, d._want);
      showModal(d);
      fillDecide(d);
      $(".sum-body", d).scrollTop = 0;
      return true;
    };
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-decide-pop]");
      if (b && openDecide(b.getAttribute("data-decide-pop"))) e.preventDefault(); // the href is the no-JS fallback
    });
    dcDlgs.forEach(function (d) {
      d.addEventListener("click", function (e) {
        if (e.target === d || e.target.closest("[data-dc-close]")) { closeModal(d); dropDcHash(); } // backdrop or close button
      });
      d.addEventListener("close", dropDcHash); // Escape key
    });
    var dcAt = dcHash.exec(location.hash);
    if (dcAt) openDecide(!dcAt[1] ? "" : dcAt[2] ? dcAt[1] + "." + dcAt[2] : "d" + dcAt[1]);
  }

  /* ---------- Cheat tables (index and each table): the pinned jump bar follows the scroll position ---------- */
  var sheet = $("[data-jump]");
  if (sheet) {
    var jumpBar = $(".jumpbar", sheet);
    var jumpLinks = $$(".jumpbar a[href^='#']", sheet);
    var jumpTargets = jumpLinks.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
    // Sections inside a closed fold aren't laid out, so they never count as being in view.
    var shown = function (t) { return t && !(t.parentNode.closest && t.parentNode.closest("details:not([open])")); };
    // The first section that starts above the line and hasn't scrolled past it. Cards share rows on wide
    // screens, so this picks the row's first card; between sections it falls back to the last one started.
    // At the very bottom the last sections can't reach the line, so the last one showing on screen counts.
    var inView = function () {
      if (window.innerHeight + window.scrollY >= root.scrollHeight - 2) {
        for (var k = jumpTargets.length - 1; k >= 0; k--) if (shown(jumpTargets[k]) && jumpTargets[k].getBoundingClientRect().top < window.innerHeight) return k;
      }
      // Below the bar, and at least as low as where a followed link lands (scroll-padding-top), so it counts.
      var pad = parseFloat(window.getComputedStyle(root).scrollPaddingTop) || 0;
      var line = Math.max(jumpBar.getBoundingClientRect().bottom + 24, pad + 8), idx = -1, last = -1;
      jumpTargets.forEach(function (t, i) {
        if (!shown(t)) return;
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

    // Comparisons and facts & terms fold away behind a switch (<details data-fold>), closed until it is turned on;
    // each switch is remembered across pages and visits. Following a link into a closed section
    // (jump bar, summary, language switch) opens it without changing the remembered choice.
    var folds = $$("details[data-fold]", sheet), linkOpened = null;
    var foldKey = function (f) { return "ccarf-fold-" + f.getAttribute("data-fold"); };
    folds.forEach(function (f) {
      var saved = store.get(foldKey(f));
      if (saved === null && f.id === "facts") saved = store.get("ccarf-ft"); // the facts switch's earlier key
      if (saved === "1" || saved === "0") f.open = saved === "1";
      f.addEventListener("toggle", function () {
        if (linkOpened !== f) store.set(foldKey(f), f.open ? "1" : "0");
        linkOpened = null;
      });
    });
    var openFor = function (target) {
      if (!target) return false;
      var opened = false;
      folds.forEach(function (f) { if (!f.open && f.contains(target)) { linkOpened = f; f.open = true; opened = true; } });
      return opened;
    };
    // Runs before the browser follows the link, so the target is laid out by the time it scrolls there.
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[href^='#']");
      if (a && a.getAttribute("href").length > 1) openFor(document.getElementById(a.getAttribute("href").slice(1)));
    });
    var hashTarget = location.hash.length > 1 ? document.getElementById(location.hash.slice(1)) : null;
    if (openFor(hashTarget)) window.requestAnimationFrame(function () { hashTarget.scrollIntoView(); });
    follow();
    getAnchor = function () {
      if (dlg && dlg.open && dlg.getAttribute("data-default")) return "summary";
      var dc = dcOpen();
      if (dc) return "dc-" + (dcKey(dc) === "all" ? dc.getAttribute("data-dc-dialog") : dcKey(dc).replace(".", "-"));
      var i = inView();
      return i >= 0 ? jumpLinks[i].getAttribute("href").slice(1) : "";
    };
  }

  /* ---------- Bookmarks ----------
     Rows with data-bm-id (decision tables, traps, notes) have a bookmark button. Saving keeps a copy of the
     row's cells in localStorage, newest first, so the bookmarks page can list them without loading other pages. */
  var BM_KEY = "ccarf-bookmarks";
  var pageLang = root.getAttribute("lang") || "en";
  var bmList = function () {
    try { var v = JSON.parse(store.get(BM_KEY) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  };
  var bmSave = function (list) { store.set(BM_KEY, JSON.stringify(list)); bmMarks(); };
  var bmMarks = function () {
    var list = bmList(), ids = {};
    list.forEach(function (b) { ids[b.id] = true; });
    $$("[data-bm-id]").forEach(function (r) {
      var b = $("[data-bm]", r);
      if (b) b.setAttribute("aria-pressed", ids[r.getAttribute("data-bm-id")] ? "true" : "false");
    });
    $$("[data-bm-count]").forEach(function (c) { c.textContent = list.length; c.hidden = !list.length; });
  };
  // The cells as first shown (the page's own language), without buttons.
  var bmCells = function (row) {
    return $$("td", row).filter(function (td) { return !td.classList.contains("trx"); }).map(function (td) {
      var c = td.cloneNode(true);
      $$("button", c).forEach(function (n) { n.parentNode.removeChild(n); });
      $$(".tx", c).forEach(function (t) { t.hidden = t.hasAttribute("lang"); });
      return c.innerHTML;
    });
  };
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-bm]"), row = b && b.closest("[data-bm-id]");
    if (!row) return;
    var id = row.getAttribute("data-bm-id"), list = bmList();
    var rest = list.filter(function (x) { return x.id !== id; });
    if (rest.length === list.length) {
      rest.unshift({
        id: id, kind: row.getAttribute("data-bm-kind"), href: row.getAttribute("data-bm-href"),
        ctx: row.getAttribute("data-bm-ctx"), ctxAlt: row.getAttribute("data-bm-ctx-alt"), cells: bmCells(row), lang: pageLang, at: Date.now()
      });
    }
    bmSave(rest);
  });
  window.addEventListener("storage", function (e) { if (e.key === BM_KEY) { bmMarks(); if (bmRender) bmRender(); } });
  var bmRender = null;
  bmMarks();

  // The bookmarks page: a list filtered by group (all, traps, decisions, notes & facts); the choice is remembered.
  var bmPage = $("[data-bm-page]");
  if (bmPage) {
    var bmText = {};
    try { bmText = JSON.parse(($("#bm-text") || {}).textContent || "{}"); } catch (e) { bmText = {}; }
    var bmListEl = $("[data-bm-list]", bmPage), bmEmpty = $("[data-bm-empty]", bmPage), bmClear = $("[data-bm-clear]", bmPage);
    var bmGroupBtns = $$("[data-bm-group]", bmPage);
    var groupOf = function (kind) { return kind === "trap" || kind === "decide" ? kind : "note"; };
    var bmGroup = store.get("ccarf-bm-group") || "all";
    var labelsFor = function (kind) {
      if (kind === "trap") return bmText.trapsTh || [];
      if (kind === "decide") return bmText.decideTh || [];
      return [];
    };
    var esc = function (s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; };
    // A bookmark saved on the other language's page: show this page's language first, like the rows here.
    var swapLang = function (el, savedLang) {
      if (savedLang === pageLang) return;
      $$(".tx", el).forEach(function (t) {
        if (t.hasAttribute("lang")) { t.removeAttribute("lang"); t.removeAttribute("dir"); t.hidden = false; }
        else { t.setAttribute("lang", savedLang); t.setAttribute("dir", savedLang === "ar" ? "rtl" : "ltr"); t.hidden = true; }
      });
    };
    bmRender = function () {
      var list = bmList(), counts = { all: list.length, trap: 0, decide: 0, note: 0 };
      list.forEach(function (b) { counts[groupOf(b.kind)]++; });
      if (!(bmGroup in counts) || (bmGroup !== "all" && !counts[bmGroup])) bmGroup = "all";
      bmGroupBtns.forEach(function (g) {
        var k = g.getAttribute("data-bm-group");
        g.setAttribute("aria-pressed", k === bmGroup ? "true" : "false");
        g.hidden = k !== "all" && !counts[k];
        $("[data-bm-n]", g).textContent = counts[k];
      });
      var shown = list.filter(function (b) { return bmGroup === "all" || groupOf(b.kind) === bmGroup; });
      var trxOff = bmPage.getAttribute("data-trx-off"), trxTitle = bmPage.getAttribute("data-trx-title");
      bmListEl.innerHTML = shown.map(function (b) {
        var labels = labelsFor(b.kind), dual = (b.cells || []).some(function (c) { return c.indexOf('class="tx"') !== -1; });
        return '<article class="Box bm-item bm-' + esc(b.kind) + '" data-trx-scope data-id="' + esc(b.id) + '">' +
          '<header class="bm-h"><span class="kind bm-kind">' + esc((bmText.kinds || {})[b.kind] || b.kind) + "</span>" +
          '<a href="' + esc(b.href) + '">' + esc(b.lang !== pageLang && b.ctxAlt ? b.ctxAlt : b.ctx) + "</a>" +
          '<div class="row-acts">' + (dual ? '<button type="button" class="trx-btn" data-trx aria-pressed="false" title="' + esc(trxTitle) + '" aria-label="' + esc(trxTitle) + '">' + esc(trxOff) + "</button>" : "") +
          '<button type="button" class="bm-btn" data-bm-del aria-pressed="true" title="' + esc(bmText.remove) + '" aria-label="' + esc(bmText.remove) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button></div></header>' +
          '<div class="bm-body">' + (b.cells || []).map(function (c, i) {
            return '<div class="bm-cell bm-c' + i + '">' + (labels[i] && i ? '<div class="bm-lbl">' + esc(labels[i]) + "</div>" : "") + c + "</div>";
          }).join("") + "</div></article>";
      }).join("");
      shown.forEach(function (b, i) { swapLang(bmListEl.children[i], b.lang); });
      bmEmpty.hidden = list.length > 0;
      bmClear.hidden = !list.length;
    };
    bmGroupBtns.forEach(function (g) {
      g.addEventListener("click", function () { bmGroup = g.getAttribute("data-bm-group"); store.set("ccarf-bm-group", bmGroup); bmRender(); });
    });
    bmListEl.addEventListener("click", function (e) {
      var del = e.target.closest("[data-bm-del]");
      if (!del) return;
      var id = del.closest("[data-id]").getAttribute("data-id");
      bmSave(bmList().filter(function (x) { return x.id !== id; }));
      bmRender();
    });
    bmClear.addEventListener("click", function () {
      if (window.confirm(bmText.confirm || "")) { bmSave([]); bmRender(); }
    });
    bmRender();
  }

  /* ---------- Study plan: one checkbox per task statement and step, kept in localStorage ----------
     Saved as { "1.1:sum": 1, … }; a finished row, a finished domain and the overall bar are worked out from it. */
  var planPage = $("[data-plan-page]");
  if (planPage) {
    var PLAN_KEY = "ccarf-plan";
    var planGet = function () {
      try { var v = JSON.parse(store.get(PLAN_KEY) || "{}"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; }
    };
    var planBoxes = $$("[data-plan]", planPage);
    var ticked = function (bs) { return bs.filter(function (b) { return b.checked; }).length; };
    var planShow = function () {
      var saved = planGet();
      planBoxes.forEach(function (b) { b.checked = !!saved[b.getAttribute("data-plan")]; });
      $$("[data-plan-row]", planPage).forEach(function (r) { var bs = $$("[data-plan]", r); r.classList.toggle("done", ticked(bs) === bs.length); });
      $$("[data-plan-d]", planPage).forEach(function (g) {
        var bs = $$("[data-plan]", g), n = ticked(bs);
        $("[data-plan-count]", g).textContent = n + "/" + bs.length;
        g.classList.toggle("done", n === bs.length);
      });
      var done = ticked(planBoxes), pct = Math.round((done * 100) / planBoxes.length);
      $("[data-plan-bar]", planPage).style.width = pct + "%";
      $("[data-plan-total]", planPage).textContent = planPage.getAttribute("data-plan-tpl").replace("{done}", done).replace("{total}", planBoxes.length).replace("{pct}", pct);
    };
    planPage.addEventListener("change", function (e) {
      var b = e.target.closest("[data-plan]");
      if (!b) return;
      var saved = planGet(), k = b.getAttribute("data-plan");
      if (b.checked) saved[k] = 1; else delete saved[k];
      store.set(PLAN_KEY, JSON.stringify(saved));
      planShow();
    });
    $("[data-plan-reset]", planPage).addEventListener("click", function () {
      if (window.confirm(planPage.getAttribute("data-plan-confirm"))) { store.set(PLAN_KEY, "{}"); planShow(); }
    });
    window.addEventListener("storage", function (e) { if (e.key === PLAN_KEY) planShow(); }); // ticked in another tab
    planShow();

    // A domain's heading row folds its task rows away; the folded domains are remembered ({ "1": 1, … }).
    var FOLD_KEY = "ccarf-plan-folded";
    var foldGet = function () {
      try { var v = JSON.parse(store.get(FOLD_KEY) || "{}"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; }
    };
    var setFold = function (g, folded) {
      g.classList.toggle("folded", folded);
      $("[data-plan-fold]", g).setAttribute("aria-expanded", folded ? "false" : "true");
    };
    var folded = foldGet();
    $$("[data-plan-d]", planPage).forEach(function (g) { setFold(g, !!folded[g.getAttribute("data-plan-d")]); });
    planPage.addEventListener("click", function (e) {
      var b = e.target.closest("[data-plan-fold]");
      if (!b) return;
      var g = b.closest("[data-plan-d]"), n = g.getAttribute("data-plan-d"), saved = foldGet();
      var fold = !g.classList.contains("folded");
      setFold(g, fold);
      if (fold) saved[n] = 1; else delete saved[n];
      store.set(FOLD_KEY, JSON.stringify(saved));
    });

    /* The study pop-up: one task statement's summary, decision table rows or exam traps (tabs), loaded on first use.
       "Mark this step done" ticks that step in the table; the arrows move to the previous or next task statement. */
    var pop = $("[data-pop-dialog]");
    if (pop) {
      var popCodes = $$("[data-plan-row]", planPage).map(function (r) { return r.getAttribute("data-plan-row"); });
      var popBody = $("[data-pop-body]", pop), popDone = $("[data-pop-done]", pop);
      var popAt = { code: "", tab: "sum" };
      var popBox = function () { return $("[data-plan='" + popAt.code + ":" + popAt.tab + "']", planPage); };
      var popTable = function (cls, cols, rows) {
        return '<div class="Box"><div class="tscroll"><table class="gh stack ' + cls + '">' + tableHead(cols || []) + rows + "</table></div></div>";
      };
      var popRender = function () {
        var code = popAt.code, tab = popAt.tab, i = popCodes.indexOf(code);
        $$("[data-pop-tab]", pop).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-pop-tab") === tab ? "true" : "false"); });
        popDone.checked = !!(popBox() && popBox().checked);
        [-1, 1].forEach(function (step) {
          var b = $("[data-pop-go='" + step + "']", pop), to = popCodes[i + step];
          b.disabled = !to;
          b.style.visibility = to ? "" : "hidden";
          $("span", b).textContent = to || "";
        });
        popBody.innerHTML = popNote(popText.loading);
        loadPop(code.split(".")[0], function (P) {
          if (popAt.code !== code || popAt.tab !== tab) return; // moved on while it loaded
          if (!P) { popBody.innerHTML = popNote(popText.failed); return; }
          var t = P.tasks.filter(function (x) { return x.code === code; })[0];
          pop.style.setProperty("--c", P.color);
          $("[data-pop-label]", pop).textContent = P.label;
          $("[data-pop-title]", pop).innerHTML = '<span class="sum-code">' + code + "</span> " + t.task;
          $("[data-pop-n='dc']", pop).textContent = t.nDc;
          $("[data-pop-n='traps']", pop).textContent = t.nTraps;
          if (tab === "sum") {
            var alt = root.getAttribute("lang") === "ar" ? "en" : "ar", title = popEsc(pop.getAttribute("data-trx-title"));
            popBody.innerHTML = '<div class="pop-sum" data-trx-scope><button type="button" class="trx-btn" data-trx aria-pressed="false" title="' + title + '" aria-label="' + title + '">' +
              popEsc(pop.getAttribute("data-trx-off")) + '</button><div class="tx">' + t.sum + '</div><div class="tx" lang="' + alt + '" dir="' + (alt === "ar" ? "rtl" : "ltr") + '" hidden>' + t.sumAlt + "</div></div>";
          } else if (tab === "dc") {
            popBody.innerHTML = quizSwitch() + popTable("decide", popText.decideTh, '<tbody data-dc="' + code + '">' + t.dc + "</tbody>");
          } else {
            popBody.innerHTML = quizSwitch() + popTable("traps", popText.trapsTh, "<tbody>" + t.traps + "</tbody>") + t.tips;
          }
          $$("[data-dq]", popBody).forEach(function (x) { x.checked = dqOn; });
          bmMarks();
          popBody.scrollTop = 0;
        });
      };
      planPage.addEventListener("click", function (e) {
        var b = e.target.closest("[data-pop]");
        if (!b) return;
        var k = b.getAttribute("data-pop").split(":");
        popAt = { code: k[0], tab: k[1] };
        showModal(pop);
        popRender();
      });
      pop.addEventListener("click", function (e) {
        if (e.target === pop || e.target.closest("[data-pop-close]")) { closeModal(pop); return; } // backdrop or close button
        var tb = e.target.closest("[data-pop-tab]");
        if (tb) { popAt.tab = tb.getAttribute("data-pop-tab"); popRender(); return; }
        var go = e.target.closest("[data-pop-go]");
        if (go) {
          var to = popCodes[popCodes.indexOf(popAt.code) + Number(go.getAttribute("data-pop-go"))];
          if (to) { popAt.code = to; popRender(); }
          return;
        }
        // Traps in quiz mode: tap a hidden cell to reveal just that one, or the trap itself to reveal both.
        if (!pop.classList.contains("quiz") || e.target.closest("button, a")) return;
        var row = e.target.closest("table.traps tbody tr");
        if (!row) return;
        var cell = e.target.closest("td.whycol, td.fixcol");
        if (cell) { cell.classList.toggle("revealed"); return; }
        var cells = $$("td.whycol, td.fixcol", row), show = cells.some(function (c) { return !c.classList.contains("revealed"); });
        cells.forEach(function (c) { c.classList.toggle("revealed", show); });
      });
      popDone.addEventListener("change", function () {
        var b = popBox();
        if (!b) return;
        b.checked = popDone.checked;
        b.dispatchEvent(new Event("change", { bubbles: true })); // saves it and updates the counts
      });
    }
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
  // The domain and row-type filters are remembered per page (notes, traps) for the next visit.
  var filterKey = "ccarf-filters-" + (page.getAttribute("data-store") || "page");
  var saveFilters = function () { store.set(filterKey, JSON.stringify({ d: state.d, kinds: state.kinds })); };

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
    saveFilters();
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
      saveFilters();
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
      if (!page.classList.contains("quiz") || e.target.closest("[data-trx], [data-bm]")) return;
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

  /* ---------- Start: restore filters carried over from the other language, or the ones saved last visit
     (plus ?q=), then jump ---------- */
  var carried = null, saved = null;
  try {
    carried = JSON.parse(window.sessionStorage.getItem("ccarf-carry") || "null");
    window.sessionStorage.removeItem("ccarf-carry");
  } catch (e) { carried = null; }
  try { saved = JSON.parse(store.get(filterKey) || "null"); } catch (e) { saved = null; }
  var restore = carried || saved || {};
  kindBtns.forEach(function (b) {
    if (restore.kinds && b.dataset.kind in restore.kinds) {
      var on = restore.kinds[b.dataset.kind] !== false;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      state.kinds[b.dataset.kind] = on;
    }
  });
  if (carried) {
    if (search && typeof carried.q === "string") search.value = carried.q;
  } else {
    var q = null;
    try { q = new URLSearchParams(location.search).get("q"); } catch (e) { q = null; }
    if (search && q) search.value = q;
  }
  setDomain(/^(all|[1-5])$/.test(restore.d) ? restore.d : "all");
  if (search && search.value) keepQuery();
  if (location.hash) { reveal(location.hash, true); }
  if (search && session.take("ccarf-focus-q") === "1") search.focus({ preventScroll: true });
})();
