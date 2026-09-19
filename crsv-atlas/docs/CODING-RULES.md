# Coding rules for the verification pass

Read this before verifying any resolution file. It exists so that the recall pass — finding
CRSV language the dataset never recorded — applies the same boundary to all 72 documents
rather than drifting from one to the next.

## What the pass does

For each resolution, in this order:

1. **Confirm the document.** Symbol, adoption date, meeting number against the PDF header.
2. **Check every recorded reference.** Does the paragraph number exist, does it carry the
   language attributed to it, is the excerpt verbatim? Many excerpts in the inherited dataset
   end in an ellipsis; restore the full sentence or clause.
3. **Recall pass.** Read the whole document — preamble and operative parts — and list every
   passage that qualifies under the tiers below but is not yet recorded. This is the priority.
4. **Re-code where warranted.** If a resolution's category, track, themes or designation
   pattern no longer fits what the text says, propose the change with the paragraph that
   justifies it. Propose; do not silently change.

## Tiers

**Tier A — in the corpus, recorded as CRSV.**
Language naming sexual violence in conflict directly: rape, sexual slavery, enforced
prostitution, forced pregnancy, enforced sterilisation, sexual violence as a tactic of war
or terrorism, "sexual and gender-based violence" where the conflict context is explicit.
Includes designation criteria, mandate tasks, reporting requirements, Women Protection
Adviser provisions, and monitoring and reporting arrangements under resolution 1960.

**Tier B — recorded, tagged separately as SEA.**
Sexual exploitation and abuse by UN personnel: the zero-tolerance policy, troop-contributing
country obligations, conduct and discipline, vetting, repatriation. This is a different
phenomenon from conflict-related sexual violence committed by parties to a conflict, and
merging the two inflates the count in exactly the place a reader will check. Record it, flag
it `SEA`, and let the interface filter it in or out.

**Tier C — recorded, tagged `CAAC`.**
Children and armed conflict provisions where sexual violence appears among the grave
violations, including monitoring and reporting under resolution 1612 and action plans with
armed forces or groups.

**Tier D — noted in the file, not added as a reference.**
Gender language with no violence component: women's participation in peace processes,
gender advisers, gender-responsive budgeting, WPS implementation in the abstract. Note it in
the verification log so the decision is visible, but do not create a paragraph entry.

**Out.** General protection-of-civilians, general human rights, general humanitarian access
language that never reaches sexual violence, gender-based violence or the children's grave
violations.

## Recording conventions

- Operative paragraphs by number and sub-letter as the document prints them: `4`, `6(f)`,
  `1(a)`, `21(b)`.
- Preambular paragraphs counted from the first preambular clause, recorded as
  `preamble_10`. State in the log how you counted, since PDFs do not number them.
- Excerpts verbatim, with the original's spelling and capitalisation. Use an ellipsis only
  where you have cut the middle of a sentence, never at the end of a truncated quote.
- Where a paragraph qualifies under more than one tier, record the tier that best describes
  the obligation it creates, and note the other.

## Open scope questions for the project lead

These are not verification questions; they are boundary decisions for Tonderai Chikuhwa to
settle, and the answers change what the corpus is:

1. **Resolution 1325 (2000)** and the wider WPS series (1889, 2122, 2493) are absent while
   2242 is present. Is the inclusion rule "resolutions carrying specific CRSV language", or
   "the WPS architecture plus CRSV"? The current set implies the first, inconsistently.
2. **S/RES/2734 (2024)** is coded under Sanctions with the 1267 committee as its track, though
   it is thematic in character. Keep, or split the 1267 line into its own track?
3. **Mission mandate renewals.** 48 of 72 records are mandate renewals. Where a renewal
   reproduces the previous year's CRSV paragraph word for word, is it a new data point or a
   continuation? The answer decides whether annual counts measure Council attention or
   drafting inertia.
