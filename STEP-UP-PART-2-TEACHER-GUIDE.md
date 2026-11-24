# Step Up Part 2 · Ohmbot's Circuit Rescue · Teacher guide

**Game:** `step-up-circuit-rescue.html` (VCE Systems Engineering Units 1 & 2)
**For:** Year 11 Step Up, after Part 1 (*My Year in Systems*) and the first LED practical
**Digital time:** about 35–45 minutes, inside a 60-minute lesson

## Game overview

Ohmbot's lab lights have failed. Students act as trainee engineers. They read the schematic, build the lighting circuit on a virtual **170-point mini breadboard**, then find and fix a series of faults. Six missions lead to a final **Circuit Detective** case with a random fault. The game ends with a one-page **Circuit Investigator Report**.

The game has two synchronised panels:

- **Panel A: schematic.** Conventional symbols for the DC supply, normally open push-button, resistor (330 Ω), LED and wires. Select a symbol to inspect it and to highlight the matching part on the board.
- **Panel B: mini breadboard.** 17 rows × 10 holes (A–E and F–J, separated by the centre channel, no power rails). Students plug in the supply leads, push-button, resistor, LED and jumpers. They can switch the virtual 5 V supply on and off and press the button. A status display reports what's happening.

The breadboard isn't decorative. Every result comes from an electrical model of what's actually plugged in, so students can use **any holes they like**: there isn't one "answer" layout. Parts are only connected if their legs share a group of five holes or are joined by a jumper. Being visually close isn't enough.

### The schematic is the reference

Every build and every repair is checked against the **schematic**, not just "does the LED light". The circuit must work, and current must pass **+ → push-button → resistor → LED (+ leg first) → −**, in that order.

This matters because some faults have more than one fix that *works*. A reversed supply can be "fixed" by flipping the LED instead, and the LED lights. But the board then disagrees with the schematic in two places. In a real system that becomes a hidden fault for the next engineer, and other parts can be damaged by reversed power. So when a fix works but doesn't match, the game explains why and asks the student to change the board to match the schematic. While the diagnosis display is visible, it also warns "Circuit operating, but NOT in the schematic's order".

It's separate from Part 1 and from the Units 3 & 4 levels. It keeps its own progress (`seStepUp2Progress`) and player name (`seStepUp2Player`). It fills in the name from Part 1 if it finds one on the device, but it never changes Part 1 data.

## Learning intentions

By the end, students can:

1. recognise an LED, resistor, push-button, DC supply and connecting wire, and match each to its schematic symbol
2. read a simple schematic and reproduce it on a mini breadboard
3. explain how the internal connections of a mini breadboard work
4. recognise that the LED, resistor and push-button are connected in series
5. identify and correct reverse-polarity faults (LED and supply)
6. identify and correct open-circuit faults
7. identify and explain short-circuit faults.

Out of scope for this game (left for later games): Ohm's law calculations, multimeters, oscilloscopes, sensors, microcontrollers, programming and parallel circuits.

## Equipment for the accompanying physical lesson

Per pair or small group, the same kit as the first practical:

- a DC power source (battery pack, or a current-limited bench or breadboard supply set to about 5 V)
- 1 red 5 mm LED
- 1 current-limiting resistor (330 Ω, orange-orange-brown, matching the game)
- 1 four-leg 6 mm tactile push-button (momentary, normally open)
- jumper wires
- 1 170-point mini breadboard (no power rails).

## Suggested 60-minute lesson

| Time | Activity |
|---|---|
| 0–5 min | Recall the last practical: "What did each part do? What happened when you let go of the button?" Demonstrate the game on the front screen: select a hole, place a part, power, press. |
| 5–12 min | **Mission 1 · Decode the Diagram** and **Mission 2 tutorial** (breadboard groups). |
| 12–22 min | **Mission 2 · Complete the Circuit** (students build their own layout) and **Mission 3 · The Single Path**. |
| 22–25 min | ⏸ Pause: "Was everyone's layout the same? Why did they all work?" (Same connections, different holes.) |
| 25–40 min | **Missions 4–6**: polarity, open circuits, short circuits. |
| 40–48 min | **Circuit Detective** final case and the report (download PNG or print). |
| 48–60 min | Follow-up practical (below), or class discussion with the misconceptions list. |

If time is short, stop after Mission 6 and do the Detective case as next lesson's starter.

## Mission summaries

