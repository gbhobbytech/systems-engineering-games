# The Controller Challenge: teacher guide

A research mission for VCE Systems Engineering, mainly for Year 11 and also suitable as Year 12 revision. It runs alongside the Word worksheet **SE Controller Challenge Research Worksheet v1.0**. The game guides the investigation and checks understanding. Students still capture screenshots, record findings and write their justifications in the worksheet.

- **File:** `controller-challenge.html` (self-contained: no frameworks, no build step)
- **Menu:** `index.html`, under **Research missions** (separate from the SAT level numbering and from Step Up)
- **Duration:** about 45–60 minutes

## Setup

- **Teacher lock.** The game checks lock level **6**. If there is no lock row, the game stays open. To control it from the dashboard's lock panel, add the row once in Supabase:
  ```sql
  insert into level_locks (level, locked) values (6, false);
  ```
  After that, **Research · The Controller Challenge** appears in the dashboard's lock list. It stays hidden until the row exists. If your `level_locks` policies limit which rows the teacher account can update, also allow level 6.
- **Progress.** Progress is saved in the browser under `seControllerChallengeProgress`, and the sound setting under `seControllerChallengeSettings`. No other game's keys are read or changed.
- **Privacy.** Nothing is uploaded. The only network request is the shared teacher-lock check in `lock.js`. The optional name on the summary is not saved.
- **Reset.** Use **↺ Restart this activity** on the Missions screen. It clears this activity on that device only.

## Mission flow and worksheet alignment

| Game | Worksheet section | What students do |
|---|---|---|
| Mission 1 · The Discovery Lab | Mission 1 - Discover the controllers | 7 exhibits, each with a manufacturer link, a worksheet prompt and one identification challenge (find the chip, find the radio, built-in features, logic meter, decode the name, chip vs board, computer vs controller). Then a **Lab Sort** using the worksheet's three device types. |
| Mission 2 · Specification Detective | Mission 2 - Investigate the specifications | Choose a third board. Eight case files match the eight rows of the comparison table: processor, power supply, logic voltage, digital & analogue I/O, wireless, programming, operating system, applications. |
| Mission 3 · The Compatibility Workshop | Mission 3 - Understanding the differences | Five scenarios: logic voltage (Q3), sensors & actuators (Q2), wireless (Q4), microcontroller vs OS (Q1), overkill check (Q5). Each ends by pointing students to its question. |
| Mission 4 · The Engineering Commission | Mission 4 - Engineering selection | Brief A/B/C (worksheet wording) → requirements → controller → power → self-rating vs engineer → programming → three considerations + one trade-off. The final checkpoint sends students to the worksheet justification and final reflection. |

Missions unlock in order. Hints appear after two wrong attempts, and a "show me" button appears after three. The completion summary lists hints and reveals used. Students can copy or print it.

## Things to review

- **Specifications.** Specs were checked against manufacturer pages (Arduino, Espressif, Micro:bit Educational Foundation, Raspberry Pi, PICAXE) in November 2026 and are kept in the `DEV` object near the top of the script. Please spot-check them against your worksheet's answer key.
- **AXE118 availability.** The AXE118 project board is listed as discontinued by several suppliers (and the 20M2 is retired at at least one Australian retailer). The game mentions this once as a trade-off. Remove it if your school has stock and you'd rather not raise it.
- **Defensible answers.** Several answers accept more than one choice, shown in amber as "defensible". For example: the PICAXE in the Lab Sort can be a chip or a dev board, Pi 5 for the greenhouse can be a good fit or need a workaround, and the Mission 4 controller ratings allow strong or workable choices. Adjust the `ok`/`best` lists if your answer key differs.
- **Illustrations.** The board illustrations are original simplified SVGs, not product photos. Students find official images through the links, as the worksheet asks.
