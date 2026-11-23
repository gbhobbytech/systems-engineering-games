# Step Up · Teacher guide

**Game:** `step-up.html` (VCE Systems Engineering Units 1 & 2, study design from 2026)
**For:** Year 11 Step Up, with no prior experience assumed
**Digital time:** about 20–30 minutes, then discussion and a practical

The game is separate from the Units 3 & 4 levels. It has its own saved progress (`seStepUpProgress`) and player name (`seStepUpPlayer`), so it never reads or changes Units 3 & 4 data.

## Before the lesson

- Open `step-up.html` on the front screen and check it loads. Students can reach it from `index.html` using the link "Year 11 Step Up? …" or the **YEAR 11 STEP UP** card.
- **Optional teacher lock.** The game checks lock level **5**. If there is no lock row, it stays open. To control it from the dashboard's lock panel, add the row once in Supabase:
  ```sql
  insert into level_locks (level, locked) values (5, false);
  ```
  After that, **Step Up · Units 1 & 2** appears in the dashboard's lock list. It is hidden until the row exists. If your `level_locks` policies limit which rows the teacher account can update, also allow level 5.
- **Checkpoints.** Pause screens are on by default. To turn them off, use `step-up.html?checkpoints=off`.
- **Real tasks.** The game tells students that projects are *examples only* and that you confirm tasks and dates. Be ready to say what your actual Unit 1 and Unit 2 briefs are, or that they are still to come.

## Lesson flow and pause points

| Time | What students do | Natural pause point (on-screen checkpoint) |
|---|---|---|
| 0–3 min | Splash, sign-in, Welcome Gate (map of the two zones) | Demonstrate movement, Enter, Esc and **G** (Jargon Buster) on the front screen |
| 3–11 min | **Unit 1 zone:** Electronics Lab (input/process/output sort, one-change fix), Sustainable Design Studio (compare two lighting designs, energy = power × time) | ⏸ *Unit 1 zone clear* |
| 11–19 min | **Unit 2 zone:** Mechanical Workshop (lever vs pulley, the force–distance trade, spear-throwers), Inclusive Design Studio (handle for limited grip) | ⏸ *Unit 2 zone clear* |
| 19–26 min | **Shared:** Safety Bay, Logbook Hut, Test Bench, Integrity Office (short) | ⏸ *Shared spaces clear*, then ⏸ *Ready for the Exit Gate* |
| 26–30 min | Exit Gate "Which unit?" check (6 scenarios), then passport | Students download (PNG) and/or print |

Zones can be done in any order, so checkpoints appear when each one is finished. Fast finishers can try the optional ✚ places: Command Tower (identify / describe / explain), Time Tunnel, Spin Lab and Mystery Shrine.

**If time is short:** stop at the *Ready for the Exit Gate* checkpoint. Do the "Which unit?" check as a whole class next lesson, then make passports.

## Discussion prompts

- **After Unit 1:** Point at something in the room (projector, air-con, phone). What's its input, process and output? Where would a sensor save energy?
- **Sustainability:** Design B saves energy but needs more parts. How would we decide if that's worth it? What would we measure?
- **After Unit 2:** A 3 : 1 lever needs a third of the force. What do you "pay" for that? Who might find an everyday object hard to use, and how would you find out rather than guess?
- **Inclusive design (keep it respectful):** Why is "one fix suits everyone" a trap? Who should be involved in testing?
- **History:** Spear-throwers and the Budj Bim aquaculture system show long traditions of engineering. Where can we learn about these from community sources?
- **Shared habits:** Your prototype works but you have no test results. What now? Which evidence habit will be hardest to keep up?
- **Integrity:** What counts as appropriate help in this class? What are the AI rules for the first task?

## How the game rewards learning

- Wrong answers give an explanation and a retry. The wrong option is crossed out.
- A **Comeback** is counted when a student fixes a mistake. Missed final-check scenarios come back until they're right.
- No ranks, no timers, and no points for getting it right first time. Cards show missions completed.
- Students make their own choices in the missions (a component, a sustainability problem, a mechanism, a user need, an evidence habit). These fill the passport automatically and can be edited.

## Passport and first practical

The **My Year in Systems** passport includes:

- a plain-language summary of each unit
- their Unit 1 component and sustainability interest
- their Unit 2 mechanism and user need
- an evidence habit
- one question they still have
- confidence before and after.

**Print** produces two A4 pages. Page 2 is a **first practical** worksheet with space for:

1. the simple system they built or investigated
2. a photo or sketch
3. one observation and why they think it happened
4. a next step.

**Suggested first practical (15–25 min, choose one):**

- **Unit 1 flavour:** build an LED + resistor + switch circuit (or a light-sensor night light in a simulator such as TinkerCAD). Change one thing, such as the resistor value, and record what happens to brightness.
- **Unit 2 flavour:** use a ruler-and-pencil lever with a small load. Move the fulcrum, use a spring scale or a "how hard did it feel" scale, and record effort for two positions.

Either way, students photograph or sketch the setup, write one observation, and write one next step. Collect their passports to see their questions and interests when you plan the units.

## Curriculum notes

- Unit content follows the VCAA *VCE Systems Engineering Study Design* (from 2026), Units 1 and 2, paraphrased for students.
- **What the game says about assessment:** each unit has two outcomes and is school-assessed. Your teacher chooses tasks from the study design options: a short written report, an oral presentation or a visual presentation, *plus* a multimodal record of evidence.
- **What the game never states:** weightings, deadlines, Units 3 & 4 SAT criteria or study-score percentages.
- **Examples vs requirements:** project ideas (self-switching lights, plant watering, lifting aids, jar openers, etc.) are clearly labelled as examples, not confirmed class projects.
- **Please review** the Aboriginal and Torres Strait Islander content (spear-throwers, including the Dharug word "woomera"; Gunditjmara aquaculture at Budj Bim, at least 6,600 years old) against your school's and local community's guidance. Adjust the wording in `roomData.mwork` / `roomData.tunnel` if needed.
