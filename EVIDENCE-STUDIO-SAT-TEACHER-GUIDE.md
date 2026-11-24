# Evidence Studio: SAT · Year 12 · Teacher guide

**File:** `evidence-studio-sat.html` (VCE Systems Engineering Units 3 & 4, School-assessed Task)
**For:** students building their multimodal record of evidence across Units 3 and 4
**Use:** a 30-minute launch at the start of Unit 3, then about 5 minutes a week. Do a quick index check before each submission.

## The goal

Every student responds to **all eight SAT criteria**, and the assessor can **find each response immediately**. Students keep their own style and format (PowerPoint, Notion or a website, OneNote, Canva, video, physical folio). The studio makes sure that style never hides a criterion.

It follows your submission structure:

| Submission | Criteria | What the studio does |
|---|---|---|
| **End of Unit 3** | **C1–C3** | Unit 3 students see C1–C3 first in the guide, the self-audit and the index cover. |
| **Unit 4** | **C4–C8, submitted alongside C1–C3** | The Unit 4 view adds C4–C8. The index cover can include all eight, so C1–C3 stay findable in the final record. |

The VCAA administrative information doesn't specify how the record should be organised or labelled. That's left to the student, which is why the signposting habits below matter.

## Two tests

1. **The Evidence Test (each entry):** SHOW · SAY · WHY · NEXT. This is the same rule as the Year 11 studio, with SI units and links to the student's evaluation criteria added.
2. **The Find-it-fast Test (the whole record):**
   - **TAG:** every section wears its criterion badge (C1–C8), in the same spot.
   - **INDEX:** a criteria index up front gives exact locations.
   - **CLAIM:** each criterion section opens with "This section shows C6: …".
   - **DATE:** all notes, photos, audio and video are dated or time-stamped. VCAA requires this.

## The five parts

| Part | What students do |
|---|---|
| **① Evidence Makeover** | 8 rounds, **one per criterion**, using a fictional student's automated greenhouse vent. Students act as the assessor and select every real problem; each round has one plausible non-problem, such as "risk assessments belong in Unit 4" or "photos can't count as evidence". Then they pick the assessor-ready upgrade. Rounds cover evaluation criteria (C1), a weighted decision matrix (C2), a hierarchy-of-control risk table (C3), a tagged and dated production log (C4), a captioned demo with timestamps (C5), a full VCAA-style test (C6), planned vs actual (C7) and an evaluation with "not verified" (C8). |
| **② My signature** | Students design **criterion badges C1–C8** (each criterion keeps a fixed colour, drawn in the student's style), a **claim banner**, and three devices: a **test card with VCAA's test fields** (test # · date · criterion, purpose, procedure + risk controls, formula, expected and actual in SI units, explanation, modification), a decision stamp and a fault ticket. Downloads are SVG (PowerPoint: Insert → Pictures → Convert to Shape) or PNG. |
| **③ Criteria guide** | For each criterion: **what the record must include** (VCAA's 2026 list, organised by criterion), **strong when…**, moves that suit it, and a **claim line** to adapt. Links to the **9–10 Evidence Lab** for High vs Very High wording. |
| **④ Evidence moves** | 15 moves, including the signposting moves (criterion badge, claim banner, criteria index) and SAT-specific ones (weighted decision matrix, risk table by hierarchy level, planned vs actual timeline, VCAA test card). |
| **⑤ Index & self-audit** | For each criterion: the claim line, where it is, a tick and location for each VCAA requirement, what's still needed, and the four find-it-fast checks. When every requirement is ticked and all four checks are lit, the criterion shows as **assessor-ready**. Exports: an **index cover page** in the student's style (SVG/PNG, Unit 3 = C1–C3, Unit 4 = all eight), the index as **text** or as **Markdown** (for Notion and websites), a **claim banner** for each criterion, and a **weekly drop** PNG for Teams (readiness per criterion, this week, next week, still needed, stuck on). |

### How the requirements are organised

VCAA lists the required contents of the record by unit, not by criterion. The studio places each requirement under the criterion it most directly evidences:

- **C1:** brief, factors, existing solutions, evaluation criteria (for the system and the process), cited research
- **C2:** ideas, about three options, standards-compliant drawings, modelling, component function, comparisons
- **C3:** risk management, proposed diagnostic tests, timeline and milestones, work plan
- **C4:** dated production record, decisions and modifications, safe use of tools and processes
- **C5:** the completed system, a demonstration of operation, how it meets the brief
- **C6:** the testing report, with each test's purpose, procedure, formulas and SI results, and justified modifications
- **C7:** planned vs actual, justified changes, budget and time
- **C8:** evaluation of the system and the process, factors, concepts, improvements

Please check this mapping against how you assess. The text lives in the `CRITERIA` array in the file, so it's easy to adjust. Teacher observations and checklists also contribute to C4, C5 and C7, so the studio is about the student's own evidence only.

## Suggested use

**Launch (start of Unit 3, about 30 min)**
1. Home screen: the two tests, and the Unit 3 / Unit 4 submission structure (3 min).
2. Students play the Makeover (15 min). Discuss: "In which rounds was the problem that the evidence was *there* but hard to *find*?"
3. Students design their signature and download their badges and test card (10 min).

**Weekly (5 min)**
1. Update the self-audit for the current unit's criteria.
2. Make the weekly drop and post it on Teams.
3. Scan the drops for criteria that aren't moving, "stuck on…" notes and missing find-it-fast checks.

**Before each submission**
- Students export the **index cover** (Unit 3: C1–C3; Unit 4: all eight) and put it at the front of their record.
- Spot-check with a 30-second test: open the record, pick a criterion, and see whether you can find it straight away.

**Authentication links (from the VCAA requirements)**
- The **DATE** check reinforces that evidence must be dated or time-stamped.
- Weekly drops give a dated trail that supports your observation records. They don't replace the authentication record form.
- Remind students that external support and generative AI used for programming must be acknowledged.

## Access, progress and reset

- **Students:** `index.html` → **SAT Journey** → **Evidence Studio: SAT**, or go directly to `evidence-studio-sat.html`.
- Progress saves in the browser (`seEvidenceStudioSAT`), separately from the Year 11 studio. Name and class are filled in from other games if present.
- Reset: ↺, then click again to confirm.

## Lock / dashboard

- Lock id **9**. The studio stays open if there is no row for level 9.
- To control it: `insert into level_locks (level, locked) values (9, false);`.
- Research missions now use lock ids **10 and up** (comment updated in `index.html`).

## Tests

`tests/evidence-studio-sat.spec.js` is a Playwright browser test (see the file header). It covers:

- sign-in, unit phase and name reuse
- all 8 Makeover rounds (criterion order, distractors, comebacks)
- badge, test card and claim banner downloads
- criteria guide filtering, and requirements under the right criteria
- the self-audit readiness logic
- ticks toggling once after revisiting the page
- the Unit 3 index cover (C1–C3 only) and the all-eight cover
- the Markdown index and the weekly drop
- persistence, hub integration and no horizontal overflow

44/44 passing at 1366×650.
