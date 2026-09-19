/* CRSV paragraph atlas — v2026.09. Vanilla JS, no build step. */
(function () {
  "use strict";
  var ROWS = window.__CRSV__ || [];
  var YMIN = 2000, YMAX = 2025;

  var TIERS = [
    { k: "A", label: "CRSV", desc: "conflict-related sexual violence named" },
    { k: "SEA", label: "SEA", desc: "sexual exploitation and abuse by UN or mission personnel" },
    { k: "CAAC", label: "Children", desc: "children and armed conflict, sexual violence among the violations" },
    { k: "TIP", label: "Trafficking", desc: "trafficking in conflict without sexual violence named" },
    { k: "D", label: "Gender only", desc: "gender or participation language, no violence element" }
  ];
  var FORCE = [
    { k: "decision", label: "Decides / Authorizes", rank: 5 },
    { k: "demand", label: "Demands", rank: 4 },
    { k: "condemnation", label: "Condemns", rank: 3 },
    { k: "call", label: "Requests / Calls upon / Urges", rank: 2 },
    { k: "encouragement", label: "Encourages / Invites", rank: 1 },
    { k: "statement", label: "Notes / Welcomes / Recognizes", rank: 0 }
  ];
  var FORCE_BY = {}; FORCE.forEach(function (f) { FORCE_BY[f.k] = f; });
  var CATS = ["Thematic WPS/CRSV", "Mission Mandate", "Country-Specific", "Sanctions"];
  var CATCOL = {
    "Thematic WPS/CRSV": "--c-thematic", "Mission Mandate": "--c-mission",
    "Country-Specific": "--c-country", "Sanctions": "--c-sanctions"
  };
  function catColor(c) { return "var(" + (CATCOL[c] || "--ink-3") + ")"; }
  function forceColor(f) {
    return { decision: "var(--f5)", demand: "var(--f4)", condemnation: "var(--f3)",
      call: "var(--f2)", encouragement: "var(--f1)", statement: "var(--f0)" }[f] || "var(--rule)";
  }

  ROWS.forEach(function (r, i) {
    r.i = i;
    r.hay = [r.symbol, r.para_ref, r.track, r.themes, r.obligation_verb, r.note,
      r.text_verbatim, r.status, r.provision_type].join(" ").toLowerCase();
  });

  var TRACKS = (function () {
    var m = {};
    ROWS.forEach(function (r) { m[r.track] = (m[r.track] || 0) + 1; });
    return Object.keys(m).sort(function (a, b) { return m[b] - m[a]; });
  })();
  var VERBS = (function () {
    var m = {};
    ROWS.forEach(function (r) { if (r.obligation_verb) m[r.obligation_verb] = (m[r.obligation_verb] || 0) + 1; });
    return Object.keys(m).sort(function (a, b) { return m[b] - m[a]; });
  })();

  var S = { q: "", tiers: ["A"], cats: [], track: "", force: [], status: "",
    y0: YMIN, y1: YMAX, view: "strength", sel: null, sortKey: "year", sortDir: 1, carriedOnly: false };

  /* ---------- helpers ---------- */
  function el(t, a) {
    var n = document.createElement(t);
    if (a) Object.keys(a).forEach(function (k) {
      var v = a[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "text") n.textContent = v;
      else if (k === "html") n.innerHTML = v;
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v);
      else if (k === "style" && typeof v === "object") Object.assign(n.style, v);
      else n.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (!c) continue;
      if (Array.isArray(c)) c.forEach(function (x) { if (x) n.appendChild(x); });
      else n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return n;
  }
  var NS = "http://www.w3.org/2000/svg";
  function sv(t, a) {
    var n = document.createElementNS(NS, t);
    if (a) Object.keys(a).forEach(function (k) {
      var v = a[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "text") n.textContent = v;
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) if (arguments[i]) n.appendChild(arguments[i]);
    return n;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function hl(s) {
    var out = esc(s);
    S.q.toLowerCase().split(/\s+/).filter(function (t) { return t.length > 1; }).forEach(function (t) {
      out = out.replace(new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi"), "<mark>$1</mark>");
    });
    return out;
  }
  function $(id) { return document.getElementById(id); }
  function debounce(fn, ms) { var t; return function () { var a = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(null, a); }, ms); }; }

  /* ---------- filtering ---------- */
  function rows() {
    var ts = S.q.toLowerCase().split(/\s+/).filter(Boolean);
    return ROWS.filter(function (r) {
      if (r.year < S.y0 || r.year > S.y1) return false;
      if (S.tiers.length && S.tiers.indexOf(r.tier) < 0) return false;
      if (S.cats.length && S.cats.indexOf(r.category) < 0) return false;
      if (S.track && r.track !== S.track) return false;
      if (S.force.length && S.force.indexOf(r.force) < 0) return false;
      if (S.status === "inherited" && r.status.indexOf("inherited") !== 0) return false;
      if (S.status === "added" && r.status !== "added") return false;
      if (S.status === "changed" && !/corrected|struck|re-tiered/.test(r.status)) return false;
      if (S.carriedOnly && !r.carried_from) return false;
      for (var i = 0; i < ts.length; i++) if (r.hay.indexOf(ts[i]) < 0) return false;
      return true;
    });
  }

  function writeURL() {
    var p = new URLSearchParams();
    if (S.q) p.set("q", S.q);
    if (S.tiers.join("|") !== "A") p.set("tier", S.tiers.join("|"));
    if (S.cats.length) p.set("cat", S.cats.join("|"));
    if (S.track) p.set("track", S.track);
    if (S.force.length) p.set("force", S.force.join("|"));
    if (S.status) p.set("status", S.status);
    if (S.carriedOnly) p.set("carried", "1");
    if (S.y0 !== YMIN) p.set("from", S.y0);
    if (S.y1 !== YMAX) p.set("to", S.y1);
    if (S.view !== "strength") p.set("view", S.view);
    if (S.sel !== null) p.set("row", S.sel);
    try { history.replaceState(null, "", p.toString() ? location.pathname + "?" + p : location.pathname); } catch (e) {}
  }
  function readURL() {
    var p = new URLSearchParams(location.search);
    if (p.get("q")) S.q = p.get("q");
    if (p.get("tier")) S.tiers = p.get("tier").split("|").filter(Boolean);
    if (p.get("cat")) S.cats = p.get("cat").split("|");
    if (p.get("track")) S.track = p.get("track");
    if (p.get("force")) S.force = p.get("force").split("|");
    if (p.get("status")) S.status = p.get("status");
    if (p.get("carried") === "1") S.carriedOnly = true;
    if (p.get("from")) S.y0 = +p.get("from");
    if (p.get("to")) S.y1 = +p.get("to");
    if (p.get("view")) S.view = p.get("view");
    if (p.get("row")) S.sel = +p.get("row");
  }

  /* ---------- views ---------- */
  function head(t, b) {
    return el("div", { class: "stage-head" }, el("h2", { text: t }), el("p", { html: b }));
  }
  function empty() {
    return el("div", { class: "empty" }, el("b", { text: "Nothing in view" }),
      el("div", { text: "Widen the years or clear a filter." }));
  }

  /* -- strength: year × force -- */
  function viewStrength(rs) {
    var stage = $("stage");
    stage.appendChild(head("Volume and force, year by year",
      "Each block is one paragraph, stacked by year and ordered by the verb that carries it. " +
      "The scale runs from <b>Decides</b> and <b>Demands</b> at the base to " +
      "<b>Notes</b> and <b>Welcomes</b> at the top. Counting paragraphs alone hides this axis entirely."));
    if (!rs.length) { stage.appendChild(empty()); return; }
    var byYear = {};
    rs.forEach(function (r) { (byYear[r.year] = byYear[r.year] || []).push(r); });
    var maxN = Math.max.apply(null, Object.keys(byYear).map(function (y) { return byYear[y].length; }));
    var colW = 34, cell = 15, padL = 46, padB = 40, padT = 16;
    var W = padL + (YMAX - YMIN + 1) * colW + 16, H = padT + maxN * cell + padB;
    var svg = sv("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Paragraphs per year by force of verb" });
    var base = H - padB;
    svg.appendChild(sv("line", { class: "grid-line", x1: padL - 8, y1: base, x2: W - 8, y2: base }));
    for (var y = YMIN; y <= YMAX; y++) {
      var x = padL + (y - YMIN) * colW;
      var list = (byYear[y] || []).slice().sort(function (a, b) {
        return (FORCE_BY[b.force] ? FORCE_BY[b.force].rank : -1) - (FORCE_BY[a.force] ? FORCE_BY[a.force].rank : -1);
      });
      svg.appendChild(sv("text", { class: "tick-text", x: x + colW / 2, y: base + 15, "text-anchor": "middle",
        text: (y % 5 === 0 || y === YMAX) ? y : "" }));
      if (list.length) svg.appendChild(sv("text", { class: "tick-text", x: x + colW / 2, y: base + 29, "text-anchor": "middle", text: list.length }));
      list.forEach(function (r, i) {
        var yy = base - (i + 1) * cell + 2;
        var g = sv("g", { class: "node" + (S.sel === r.i ? " sel" : ""), tabindex: "0", role: "button",
          "aria-label": r.symbol + " " + r.para_ref + ", " + (r.obligation_verb || "sub-paragraph"),
          onclick: function () { select(r.i); },
          onkeydown: function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(r.i); } } });
        g.appendChild(sv("rect", { x: x + 3, y: yy, width: colW - 7, height: cell - 3, rx: 2,
          fill: forceColor(r.force), "fill-opacity": r.tier === "A" ? 0.95 : 0.5 }));
        g.appendChild(sv("title", { text: r.symbol + " ¶" + r.para_ref + " — " + (r.obligation_verb || "sub-paragraph") + "\n" + r.text_verbatim.slice(0, 200) }));
        svg.appendChild(g);
      });
    }
    stage.appendChild(el("div", { class: "chart-shell" }, svg));
    var lg = el("div", { class: "legend" });
    FORCE.forEach(function (f) {
      lg.appendChild(el("span", {}, el("i", { style: { background: forceColor(f.k) } }), f.label));
    });
    stage.appendChild(lg);
    stage.appendChild(el("p", { class: "footnote", text:
      "Force is derived from the paragraph's opening verb, not assigned by hand. Sub-paragraphs, " +
      "annex entries and preambular clauses have no verb of their own and are shown in the lightest tone." }));
  }

  /* -- tracks: small multiples -- */
  function viewTracks(rs) {
    var stage = $("stage");
    stage.appendChild(head("One row per situation",
      "Every coded paragraph on its track, placed by year and coloured by force. " +
      "Read across for a mission's trajectory; read down for what the Council was doing in a given year."));
    if (!rs.length) { stage.appendChild(empty()); return; }
    var by = {};
    rs.forEach(function (r) { (by[r.track] = by[r.track] || []).push(r); });
    var names = Object.keys(by).sort(function (a, b) { return by[b].length - by[a].length; });
    var colW = 30, padL = 132, rowH = 26;
    var W = padL + (YMAX - YMIN + 1) * colW + 30, H = names.length * rowH + 34;
    var svg = sv("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Paragraphs by track and year" });
    for (var y = YMIN; y <= YMAX; y += 5) {
      var x = padL + (y - YMIN) * colW + colW / 2;
      svg.appendChild(sv("line", { class: "grid-line", x1: x, y1: 20, x2: x, y2: H - 14, "stroke-dasharray": "2 4" }));
      svg.appendChild(sv("text", { class: "tick-text", x: x, y: 14, "text-anchor": "middle", text: y }));
    }
    names.forEach(function (t, ri) {
      var cy = 32 + ri * rowH;
      svg.appendChild(sv("text", { class: "axis-label", x: padL - 10, y: cy + 4, "text-anchor": "end", text: t }));
      var seen = {};
      by[t].slice().sort(function (a, b) { return a.year - b.year; }).forEach(function (r) {
        var k = r.year; seen[k] = (seen[k] || 0) + 1;
        var off = ((seen[k] - 1) % 4) * 5 - 7;
        var x = padL + (r.year - YMIN) * colW + colW / 2 + off;
        var g = sv("g", { class: "node" + (S.sel === r.i ? " sel" : ""), tabindex: "0", role: "button",
          "aria-label": r.symbol + " " + r.para_ref,
          onclick: function () { select(r.i); },
          onkeydown: function (e) { if (e.key === "Enter") select(r.i); } });
        g.appendChild(sv("circle", { cx: x, cy: cy, r: 4.6, fill: forceColor(r.force),
          "fill-opacity": r.tier === "A" ? 0.95 : 0.45 }));
        g.appendChild(sv("title", { text: r.symbol + " ¶" + r.para_ref + " — " + (r.obligation_verb || "") }));
        svg.appendChild(g);
      });
    });
    stage.appendChild(el("div", { class: "chart-shell" }, svg));
  }

  /* -- chain: the designation line -- */
  function viewChain() {
    var stage = $("stage");
    stage.appendChild(head("The designation line",
      "Every paragraph in the corpus that builds the sanctions route: from the Council stating an " +
      "intention, through expertise and information requirements, to the criteria themselves, the two " +
      "designations that name conduct, and the one regime where sexual violence became a benchmark for lifting measures."));
    var set = ROWS.filter(function (r) { return r.designation_role; })
      .sort(function (a, b) { return a.year - b.year || a.number - b.number; });
    var order = { policy: 0, capacity: 1, criterion: 2, designation: 3, consequence: 4 };
    var lanes = ["policy", "capacity", "criterion", "designation", "consequence"];
    var LAB = { policy: "stated intention", capacity: "capacity and information",
      criterion: "criterion in a regime", designation: "designation applied", consequence: "consequence" };
    var padL = 150, colW = 30, rowH = 58, padT = 26;
    var W = padL + (YMAX - YMIN + 1) * colW + 40, H = padT + lanes.length * rowH + 20;
    var svg = sv("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "The designation line over time" });
    for (var y = YMIN; y <= YMAX; y += 5) {
      var x = padL + (y - YMIN) * colW + colW / 2;
      svg.appendChild(sv("line", { class: "grid-line", x1: x, y1: padT - 12, x2: x, y2: H - 12, "stroke-dasharray": "2 4" }));
      svg.appendChild(sv("text", { class: "tick-text", x: x, y: padT - 18, "text-anchor": "middle", text: y }));
    }
    lanes.forEach(function (ln, i) {
      var cy = padT + i * rowH + 12;
      svg.appendChild(sv("text", { class: "axis-label", x: padL - 12, y: cy + 4, "text-anchor": "end", text: LAB[ln] }));
      svg.appendChild(sv("line", { class: "grid-line", x1: padL - 4, y1: cy + 16, x2: W - 20, y2: cy + 16 }));
    });
    var seen = {};
    set.forEach(function (r) {
      var lane = order[r.designation_role] === undefined ? 0 : order[r.designation_role];
      var key = lane + ":" + r.year; seen[key] = (seen[key] || 0) + 1;
      var x = padL + (r.year - YMIN) * colW + colW / 2 + ((seen[key] - 1) * 11);
      var cy = padT + lane * rowH + 12;
      var g = sv("g", { class: "node" + (S.sel === r.i ? " sel" : ""), tabindex: "0", role: "button",
        "aria-label": r.symbol + " " + r.para_ref, onclick: function () { select(r.i); },
        onkeydown: function (e) { if (e.key === "Enter") select(r.i); } });
      g.appendChild(sv("circle", { cx: x, cy: cy, r: 6.5, fill: catColor(r.category), "fill-opacity": 0.92 }));
      g.appendChild(sv("text", { x: x, y: cy - 11, "text-anchor": "middle", class: "ring-label", text: r.number }));
      g.appendChild(sv("title", { text: r.symbol + " ¶" + r.para_ref + "\n" + (r.criterion_form || r.designation_role) + "\n" + r.text_verbatim.slice(0, 220) }));
      svg.appendChild(g);
    });
    stage.appendChild(el("div", { class: "chart-shell" }, svg));
    var conflicts = ROWS.filter(function (r) { return r.type_conflict && r.type_conflict !== "no"; });
    var p = el("div", { class: "panel", style: { marginTop: "14px" } }, el("h3", { text: "Where the inherited typology and the text disagree" }));
    conflicts.forEach(function (r) {
      p.appendChild(el("div", { class: "conflict" },
        el("button", { class: "linkish sym", type: "button", onclick: function () { select(r.i); },
          text: r.symbol + " ¶" + r.para_ref }),
        el("span", { text: " labelled " }), el("b", { text: r.designation_type_inherited || "—" }),
        el("span", { text: ", textual form " }), el("b", { text: r.criterion_form || "—" }),
        el("span", { text: " → " }), el("b", { text: r.designation_type_derived || "—" })));
    });
    stage.appendChild(p);
  }

  /* -- carry -- */
  function viewCarry(rs) {
    var stage = $("stage");
    var set = ROWS.filter(function (r) { return r.carried_from; })
      .sort(function (a, b) { return b.carried_similarity - a.carried_similarity; });
    stage.appendChild(head("Language carried forward",
      "Paragraphs whose wording already existed earlier on the same track, with the similarity of the " +
      "two texts. A renewal that reproduces last year's paragraph adds a row to the count and nothing " +
      "to the record; this view is what lets an annual series be discounted for that."));
    var t = el("table", { class: "records" });
    t.appendChild(el("thead", {}, el("tr", {},
      el("th", { text: "Paragraph" }), el("th", { text: "Carried from" }), el("th", { text: "Similarity" }),
      el("th", { text: "Gap" }), el("th", { text: "Pattern" }), el("th", { text: "Track" }))));
    var tb = el("tbody", {});
    set.forEach(function (r) {
      var bar = el("span", { class: "simbar" }, el("i", { style: { width: (r.carried_similarity * 100) + "%",
        background: r.carried_similarity >= 0.95 ? "var(--f4)" : r.carried_similarity >= 0.75 ? "var(--f2)" : "var(--f0)" } }));
      tb.appendChild(el("tr", { onclick: function () { select(r.i); }, tabindex: "0" },
        el("td", {}, el("span", { class: "sym", text: r.symbol + " ¶" + r.para_ref })),
        el("td", {}, el("span", { class: "sym", text: r.carried_from })),
        el("td", {}, bar, el("span", { class: "simnum", text: r.carried_similarity.toFixed(2) })),
        el("td", { text: r.carry_gap_years ? r.carry_gap_years + "y" : "" }),
        el("td", { class: "desc", text: r.carry_pattern }),
        el("td", { text: r.track })));
    });
    t.appendChild(tb);
    stage.appendChild(el("div", { class: "chart-shell" }, t));
  }

  /* -- table -- */
  function viewTable(rs) {
    var stage = $("stage");
    stage.appendChild(head("The paragraphs",
      "One row per coded paragraph. Click a row for the full text, its provenance and its links."));
    if (!rs.length) { stage.appendChild(empty()); return; }
    var cols = [["symbol", "Resolution"], ["year", "Year"], ["para_ref", "¶"], ["track", "Track"],
      ["tier", "Tier"], ["obligation_verb", "Verb"], ["status", "Provenance"], ["text_verbatim", "Text"]];
    var sorted = rs.slice().sort(function (a, b) {
      var k = S.sortKey, x = a[k], y = b[k];
      if (typeof x === "string") return S.sortDir * String(x).localeCompare(String(y));
      return S.sortDir * ((x || 0) - (y || 0));
    });
    var t = el("table", { class: "records" });
    var tr = el("tr", {});
    cols.forEach(function (c) {
      tr.appendChild(el("th", { onclick: function () {
        if (S.sortKey === c[0]) S.sortDir *= -1; else { S.sortKey = c[0]; S.sortDir = 1; }
        render();
      }, text: c[1] + (S.sortKey === c[0] ? (S.sortDir > 0 ? " ↑" : " ↓") : "") }));
    });
    t.appendChild(el("thead", {}, tr));
    var tb = el("tbody", {});
    sorted.slice(0, 400).forEach(function (r) {
      tb.appendChild(el("tr", { onclick: function () { select(r.i); }, tabindex: "0",
        onkeydown: function (e) { if (e.key === "Enter") select(r.i); } },
        el("td", {}, el("span", { class: "sym", html: hl(r.symbol) })),
        el("td", { text: r.year }),
        el("td", {}, el("span", { class: "sym", text: r.para_ref || "—" })),
        el("td", { html: hl(r.track) }),
        el("td", {}, el("span", { class: "tag", text: r.tier })),
        el("td", { text: r.obligation_verb || "—" }),
        el("td", {}, el("span", { class: "prov " + provClass(r.status), text: r.status.replace("inherited — ", "") })),
        el("td", { class: "desc", html: hl(r.text_verbatim.slice(0, 150)) + (r.text_verbatim.length > 150 ? "…" : "") })));
    });
    t.appendChild(tb);
    stage.appendChild(el("div", { class: "chart-shell" }, t));
  }
  function provClass(s) {
    if (s === "added") return "added";
    if (/corrected|struck|re-tiered/.test(s)) return "changed";
    if (/no qualifying/.test(s)) return "empty";
    return "kept";
  }

  /* -- analysis -- */
  function bar(title, entries, colorFn, note) {
    var max = Math.max.apply(null, entries.map(function (e) { return e[1]; }).concat([1]));
    var p = el("div", { class: "panel" }, el("h3", { text: title }));
    entries.forEach(function (e) {
      p.appendChild(el("div", { class: "bar-row" },
        el("span", { class: "name", text: e[0], title: e[0] }),
        el("span", { class: "track" }, el("span", { class: "fill", style: {
          width: (100 * e[1] / max) + "%", background: colorFn ? colorFn(e[0]) : "var(--accent)" } })),
        el("span", { class: "num", text: e[1] })));
    });
    if (note) p.appendChild(el("div", { class: "stat-note", style: { marginTop: "8px" }, text: note }));
    return p;
  }
  function viewAnalysis(rs) {
    var stage = $("stage");
    stage.appendChild(head("What the filtered set contains",
      "Every figure describes the " + rs.length + " paragraphs currently in view."));
    if (!rs.length) { stage.appendChild(empty()); return; }
    var panels = el("div", { class: "panels" });
    var resns = {}; rs.forEach(function (r) { resns[r.number] = 1; });
    var carried = rs.filter(function (r) { return r.carried_from; });
    panels.appendChild(el("div", { class: "panel" }, el("h3", { text: "At a glance" }),
      el("div", { class: "stat-big", text: rs.length + " paragraphs" }),
      el("div", { class: "stat-note", text: "across " + Object.keys(resns).length + " resolutions and " +
        Object.keys(rs.reduce(function (m, r) { m[r.track] = 1; return m; }, {})).length + " tracks" }),
      el("div", { class: "stat-note", style: { marginTop: "6px" },
        text: carried.length + " carry wording from an earlier resolution" }),
      el("div", { class: "stat-note", style: { marginTop: "6px" },
        text: rs.filter(function (r) { return r.status === "added"; }).length + " were added by the 2026 verification" })));
    var f = {}; rs.forEach(function (r) { if (r.force) f[r.force] = (f[r.force] || 0) + 1; });
    panels.appendChild(bar("Force of the verb",
      FORCE.map(function (x) { return [x.label, f[x.k] || 0]; }).filter(function (e) { return e[1]; }),
      function (name) { var k = FORCE.filter(function (x) { return x.label === name; })[0]; return forceColor(k ? k.k : ""); }));
    var pv = {}; rs.forEach(function (r) { if (r.provision_type) pv[r.provision_type] = (pv[r.provision_type] || 0) + 1; });
    panels.appendChild(bar("Kind of provision", Object.keys(pv).map(function (k) { return [k, pv[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; })));
    var tk = {}; rs.forEach(function (r) { tk[r.track] = (tk[r.track] || 0) + 1; });
    panels.appendChild(bar("Tracks", Object.keys(tk).map(function (k) { return [k, tk[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; }).slice(0, 12)));
    var st = {}; rs.forEach(function (r) { st[r.status] = (st[r.status] || 0) + 1; });
    panels.appendChild(bar("Provenance", Object.keys(st).map(function (k) { return [k.replace("inherited — ", ""), st[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; }), null,
      "Every inherited reference is accounted for: kept, corrected, re-tiered or struck."));
    stage.appendChild(panels);
  }

  /* ---------- drawer ---------- */
  function select(i) {
    S.sel = i; renderDrawer(); writeURL();
    Array.prototype.forEach.call(document.querySelectorAll("#stage .node"), function (n) { n.classList.remove("sel"); });
  }
  function closeDrawer() { S.sel = null; $("drawer").setAttribute("data-open", "false"); $("scrim").removeAttribute("data-show"); writeURL(); }
  function renderDrawer() {
    var r = ROWS[S.sel];
    var d = $("drawer");
    if (!r) { d.setAttribute("data-open", "false"); return; }
    d.setAttribute("data-open", "true");
    if (window.matchMedia && window.matchMedia("(max-width:1020px)").matches) $("scrim").setAttribute("data-show", "true");
    var h = $("drawerHead"); clear(h);
    h.appendChild(el("div", { style: { flex: "1" } },
      el("h2", { class: "sym", text: r.symbol + (r.para_ref ? "  ¶" + r.para_ref : "") }),
      el("div", { style: { fontSize: "12.5px", color: "var(--ink-2)" },
        text: r.year + " · " + r.track + " · " + r.category })));
    h.appendChild(el("button", { class: "btn icon", type: "button", "aria-label": "Close", onclick: closeDrawer, text: "✕" }));
    var b = $("drawerBody"); clear(b);
    b.appendChild(el("div", { class: "chips", style: { marginBottom: "12px" } },
      el("span", { class: "tag", text: "tier " + r.tier }),
      r.provision_type ? el("span", { class: "tag", text: r.provision_type }) : null,
      r.force ? el("span", { class: "tag", style: { color: forceColor(r.force), borderColor: "currentColor" },
        text: FORCE_BY[r.force] ? FORCE_BY[r.force].label : r.force }) : null,
      el("span", { class: "prov " + provClass(r.status), text: r.status.replace("inherited — ", "") })));
    if (r.text_verbatim) b.appendChild(el("blockquote", { class: "para-text", html: hl(r.text_verbatim) }));
    else b.appendChild(el("p", { class: "stat-note", text: "No text — this resolution carries no codable paragraph." }));
    var kv = el("dl", { class: "kv" });
    function row(k, v) { if (!v) return; kv.appendChild(el("dt", { text: k })); kv.appendChild(el("dd", { text: v })); }
    row("Themes", r.themes);
    row("Inherited ref", r.inherited_ref);
    row("Source", r.source_file);
    row("Criterion form", r.criterion_form);
    row("Acts named", r.acts_named);
    row("Inherited type", r.designation_type_inherited);
    row("Derived type", r.designation_type_derived);
    row("Type conflict", r.type_conflict);
    b.appendChild(kv);
    if (r.carried_from) {
      b.appendChild(el("h3", { text: "Carried forward" }));
      b.appendChild(el("p", { class: "stat-note", text: r.carried_from + " · similarity " +
        r.carried_similarity.toFixed(2) + " · " + r.carry_pattern }));
    }
    if (r.note) { b.appendChild(el("h3", { text: "Verification note" })); b.appendChild(el("p", { class: "note-text", text: r.note })); }
    if (r.category_flag) { b.appendChild(el("h3", { text: "Category flag" })); b.appendChild(el("p", { class: "note-text warn", text: r.category_flag })); }
    b.appendChild(el("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "16px" } },
      el("a", { class: "btn", href: r.un_record, target: "_blank", rel: "noopener noreferrer", text: "UN record ↗" }),
      el("a", { class: "btn", href: r.pdf, target: "_blank", rel: "noopener noreferrer", text: "PDF ↗" }),
      el("button", { class: "btn", type: "button", text: "Copy citation", onclick: function () {
        var c = "United Nations Security Council, Resolution " + r.number + " (" + r.year + "), " +
          r.symbol + (r.para_ref ? ", para. " + r.para_ref : "") + ".";
        navigator.clipboard && navigator.clipboard.writeText(c);
      } })));
  }

  /* ---------- chrome ---------- */
  function chips(mount, items, get, set) {
    items.forEach(function (it) {
      mount.appendChild(el("button", { class: "chip", type: "button", "aria-pressed": "false",
        "data-k": it.k, title: it.desc || "", onclick: function () { set(it.k); render(); } },
        it.swatch ? el("i", { class: "swatch", style: { background: it.swatch } }) : null,
        it.label + (it.n !== undefined ? "  " + it.n : "")));
    });
  }
  function build() {
    var search = $("search");
    search.value = S.q;
    search.addEventListener("input", debounce(function () { S.q = search.value.trim(); render(); }, 160));
    $("searchClear").addEventListener("click", function () { search.value = ""; S.q = ""; render(); });

    chips($("tierChips"), TIERS.map(function (t) {
      return { k: t.k, label: t.label, desc: t.desc, n: ROWS.filter(function (r) { return r.tier === t.k; }).length };
    }), null, function (k) {
      var i = S.tiers.indexOf(k); if (i < 0) S.tiers.push(k); else S.tiers.splice(i, 1);
    });
    chips($("catChips"), CATS.map(function (c) {
      return { k: c, label: c.replace(" WPS/CRSV", "").replace("-Specific", ""), swatch: catColor(c),
        n: ROWS.filter(function (r) { return r.category === c; }).length };
    }), null, function (k) { var i = S.cats.indexOf(k); if (i < 0) S.cats.push(k); else S.cats.splice(i, 1); });
    chips($("forceChips"), FORCE.map(function (f) {
      return { k: f.k, label: f.label.split(" /")[0], swatch: forceColor(f.k),
        n: ROWS.filter(function (r) { return r.force === f.k; }).length };
    }), null, function (k) { var i = S.force.indexOf(k); if (i < 0) S.force.push(k); else S.force.splice(i, 1); });

    var ts = $("trackSelect");
    ts.appendChild(el("option", { value: "", text: "All tracks" }));
    TRACKS.forEach(function (t) {
      ts.appendChild(el("option", { value: t, text: t + " (" + ROWS.filter(function (r) { return r.track === t; }).length + ")" }));
    });
    ts.addEventListener("change", function () { S.track = ts.value; render(); });

    $("statusSelect").addEventListener("change", function (e) { S.status = e.target.value; render(); });
    $("carriedOnly").addEventListener("change", function (e) { S.carriedOnly = e.target.checked; render(); });
    [$("yearFrom"), $("yearTo")].forEach(function (s) {
      s.min = YMIN; s.max = YMAX; s.step = 1;
      s.addEventListener("input", function () {
        var a = +$("yearFrom").value, b = +$("yearTo").value;
        S.y0 = Math.min(a, b); S.y1 = Math.max(a, b); render();
      });
    });
    $("reset").addEventListener("click", function () {
      S.q = ""; S.tiers = ["A"]; S.cats = []; S.track = ""; S.force = []; S.status = "";
      S.carriedOnly = false; S.y0 = YMIN; S.y1 = YMAX; $("search").value = ""; render();
    });
    Array.prototype.forEach.call(document.querySelectorAll("#viewSeg button"), function (b) {
      b.addEventListener("click", function () { S.view = b.getAttribute("data-view"); render(); });
    });
    $("railToggle").addEventListener("click", function () {
      var r = $("rail");
      if (r.getAttribute("data-open") === "true") { r.removeAttribute("data-open"); $("scrim").removeAttribute("data-show"); }
      else { r.setAttribute("data-open", "true"); $("scrim").setAttribute("data-show", "true"); }
    });
    $("scrim").addEventListener("click", function () {
      $("rail").removeAttribute("data-open"); $("scrim").removeAttribute("data-show");
      if (S.sel !== null) closeDrawer();
    });
    $("themeToggle").addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      if (!cur) { var dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches; cur = dark ? "dark" : "light"; }
      var next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("crsv-theme", next); } catch (e) {}
      render(); if (S.sel !== null) renderDrawer();
    });
    $("exportBtn").addEventListener("click", function () {
      var rs = rows();
      var cols = ["symbol", "number", "year", "category", "track", "para_ref", "tier", "provision_type",
        "obligation_verb", "force", "status", "inherited_ref", "carried_from", "carried_similarity",
        "note", "text_verbatim", "un_record", "pdf"];
      var q = function (v) { v = v === undefined || v === null ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      var csv = [cols.join(",")].concat(rs.map(function (r) { return cols.map(function (c) { return q(r[c]); }).join(","); })).join("\n");
      var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      var a = el("a", { href: URL.createObjectURL(blob), download: "crsv-selection.csv" });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== $("search")) { e.preventDefault(); $("search").focus(); }
      else if (e.key === "Escape" && S.sel !== null) closeDrawer();
    });
    try { var st = localStorage.getItem("crsv-theme"); if (st) document.documentElement.setAttribute("data-theme", st); } catch (e) {}
  }

  function sync(rs) {
    ["tierChips", "catChips", "forceChips"].forEach(function (id) {
      var arr = id === "tierChips" ? S.tiers : id === "catChips" ? S.cats : S.force;
      Array.prototype.forEach.call(document.querySelectorAll("#" + id + " .chip"), function (b) {
        b.setAttribute("aria-pressed", arr.indexOf(b.getAttribute("data-k")) >= 0 ? "true" : "false");
      });
    });
    $("trackSelect").value = S.track;
    $("statusSelect").value = S.status;
    $("carriedOnly").checked = S.carriedOnly;
    $("yearFrom").value = S.y0; $("yearTo").value = S.y1;
    $("yearLabel").textContent = S.y0 + "–" + S.y1;
    Array.prototype.forEach.call(document.querySelectorAll("#viewSeg button"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-view") === S.view ? "true" : "false");
    });
    var res = {}; rs.forEach(function (r) { res[r.number] = 1; });
    $("count").innerHTML = "<b>" + rs.length + "</b> paragraphs · <b>" + Object.keys(res).length + "</b> resolutions";
  }

  function render() {
    var rs = rows();
    sync(rs);
    clear($("stage"));
    if (S.view === "strength") viewStrength(rs);
    else if (S.view === "tracks") viewTracks(rs);
    else if (S.view === "chain") viewChain(rs);
    else if (S.view === "carry") viewCarry(rs);
    else if (S.view === "table") viewTable(rs);
    else viewAnalysis(rs);
    $("stage").appendChild(credits());
    writeURL();
  }

  function credits() {
    return el("footer", { class: "credits" },
      el("div", { class: "credit-grid" },
        el("div", {}, el("h3", { text: "Project lead and conceptual framework" }),
          el("p", {}, el("strong", { text: "Tonderai Chikuhwa" }),
            el("span", { text: "Chief of Staff and Senior Policy Adviser, UN Office of the Special Representative of the Secretary-General on Sexual Violence in Conflict" }),
            el("span", { text: "Hubert H. Humphrey Visiting Professor of Political Science, Macalester College (2024)" }))),
        el("div", {}, el("h3", { text: "Lead developer" }),
          el("p", {}, el("strong", { text: "Zhijun He" }),
            el("span", { text: "Research Fellow to Tonderai Chikuhwa" }),
            el("span", { text: "MacMillan Center, Yale University" }))),
        el("div", {}, el("h3", { text: "Dataset" }),
          el("p", {}, el("span", { text: "v2026.09 · " + ROWS.length + " coded paragraphs across 72 resolutions" }),
            el("span", { text: "Every paragraph verified against its source document" }),
            el("span", { text: "Provisional: coding decisions pending review by the project lead" })))),
      el("p", { class: "copyright", text: "© 2024–2026 Tonderai Chikuhwa. Built under his direction; cite the project lead when reusing the dataset or the coding scheme." }));
  }

  readURL();
  build();
  render();
  if (S.sel !== null) renderDrawer();
})();
