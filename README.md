# CRSV in the Security Council — paragraph-level dataset and atlas

Conflict-related sexual violence in United Nations Security Council resolutions, 2000–2025.
409 coded paragraphs drawn from 72 resolutions, each located in its source document and checked
verbatim, with an interactive atlas built on the same data.

**Project lead and conceptual framework:** Tonderai Chikuhwa — Chief of Staff and Senior Policy
Adviser, UN Office of the Special Representative of the Secretary-General on Sexual Violence in
Conflict; Hubert H. Humphrey Visiting Professor of Political Science, Macalester College (2024).

**Lead developer:** Zhijun He — Research Fellow to Tonderai Chikuhwa; MacMillan Center, Yale
University.

© 2024–2026 Tonderai Chikuhwa. Built under his direction. Coding decisions in v2026.09 are
provisional pending his review.

---

## What changed in v2026.09

The earlier dataset recorded 169 paragraph references, a few representative paragraphs per
resolution. This version records every paragraph that carries relevant language, and every entry
now states where it came from.

| | |
| --- | --- |
| Paragraphs | 169 → 409 |
| Verified against source | every one |
| Inherited references with the wrong paragraph number | 12 |
| Records with the wrong country or adoption date | 4 |
| Quotations with no source in their resolution | 1 |
| Resolutions with no codable content | 5 |
| Quotations not reproducing the Council's verb | 3 |

Nothing was silently corrected: the inherited value is preserved beside the corrected one, and the
`status` column says whether a row was kept, corrected, re-tiered, struck or newly added.

## Three variables the earlier structure could not express

**Force.** Every paragraph is classified by its opening verb on an ordinal scale — Decides and
Authorizes, Demands, Condemns, Requests and Calls upon and Urges, Encourages, and the purely
declaratory verbs. The verb is read off the text, not assigned by hand. Counting paragraphs treats
a mandated task and an encouragement as the same unit; this separates them.

**Carry-forward.** 63 paragraphs reproduce wording that already existed earlier on the same track,
with a similarity score and the source paragraph recorded. Nine paragraphs of S/RES/2640 (2022)
match S/RES/2584 (2021), one of them at 0.97. An annual series built on paragraph counts measures
renewal cadence unless this is discounted.

**Designation form.** Sanctions criteria are coded by textual form — enumerated, embedded,
extension, eligibility, generic, by reference — rather than by label. The inherited three-way
typology and the derived form are kept side by side with a conflict flag.

## The atlas

`index.html` is a complete, self-contained page: no build step, no server, no external JavaScript.
It loads the IBM Plex families from Google Fonts and falls back to system faces offline.

Six views: Force (paragraphs per year, stacked by the strength of the verb), Tracks (one row per
situation), Designation line (the sanctions route from stated intention to applied designation),
Carried forward, Paragraphs (the full table), and Analysis. Filters, search across the verbatim
text, deep links and a CSV export of the current selection.

## Deploying

**GitHub Pages** — push this folder to a repository, then Settings → Pages → deploy from the branch
root. `.nojekyll` is present so nothing is filtered.

**Netlify Drop / Cloudflare Pages** — drag the folder in.

**A subdomain** — add a CNAME record at the registrar pointing to the host; the main site can stay
where it is.

## Repository layout

```
index.html                              the built atlas — do not hand-edit
data/crsv-paragraphs-v2026.09.csv       the dataset, 409 rows × 33 columns
data/crsv-paragraphs-v2026.09.json      the same data as loaded by the page
data/paragraph-audit.csv                the 169 inherited references, with adjudications
docs/CRSV-dataset-verification-memo.pdf memo to the project lead: corrections and findings
docs/CODING-RULES.md                    tier definitions and the boundary decisions they rest on
src/                                    app.js, styles.css, shell.html, build.js
```

Rebuild with `node src/build.js` after editing the data or the source.

## Column reference

| column | meaning |
| --- | --- |
| `symbol`, `number`, `year` | the resolution |
| `category`, `track` | instrument type; situation or thematic line |
| `para_ref`, `para_type` | paragraph reference as the document prints it; operative, preambular or annex |
| `tier` | A (CRSV), SEA, CAAC, TIP, D (gender language without violence), none |
| `provision_type` | mandate task, reporting, demand, condemnation, criterion, designation, recital, conduct requirement, hortatory |
| `obligation_verb`, `force`, `force_rank` | the opening verb and its ordinal class |
| `status`, `inherited_ref`, `note` | provenance: what the earlier dataset said and what changed |
| `carried_from`, `carried_similarity`, `carry_class`, `carry_gap_years`, `carry_pattern` | the earlier paragraph this text reproduces |
| `designation_role`, `criterion_form`, `acts_named`, `designation_type_inherited`, `designation_type_derived`, `type_conflict` | sanctions criteria |
| `category_flag` | records whose recorded category the text contradicts |
| `text_verbatim`, `source_file`, `un_record`, `pdf` | the text and where it came from |

## Limits

The 72 resolutions are an inherited selection, not a population; every trend is conditional on it.
Tier assignments are the developer's, documented in `docs/CODING-RULES.md` so they can be tested.
Carry-forward similarity is computed only within these 72 documents, so figures are floors.
Preambular clauses are unnumbered in UN documents; references to them are verifiable by text, not
by number, and are coded only where the inherited dataset already referenced them.

Texts of Security Council resolutions are United Nations documents; the excerpts here are quoted
for research and are subject to UN terms of use.