| Mission | What students do | Success |
|---|---|---|
| **1 · Decode the Diagram** | Match 5 physical components to their symbols. Find the LED's anode (long leg) and cathode (flat side), and say which way current flows. | All matched and the LED questions answered. |
| **2 · Complete the Circuit** | Interactive breadboard tutorial (select C5, find a connected hole, which pair is connected?). Then build the schematic on the board from the tray, power on, press and release. | The model confirms the LED lights only while pressed and goes off when released. Any equivalent layout passes. The circuit is saved. |
| **3 · The Single Path** | With their own circuit: hold the button and watch the current path. Click the parts in the order conventional current reaches them, release and watch the path vanish, then answer and explain "Why does opening the switch turn the LED off?" | Correct trace, series identified, explanation in their own words. |
| **4 · Wrong Way Around** | A reversed LED: observe, then select the part that's connected differently from the **schematic**, explain polarity, flip, test. Then a reversed supply (swapped leads), which shows exactly the same symptom. After locating it, students answer "Two different changes would light the LED. Which is the correct repair?" and learn why the fix must follow the schematic. | Both faults identified against the schematic, explained, repaired to match it and tested. Swapping the supply to "fix" a reversed LED (or the other way round) lights the LED but isn't accepted. |
| **5 · The Broken Connection** | Decide whether "power on, not pressed, LED off" is a fault (no: the switch is normally open). Then find two unintended open circuits (a removed jumper, then an LED leg one row out) by marking the gap, and repair them. | Gaps located, repaired and explained. |
| **6 · The Dangerous Shortcut** | ⚠ Simulation only. A jumper shorts the supply, so the supply shuts down. Then a jumper bypasses the resistor, so the LED burns out but the supply stays on. Predict and test a jumper across the LED (LED off, resistor still limits current: not a supply short). | Each dangerous connection found, explained and removed safely (power off first). |
| **🔍 Circuit Detective** | One random fault from: reversed LED, reversed supply, missing connection, incorrect row, supply short, bypassed resistor. Investigate, then diagnose the **fault type** (polarity fault, open circuit, short circuit, or bypassed resistor: the four types testing can tell apart). A wrong diagnosis asks for one more test before another attempt, so guessing doesn't pay. Then **locate** the exact part or gap against the schematic, explain, repair to match the schematic, and demonstrate. | Fault type and location correct, explained, repaired to match the schematic, and the circuit demonstrated working. |

