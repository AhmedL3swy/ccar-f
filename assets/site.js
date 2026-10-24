/* CCAR-F Field Guide — the study plan and its pop-ups. */
(function () {
  "use strict";
  var root = document.documentElement;
  var siteJs = (document.currentScript || {}).src || location.href; // for finding assets/pop/ next to this file
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };
  var esc = function (t) { var d = document.createElement("div"); d.textContent = t == null ? "" : t; return d.innerHTML; };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme toggle ---------- */
  var effectiveTheme = function () {
    var t = root.getAttribute("data-theme");
    if (t === "dark" || t === "light") return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };
  $$("[data-theme-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = effectiveTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      store.set("ccarf-theme", next);
    });
  });

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

  /* ---------- Study plan: one checkbox per task statement and step, kept in localStorage ----------
     Saved as { "1.1:sum": 1, … }; a finished row, a finished domain and the overall bar are worked out from it. */
  var planPage = $("[data-plan-page]");
  if (!planPage) return;
  var PLAN_KEY = "ccarf-plan";
  var planGet = function () {
    try { var v = JSON.parse(store.get(PLAN_KEY) || "{}"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; }
  };
  var planBoxes = $$("[data-plan]", planPage), planNext = $("[data-plan-next]", planPage);
  var ticked = function (bs) { return bs.filter(function (b) { return b.checked; }).length; };
  // The step checkboxes a domain-wide checkbox stands for: all of the domain's, or just one step's.
  var covers = function (c) {
    var k = c.getAttribute("data-plan-col");
    return $$("[data-plan]", c.closest("[data-plan-d]")).filter(function (b) { return !k || b.getAttribute("data-plan").split(":")[1] === k; });
  };
  var planShow = function () {
    var saved = planGet();
    planBoxes.forEach(function (b) { b.checked = !!saved[b.getAttribute("data-plan")]; });
    $$("[data-plan-row]", planPage).forEach(function (r) { var bs = $$("[data-plan]", r); r.classList.toggle("done", ticked(bs) === bs.length); });
    $$("[data-plan-d]", planPage).forEach(function (g) {
      var bs = $$("[data-plan]", g), n = ticked(bs);
      $("[data-plan-count]", g).textContent = n + "/" + bs.length;
      g.classList.toggle("done", n === bs.length);
      $$("[data-plan-all], [data-plan-col]", g).forEach(function (c) {
        var cs = covers(c), m = ticked(cs);
        c.checked = m === cs.length;
        c.indeterminate = m > 0 && m < cs.length; // some ticked: a dash
      });
    });
    var done = ticked(planBoxes), pct = Math.round((done * 100) / planBoxes.length);
    $("[data-plan-bar]", planPage).style.width = pct + "%";
    $("[data-plan-total]", planPage).textContent = planPage.getAttribute("data-plan-tpl").replace("{done}", done).replace("{total}", planBoxes.length).replace("{pct}", pct);
    // Continue: the first step in plan order that opens in the pop-up and isn't ticked yet (none left: hidden).
    var next = planBoxes.filter(function (b) { return !b.checked && plan.steps[b.getAttribute("data-plan").split(":")[1]]; })[0];
    planNext.hidden = !next;
    if (next) {
      var at = next.getAttribute("data-plan").split(":");
      planNext.setAttribute("href", hashFor({ code: at[0], tab: at[1] }));
      $("[data-plan-next-at]", planNext).innerHTML = "<b>" + at[0] + "</b> " + esc(plan.names[at[1]]);
    }
    if (pop && pop.open) popDone.checked = !!saved[popAt.code + ":" + popAt.tab];
  };
  // A step's checkbox saves that step. A domain's checkboxes tick (or clear) several at once: every step in the
  // domain (data-plan-all), or one step for every task in it (data-plan-col="sum": all its summaries).
  planPage.addEventListener("change", function (e) {
    var c = e.target.closest("[data-plan-all], [data-plan-col]"), b = e.target.closest("[data-plan]");
    var bs = c ? covers(c) : b ? [b] : [];
    if (!bs.length) return;
    var saved = planGet(), on = (c || b).checked;
    bs.forEach(function (x) { var k = x.getAttribute("data-plan"); if (on) saved[k] = 1; else delete saved[k]; });
    store.set(PLAN_KEY, JSON.stringify(saved));
    planShow();
  });
  $("[data-plan-reset]", planPage).addEventListener("click", function () {
    if (window.confirm(planPage.getAttribute("data-plan-confirm"))) { store.set(PLAN_KEY, "{}"); planShow(); }
  });
  window.addEventListener("storage", function (e) { if (e.key === PLAN_KEY) planShow(); }); // ticked in another tab

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

  /* ---------- Pop-ups and their addresses ----------
     Each pop-up has an address: #1.4/summary, #1.4/decisions or #1.4/traps (the study pop-up), #bookmarks and #about.
     Opening one from the page adds a history entry, so the phone's back button closes it instead of leaving the
     site, and a link with that address opens it straight away. Switching tabs or tasks inside the pop-up replaces
     that entry, so one back always closes it. */
  var plan = JSON.parse($("#plan-data").textContent);
  var T = plan.text;
  var pop = $("[data-pop]"), about = $("[data-about]"), bms = $("[data-bms]");
  var codes = plan.tasks.map(function (t) { return t.code; });
  var tabOf = {};
  Object.keys(plan.steps).forEach(function (k) { tabOf[plan.steps[k]] = k; });
  var parse = function (hash) {
    var m = /^#(\d\.\d+)\/(\w+)$/.exec(hash || "");
    return m && codes.indexOf(m[1]) >= 0 && tabOf[m[2]] ? { code: m[1], tab: tabOf[m[2]] } : null;
  };
  var hashFor = function (at) { return "#" + at.code + "/" + plan.steps[at.tab]; };
  var isRoute = function (h) { return h === "#about" || h === "#bookmarks" || !!parse(h); };
  var push = function (h) { try { history.pushState({ ccarf: 1 }, "", h); } catch (e) { location.hash = h; } };
  var replace = function (h) { try { history.replaceState(history.state, "", h); } catch (e) { /* not allowed here */ } };

  // While a pop-up is open the page behind it stays put (html.modal-open).
  var show = function (d) {
    if (!d.open) { if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", ""); }
    root.classList.add("modal-open");
  };
  var hide = function (d) {
    if (!d.open) return;
    if (typeof d.close === "function") d.close();
    else { d.removeAttribute("open"); d.dispatchEvent(new Event("close")); }
  };
  var route = function () {
    var at = parse(location.hash);
    if (location.hash === "#about") { hide(pop); hide(bms); show(about); }
    else if (location.hash === "#bookmarks") { hide(pop); hide(about); bmRender(); show(bms); }
    else if (at) { hide(about); hide(bms); popAt = at; show(pop); popRender(); }
    else { hide(pop); hide(about); hide(bms); }
  };
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || !isRoute(a.getAttribute("href"))) return;
    e.preventDefault();
    if (location.hash !== a.getAttribute("href")) push(a.getAttribute("href"));
    route();
  });
  window.addEventListener("popstate", route);
  window.addEventListener("hashchange", route);
  // However a pop-up closes (close button, backdrop, Escape), its address goes too: back through the entry the
  // page added, or, when it was opened from a link, by dropping the address.
  [pop, about, bms].forEach(function (d) {
    d.addEventListener("close", function () {
      if (!$("dialog[open]")) root.classList.remove("modal-open");
      if (!(d === pop ? parse(location.hash) : location.hash === "#" + d.id)) return;
      if (history.state && history.state.ccarf) history.back();
      else { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* not allowed here */ } }
    });
    d.addEventListener("click", function (e) {
      if (e.target === d || e.target.closest("[data-close]")) hide(d); // the backdrop or the close button
    });
  });

  /* ---------- The study pop-up: one task statement's summary, decisions & terms or exam traps ----------
     Its head comes from #plan-data straight away; the body comes from the domain's assets/pop/d<n>.js, loaded by a
     script tag (not fetch, so it also works opened straight from disk) the first time one of its tasks opens. */
  var popAt = { code: "", tab: "sum" };
  var popBody = $("[data-pop-body]", pop), popDone = $("[data-pop-done]", pop);
  var waiting = {};
  var loadPop = function (n, done) {
    var got = window.CCARF_POP && window.CCARF_POP[n];
    if (got) { done(got); return; }
    if (waiting[n]) { waiting[n].push(done); return; }
    waiting[n] = [done];
    var s = document.createElement("script");
    var finish = function () {
      var list = waiting[n], data = (window.CCARF_POP && window.CCARF_POP[n]) || null;
      delete waiting[n];
      list.forEach(function (cb) { cb(data); });
    };
    s.onload = finish;
    s.onerror = function () { s.parentNode.removeChild(s); finish(); }; // a later open tries again
    s.src = new URL("pop/d" + n + ".js", siteJs).href;
    document.head.appendChild(s);
  };
  var ic = function (n) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#pi-' + n + '"/></svg>'; };
  var note = function (t) { return '<p class="pop-note">' + esc(t) + "</p>"; };
  // Every row holds both languages; its translate button (ع) swaps which one shows.
  var trxBtn = '<button type="button" class="trx-btn" data-trx aria-pressed="false" title="' + esc(T.trxTitle) + '" aria-label="' + esc(T.trxTitle) + '">' + esc(T.trxOff) + "</button>";
  var dual = function (en, ar, tag) {
    tag = tag || "div";
    return "<" + tag + ' class="tx">' + en + "</" + tag + "><" + tag + ' class="tx" lang="ar" dir="rtl" hidden>' + ar + "</" + tag + ">";
  };
  var table = function (cls, cols, rows) {
    return '<div class="Box"><div class="tscroll"><table class="gh stack ' + cls + '"><thead><tr>' +
      cols.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + '<th class="trx"><span class="sr-only">' + esc(T.trxTh) + "</span></th></tr></thead><tbody>" +
      rows + "</tbody></table></div></div>";
  };
  // Each row's buttons: bookmark it, and show its Arabic. data-bm-id ("dc:1.4:2") names the row for Bookmarks.
  var bmBtn = '<button type="button" class="bm-btn" data-bm aria-pressed="false" title="' + esc(T.bm) + '" aria-label="' + esc(T.bm) + '">' + ic("bookmark") + "</button>";
  var acts = '<td class="trx"><div class="row-acts">' + bmBtn + trxBtn + "</div></td>";
  var rowOpen = function (kind, code, i) { return '<tr tabindex="0" data-bm-id="' + kind + ":" + code + ":" + i + '" data-bm-kind="' + kind + '">'; };
  var qaRows = function (rows, kind, code) {
    return rows.map(function (r, i) {
      return rowOpen(kind, code, i) + '<td class="q">' + dual(r[0], r[2]) + '</td><td class="a"><span class="ans">' + dual(r[1], r[3], "span") + "</span></td>" + acts + "</tr>";
    }).join("");
  };
  // One section of a tab under its own heading; a rule runs from the heading to the edge, and a gap sets the
  // sections apart.
  var section = function (icn, label, n, html) {
    return '<section class="pop-sec"><h3 class="pop-sec-h">' + ic(icn) + "<span>" + esc(label) + '</span><span class="Counter">' + n + "</span></h3>" + html + "</section>";
  };
  var quizSwitch = function () { return '<label class="toggle quiz-toggle"><input type="checkbox" data-quiz' + (quizOn ? " checked" : "") + "> " + esc(T.quiz) + "</label>"; };
  var bodies = {
    sum: function (x) { return '<div class="pop-sum" data-trx-scope>' + trxBtn + dual(x.sum[0], x.sum[1]) + "</div>"; },
    // Decisions first, then the facts & terms, each under its own heading.
    dc: function (x) {
      return quizSwitch() +
        (x.dc.length ? section("target", T.decisions, x.dc.length, table("decide", T.decideTh, qaRows(x.dc, "dc", x.code))) : "") +
        (x.terms.length ? section("book", T.terms, x.terms.length, table("decide terms", T.termsTh, qaRows(x.terms, "term", x.code))) : "");
    },
    traps: function (x) {
      return quizSwitch() + table("traps", T.trapsTh, x.traps.map(function (r, i) {
        return rowOpen("trap", x.code, i) + '<td class="trapcol">' + dual(r[0], r[3]) + '</td><td class="whycol">' + dual(r[1], r[4]) + '</td><td class="fixcol">' + dual(r[2], r[5]) + "</td>" + acts + "</tr>";
      }).join("")) + (x.tips.length
        ? '<div class="flash tips" data-trx-scope><div class="flash-title">' + ic("bulb") + "<span>" + esc(T.tips) + "</span>" + trxBtn + "</div><ul>" +
          x.tips.map(function (t) { return "<li>" + dual(t[0], t[1], "span") + "</li>"; }).join("") + "</ul></div>"
        : "");
    }
  };
  var popRender = function () {
    var at = popAt, i = codes.indexOf(at.code), t = plan.tasks[i], dm = plan.domains[t.d];
    pop.style.setProperty("--c", dm.color);
    $("[data-pop-label]", pop).textContent = dm.label;
    $("[data-pop-title]", pop).innerHTML = '<span class="pop-code">' + t.code + "</span> " + t.task;
    $$("[data-pop-n]", pop).forEach(function (n) { n.textContent = t.n[Number(n.getAttribute("data-pop-n"))]; });
    $$("[data-pop-tab]", pop).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-pop-tab") === at.tab ? "true" : "false"); });
    popDone.checked = !!planGet()[at.code + ":" + at.tab];
    [-1, 1].forEach(function (step) {
      var b = $("[data-pop-go='" + step + "']", pop), to = codes[i + step];
      b.disabled = !to;
      b.style.visibility = to ? "" : "hidden";
      $("span", b).textContent = to || "";
    });
    popBody.innerHTML = note(T.loading);
    popBody.scrollTop = 0;
    loadPop(t.d, function (P) {
      if (popAt !== at) return; // moved on while it loaded
      var x = P && P.filter(function (y) { return y.code === at.code; })[0];
      popBody.innerHTML = x ? bodies[at.tab](x) : note(T.failed);
      bmMarks();
    });
  };
  var popGo = function (at) { popAt = at; replace(hashFor(at)); popRender(); };
  pop.addEventListener("click", function (e) {
    var tb = e.target.closest("[data-pop-tab]");
    if (tb) { popGo({ code: popAt.code, tab: tb.getAttribute("data-pop-tab") }); return; }
    var go = e.target.closest("[data-pop-go]");
    if (go) {
      var to = codes[codes.indexOf(popAt.code) + Number(go.getAttribute("data-pop-go"))];
      if (to) popGo({ code: to, tab: popAt.tab });
    }
  });
  popDone.addEventListener("change", function () {
    var b = $("[data-plan='" + popAt.code + ":" + popAt.tab + "']", planPage);
    if (!b) return;
    b.checked = popDone.checked;
    b.dispatchEvent(new Event("change", { bubbles: true })); // saves it and updates the counts
  });

  /* ---------- Bookmarks: rows saved from the study pop-up, listed in the Bookmarks pop-up ----------
     Saving keeps a copy of the row's cells (both languages) in localStorage, newest first, so the list needs no
     loading: { id: "dc:1.4:2", kind, code, cells, at }. Bookmarks saved by the earlier, multi-page site
     (decide/trap/note… kinds, with a `ctx` line and a `lang`) are still listed. */
  var BM_KEY = "ccarf-bookmarks";
  var bmList = function () {
    try { var v = JSON.parse(store.get(BM_KEY) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  };
  var bmSave = function (list) { store.set(BM_KEY, JSON.stringify(list)); bmMarks(); };
  var bmMarks = function () {
    var list = bmList(), ids = {};
    list.forEach(function (b) { ids[b.id] = true; });
    $$("[data-bm-id]", pop).forEach(function (r) {
      var b = $("[data-bm]", r);
      if (b) b.setAttribute("aria-pressed", ids[r.getAttribute("data-bm-id")] ? "true" : "false");
    });
    $$("[data-bm-count]").forEach(function (c) { c.textContent = list.length; c.hidden = !list.length; });
  };
  // The row's cells as shown on the page (English first, its Arabic hidden), without buttons.
  var bmCells = function (row) {
    return $$("td", row).filter(function (td) { return !td.classList.contains("trx"); }).map(function (td) {
      var c = td.cloneNode(true);
      $$("button", c).forEach(function (n) { n.parentNode.removeChild(n); });
      $$(".tx", c).forEach(function (x) { x.hidden = x.hasAttribute("lang"); });
      return c.innerHTML;
    });
  };
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-bm]"), row = b && b.closest("[data-bm-id]");
    if (!row) return;
    var id = row.getAttribute("data-bm-id"), list = bmList();
    var rest = list.filter(function (x) { return x.id !== id; });
    if (rest.length === list.length) {
      rest.unshift({ id: id, kind: row.getAttribute("data-bm-kind"), code: id.split(":")[1], cells: bmCells(row), at: Date.now() });
    }
    bmSave(rest);
  });

  var bmGroup = store.get("ccarf-bm-group") || "all";
  var groupOf = function (kind) { return kind === "trap" ? "trap" : kind === "dc" || kind === "term" || kind === "decide" ? "dc" : "note"; };
  var tabFor = { dc: "decisions", term: "decisions", decide: "decisions", trap: "traps" };
  var labelsFor = function (kind) { return kind === "trap" ? T.trapsTh : kind === "term" ? T.termsTh : kind === "dc" || kind === "decide" ? T.decideTh : []; };
  // An earlier site's bookmark saved on its Arabic pages shows its Arabic first: put English first, like the rest.
  var englishFirst = function (el, saved) {
    if (saved !== "ar") return;
    $$(".tx", el).forEach(function (x) {
      if (x.getAttribute("lang") === "en") { x.removeAttribute("lang"); x.removeAttribute("dir"); x.hidden = false; }
      else if (!x.hasAttribute("lang")) { x.setAttribute("lang", "ar"); x.setAttribute("dir", "rtl"); x.hidden = true; }
    });
  };
  var bmRender = function () {
    var list = bmList(), counts = { all: list.length, dc: 0, trap: 0, note: 0 };
    list.forEach(function (b) { counts[groupOf(b.kind)]++; });
    if (!(bmGroup in counts) || (bmGroup !== "all" && !counts[bmGroup])) bmGroup = "all";
    $$("[data-bm-group]", bms).forEach(function (g) {
      var k = g.getAttribute("data-bm-group");
      g.setAttribute("aria-pressed", k === bmGroup ? "true" : "false");
      g.hidden = k !== "all" && !counts[k];
      $("[data-bm-n]", g).textContent = counts[k];
    });
    $("[data-bm-total]", bms).textContent = list.length;
    var shown = list.filter(function (b) { return bmGroup === "all" || groupOf(b.kind) === bmGroup; });
    var listEl = $("[data-bm-list]", bms);
    listEl.innerHTML = shown.map(function (b) {
      var code = b.code || ((/^(\d\.\d+)/.exec(b.ctx || "") || [])[1]);
      var t = plan.tasks[codes.indexOf(code)];
      var labels = labelsFor(b.kind), dualRow = (b.cells || []).some(function (c) { return c.indexOf('class="tx"') !== -1; });
      var where = t
        ? '<a class="bm-where" href="#' + t.code + "/" + (tabFor[b.kind] || "summary") + '" style="--c:' + plan.domains[t.d].color + '"><b>' + t.code + "</b> <span>" + t.task + "</span></a>"
        : '<span class="bm-where">' + esc(b.ctx || "") + "</span>";
      return '<article class="Box bm-item" data-trx-scope data-id="' + esc(b.id) + '"><header class="bm-h"><span class="Label bm-kind k-' + esc(groupOf(b.kind)) + '">' +
        esc((T.bmKinds || {})[b.kind] || b.kind) + "</span>" + where + '<div class="row-acts">' + (dualRow ? trxBtn : "") +
        '<button type="button" class="bm-btn" data-bm-del aria-pressed="true" title="' + esc(T.bmRemove) + '" aria-label="' + esc(T.bmRemove) + '">' + ic("bookmark") + "</button></div></header>" +
        '<div class="bm-cells">' + (b.cells || []).map(function (c, i) {
          return '<div class="bm-cell bm-c' + i + '">' + (labels[i] && i ? '<div class="bm-lbl">' + esc(labels[i]) + "</div>" : "") + c + "</div>";
        }).join("") + "</div></article>";
    }).join("");
    shown.forEach(function (b, i) { englishFirst(listEl.children[i], b.lang); });
    $("[data-bm-empty]", bms).hidden = list.length > 0;
    $("[data-bm-bar]", bms).hidden = !list.length;
    bmFilter();
  };
  // Search: keeps the bookmarks whose text (either language, the task and the kind) holds every word typed.
  // "Clear all" hides while searching, since it would also clear the bookmarks the search hides.
  var bmQ = $("[data-bm-q]", bms);
  var bmFilter = function () {
    var words = bmQ.value.toLowerCase().split(/\s+/).filter(Boolean), items = $$(".bm-item", bms), hits = 0;
    items.forEach(function (a) {
      var text = a.textContent.toLowerCase();
      a.hidden = !words.every(function (w) { return text.indexOf(w) !== -1; });
      if (!a.hidden) hits++;
    });
    $("[data-bm-none]", bms).hidden = !items.length || hits > 0;
    $("[data-bm-clear]", bms).hidden = !items.length || words.length > 0;
  };
  bmQ.addEventListener("input", bmFilter);
  // Escape empties the search first; with nothing typed it closes the pop-up as usual.
  bmQ.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && bmQ.value) { e.preventDefault(); bmQ.value = ""; bmFilter(); }
  });
  bms.addEventListener("click", function (e) {
    var g = e.target.closest("[data-bm-group]");
    if (g) { bmGroup = g.getAttribute("data-bm-group"); store.set("ccarf-bm-group", bmGroup); bmRender(); return; }
    var del = e.target.closest("[data-bm-del]");
    if (del) { var id = del.closest("[data-id]").getAttribute("data-id"); bmSave(bmList().filter(function (x) { return x.id !== id; })); bmRender(); return; }
    if (e.target.closest("[data-bm-clear]") && window.confirm(T.bmConfirm)) { bmSave([]); bmRender(); }
  });
  window.addEventListener("storage", function (e) { if (e.key === BM_KEY) { bmMarks(); if (bms.open) bmRender(); } }); // saved in another tab

  /* ---------- Translate one row (or the summary, or the tips box) ---------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-trx]");
    var scope = b && (b.closest("[data-trx-scope]") || b.closest("tr"));
    if (!scope) return;
    var on = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.textContent = on ? T.trxOn : T.trxOff;
    scope.classList.toggle("translated", on);
    $$(".tx", scope).forEach(function (x) { x.hidden = !x.hidden; });
  });

  /* ---------- Quiz mode: hide each answer until it's tapped (remembered) ----------
     Decisions & terms: tap a row (or Enter on it) to reveal its answer. Traps: tap a hidden cell to reveal just
     that one, or the trap itself to reveal both. */
  var quizOn = store.get("ccarf-dq") === "1";
  pop.classList.toggle("quiz", quizOn);
  pop.addEventListener("change", function (e) {
    if (!e.target.matches("[data-quiz]")) return;
    quizOn = e.target.checked;
    store.set("ccarf-dq", quizOn ? "1" : "0");
    pop.classList.toggle("quiz", quizOn);
    $$(".revealed", pop).forEach(function (c) { c.classList.remove("revealed"); });
  });
  var reveal = function (e) {
    if (!quizOn || e.target.closest("button, a")) return false;
    var row = e.target.closest("tbody tr[tabindex]");
    if (!row || !pop.contains(row)) return false;
    var a = $("td.a", row);
    if (a) { a.classList.toggle("revealed"); return true; }
    var cell = e.target.closest("td.whycol, td.fixcol");
    if (cell) { cell.classList.toggle("revealed"); return true; }
    var cells = $$("td.whycol, td.fixcol", row), showAll = cells.some(function (c) { return !c.classList.contains("revealed"); });
    cells.forEach(function (c) { c.classList.toggle("revealed", showAll); });
    return true;
  };
  pop.addEventListener("click", reveal);
  pop.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches("tbody tr[tabindex]") && reveal(e)) e.preventDefault();
  });

  planShow();
  bmMarks();
  route(); // an address in the link (#1.4/decisions, #bookmarks, #about) opens its pop-up straight away
})();
