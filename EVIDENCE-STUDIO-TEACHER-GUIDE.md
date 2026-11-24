# Evidence Studio · Year 11 Build & Test · Teacher guide

**File:** `evidence-studio.html` (VCE Systems Engineering Units 1 & 2)
**For:** the build-and-test part of the Year 11 project: constructing, testing, analysing and evaluating a system
**Use:** a 20–30 minute launch lesson, then about 5 minutes a week until submission

## Why it exists

Students were filling in the portfolio template, and many did less than it asked. The Evidence Studio keeps what the template *required* but hands the *format* to the student:

- **The content stays fixed.** There are 15 "evidence beats", the things the record must prove. They come straight from the Unit 2 Outcome 2 Evidence Portfolio, and each has a "strong when…" bar taken from the Student Guide. For example: one useful photo beats ten random ones; a KPI is a number, not "works well"; an improvement names the change, cites the evidence and explains the effect.
- **The form is free.** Students choose where they build (PowerPoint, OneNote, Canva, a website or Notion, a paper logbook, a video log) and how each beat is shown.
- **One quality rule applies in any style:** the **Evidence Test** — **SHOW** (a clear, dated photo, video or data from *their* build), **SAY** (specific: names, numbers, units), **WHY** (a reason backed by an observation or measurement), **NEXT** (what it means for the next step). It extends the Guide's "Show it · Explain it · Reflect" slide.

The study design allows this flexibility. A record of evidence may combine text, images, simulations, video, audio and checklists, in hard copy, electronic form or both.

> **Study design note (2026):** under the new study design, **Unit 1 is electrotechnological systems design and Unit 2 is mechanical systems design**. The original portfolio was written for Unit 2 electrotechnology under the 2019–2025 design. The studio is therefore general "build & test" and suits either unit. Its worked example (Jordan's automatic plant waterer) has both electronic and mechanical parts.

## The five parts

| Part | What students do | What you get |
|---|---|---|
| **① Evidence Makeover** | 7 rounds. Jordan's weak entries cover a build stage, a modification, KPIs, test results, a fault, an improvement and a final evaluation. Students (1) select every real problem (one option in each round is a plausible non-problem, such as "it's too short" or "problems look bad") and (2) pick the rewrite that passes the Evidence Test. Mistakes give feedback and a retry, and fixing them earns a **Comeback**. | Students learn the quality bar *before* they start, with no template boxes to fill. |
| **② My signature** | Students design three recurring devices: a **decision stamp**, a **fault ticket** and a **test card**. They choose a style (blueprint, lab notebook, neon, sticky note, clean, field journal), an accent colour, an icon, their own names for each device and a tagline. They download blank versions as **SVG** (in PowerPoint: Insert → Pictures, then right-click → **Convert to Shape** to type straight onto it) or **PNG** (Canva, OneNote, printing). | A personal look that is *quicker* than a blank page, with the right fields built in. The fault ticket uses the same problem → suspected cause → test → result → action loop as the Circuit Rescue game. |
| **③ What to show** | 15 beat cards across Prepare, Construct, Test, Analyse, Evaluate and Submit. Each card has *must show*, *strong when*, matching evidence moves, a sentence starter and Jordan's example. | A reference that replaces the template's prompts without dictating the layout. |
| **④ Evidence moves** | 12 ways to show evidence: annotated photo, before/after pair, captioned video, voice memo, sketch with callouts, photo strip, results table and graph, comparison matrix, test card, fault ticket, decision stamp and self-audit. Each has a "strong when…" line. | Variety and personal style, with a quality bar on each move. |
| **⑤ Self-audit & weekly drop** | For each beat, students tick which parts of the Evidence Test it passes (4 ticks = **strong**), record **where it is** ("Slide 7", "Page 4") and note what they **still need**. **Weekly drop** downloads a one-page PNG (progress by stage, this week, next week, still needed, stuck on) to post on Teams. **Copy my evidence index** puts a contents list on the clipboard to paste into their record. | Week-by-week visibility of who is behind, without collecting files, plus an index that makes marking faster. |

## Calibration from strong Year 12 work

The habits the studio teaches are the ones that set the strongest folios apart:

- a criteria/evidence **index** linking to where things are
- a **have / still need** self-audit
- **numbered, dated tests** that build on each other
- **comparison matrices** when several options were tried
- **captioned videos** that say what to watch for
- **honesty about anything not measured** ("not verified" instead of claiming a KPI was met)

No real student work appears in the studio. All examples are fictional.

## Suggested use

**Launch lesson (20–30 min, before construction starts)**
1. Show the home screen and the Evidence Test (2 min).
2. Students play the Evidence Makeover (10–15 min). Pause after round 4 to ask: "Was the best answer always the longest?" (No.)
3. Students design their signature and download it into their chosen tool (10 min).
4. Point them to ③ and ④ as their reference during the build.

**Every week (5 min, for example at the start of a practical lesson)**
1. Students update the self-audit: tick the Evidence Test, add where each item is and what they still need.
2. They make the weekly drop and post the PNG on Teams.
3. Scan the drops for students whose bars aren't moving, or who wrote "stuck on…".

**For less self-driven students**
- Make the weekly drop non-negotiable. It's quick, and it stops the record being reconstructed at the end.
- Ask for **one beat per lesson** using the sentence starter, then the signature device.
- Use the evidence index as the submission cover page: an empty "(not yet)" is easy to spot.

**For students already working well**
- Encourage a distinctive mix of moves and their own signature devices beyond the three provided.
- Push the "strong when…" bars: test chains ("Because Test 2 showed…"), comparison matrices, and honest "not verified" calls.

## Access, progress and reset

- **Students:** `index.html` → **Year 11 · Step Up** → **Evidence Studio: Build & Test**, or go directly to `evidence-studio.html`.
- Progress saves in the browser (`seEvidenceStudio11`). Name and class are filled in from the Step Up games if present, but those games' progress is never changed. The hub shows the studio as done once a student has finished the Makeover, made a signature and made at least one weekly drop.
- **Reset:** ↺ in the header, then click again to confirm. This clears the studio only.
- Text size: A− / A+. Sound: 🔊.

## Lock / dashboard

- Lock id **8**. The studio **stays open if there is no row for level 8**, so no setup is needed.
- To control it from the dashboard: `insert into level_locks (level, locked) values (8, false);`. **Evidence Studio · Year 11** then appears in the dashboard's lock list.
- Future research missions use lock ids **9 and up** (comment updated in `index.html`).

## Planned Year 12 adaptation

The same structure carries over to Units 3 & 4:

- beats re-mapped to the 2026 SAT criteria and required inclusions (investigation, design, planning, production, testing, evaluation)
- a criteria index matching the SAT criteria
- the same Evidence Test and signature devices
- a link to the existing **9–10 Evidence Lab** for format planning

## Tests

`tests/evidence-studio.spec.js` is a Playwright browser test (see the file header for how to run it). It covers:

- sign-in and name reuse
- all 7 Makeover rounds, including wrong answers and comebacks
- signature SVG and PNG downloads (blank templates in the chosen style)
- beat → move links
- self-audit status logic
- weekly drop PNG and evidence index copy
- persistence, hub integration and no horizontal overflow

It has passed at 1366×650, 1280×600 and 900×700.