**Feedback approach (same as Part 1):** no timers and no penalties. Wrong answers explain why and let students retry. Fixing a mistake earns a **Comeback**. Each step has up to 3 optional hints (Mission 2's last hint shows a see-through example layout). Hint use is saved. Completed missions can be replayed from the tracker at the top.

**Investigation before diagnosis:** in the fault missions, the status display shows only what students could actually *observe* (power, button, LED on/off/blown, supply shut down). The diagnosis ("Polarity fault", "Open circuit"…) is hidden until they have investigated and identified the fault. The wiring is locked until the repair step.

## Expected student understanding

- A breadboard row has **two separate groups of five** (A–E, F–J). Neighbouring rows aren't connected. The channel separates the halves. This board has no power rails.
- The push-button, resistor and LED form **one path** (series). The same current flows through each. Opening the switch anywhere stops current everywhere. Electrically, the order of the parts in a series loop doesn't change how it works.
- The **schematic is the reference**. A repair isn't finished just because the circuit works: it must match the schematic, or it becomes a hidden fault that can grow into bigger problems later, especially in complex systems.
- An LED is a **diode**: current passes anode (+, long leg) → cathode (−, flat side) only.
- An **open circuit** is an unintended break in the path. A released momentary switch is an intended break.
- A **short circuit** is an unintended low-resistance path. Shorting + to − directly gives a very large current (our simulated supply protects itself). Bypassing the current-limiting resistor overloads the LED. A jumper across the LED just stops the LED lighting, because the resistor still limits the current.

## Common misconceptions to listen for

- "All the holes in a column/row are connected." (Only groups of 5, and not across the channel.)
- "If it works, it's fixed." (It must also match the schematic. The game rejects working fixes that don't, and explains why.)
- "The switch has to be next to the + terminal, or it won't work." (Electrically it works anywhere in the series loop. The game still asks students to build in the schematic's order, because the schematic is the reference.)
- "Current gets used up by the LED, so there's less after it." (Same current all around a series loop.)
- "The LED goes off a moment after the switch opens." (It stops at once, everywhere.)
- "Resistors and LEDs are both polarised." (Only the LED is. Resistors work either way.)
- "A short across the LED is as dangerous as a short across the supply." (The resistor still limits the current.)
- "Parts that touch or sit next to each other on the board are connected." (Only if they share a group or a jumper.)
- "The resistor goes 'before' the LED to protect it." (Either side works in series.)

## Accessing and resetting

- **Students:** `index.html` → **Year 11 · Step Up** → **Part 2 · Ohmbot's Circuit Rescue**, or go directly to `step-up-circuit-rescue.html`.
- Progress saves automatically in that browser. Reopening offers **Continue** or **Start again**.
- **Reset:** the ↺ button (top right) → *Yes, restart Part 2*. This clears Part 2 only. Part 1 is unaffected.
- **Screen size:** **⛶ Fit** (top right, on by default) fits the whole game in the window on laptop-sized screens: Ohmbot on the left, the breadboard in the centre, and the schematic plus the power/press controls on the right. The breadboard scales to the space left, so students never scroll between pressing the button and watching the LED. Each column scrolls on its own if needed. Turn Fit off for a bigger board with a scrolling page (useful on large monitors or with big text). Screens narrower than 1000 px, or shorter than 500 px, automatically use a stacked, scrolling layout.
- **Text size:** A− / A+ (saved per device, works together with Fit). Sound can be muted with 🔊.
- **Keyboard:** the breadboard can be used with arrow keys + Enter. Del removes a selected part, F flips the LED, Esc cancels, hold **B** to press the button. "Keep pressed" helps students who find holding the button hard.
- **Report:** at the end, students write a reflection, then **Print / save as PDF** or **Download report (PNG)** to share with you (for example on Teams). It includes their name, class, date, completed missions, a drawing of the circuit they built, the Detective fault and their explanation, and their reflection.

## Dashboard / teacher lock

- The game checks lock level **7** (Part 1 uses 5, the Controller Challenge uses 6). **If there's no row for level 7 it stays open.** No configuration is needed to use the game.
- To control it from the dashboard's lock panel, add the row once in Supabase:
  ```sql
  insert into level_locks (level, locked) values (7, false);
  ```
  **Step Up Part 2 · Circuit Rescue** then appears in the dashboard's lock list (hidden until the row exists). If your `level_locks` policies limit which rows the teacher account can update, also allow level 7.
- Future research missions should use lock ids **8 and up** (comment updated in `index.html`).

## Suggested follow-up practical (15–20 min)

Use the same LED, 330 Ω resistor, push-button and mini breadboard. **Power off whenever you rewire.**

1. **Build from the schematic** in a *different* layout from the person next to you. Photograph it. Then compare: why do both work?
2. **Trace the path:** with a finger, follow + → each part → −, naming each group of 5 holes you pass through.
3. **Move the switch:** put the push-button on the other side of the LED (between the LED and −). Predict, then test. It still works, because series order doesn't matter electrically. Discuss: does the board still match the schematic? What should an engineer do: put it back, or formally update the schematic? Then put it back.
4. **Safe fault-finding:** your partner secretly makes **one** of these *safe* faults while you look away:
   - turn the LED around
   - move one leg of a component into the next row
   - remove one jumper.
   
   Diagnose it, explain it, fix it **so the board matches the schematic**. Swap roles.
5. Record one observation and one explanation in your logbook.

> ⚠ **Do not** ask students to short the supply, bypass the resistor or connect the LED without its resistor with real equipment. These faults can overheat batteries and wires and destroy components. They are **simulation-only**, which is why they appear in the game.

## Technical notes

- **Single HTML file**, no build step and no external libraries. Runs on GitHub Pages. The only network call is the optional lock check in `lock.js`.
- The **circuit engine** is a separate, DOM-free block at the top of the script. It merges breadboard strips into nets (union-find over jumpers and the switch's internal pairs), then solves the supply, resistor and LED with a small nodal analysis. The LED model is piecewise linear: about 2 V forward voltage, off when reversed. Illustrative values: 5 V supply, 330 Ω, so a working circuit gives about 9 mA. Above 30 mA the simulated LED burns out.
- The four-leg tactile switch straddles the channel. Legs across the channel (further apart) are always joined, and pressing joins the two rows. The interface only allows this orientation, because it's the only one that physically fits across the channel.
- **Schematic check:** a build or repair passes only if the model confirms the LED lights at a safe current only while the button is pressed, *and* the current path runs + → push-button → resistor → LED (anode → cathode) → −. Students can still use any holes, as long as the connections match the schematic.
- **Tests:** `node tests/circuit-engine.test.js` (no dependencies; 69 checks on the shipped engine). `tests/play-through.spec.js` is a full Playwright play-through of every mission, all six Detective faults, persistence, reset and hub integration (needs Playwright and a local web server: see the file header).

## Class live board

This activity can appear on the class live dashboard. See `LIVE-BOARD-TEACHER-GUIDE.md` for how to run a session and the one-time database check.
