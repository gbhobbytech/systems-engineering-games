# Class live board · Teacher guide

Every activity on the site can now appear on the teacher's live dashboard (`dashboard.html`), so the board you used with Rubric Heist works across the whole program.

## Two kinds of board

The hub shows which kind each activity uses:

| Marker | Activities | What students see on the projector |
|---|---|---|
| 🏆 **Class leaderboard** | Orientation, Rubric Heist, Step Up Part 1, Step Up Part 2 (Circuit Rescue), The Controller Challenge | Ranked by points, plus a race (sections done), a live feed and a class heatmap (% of attempts correct per section). |
| 📋 **Progress wall** (tracked, not ranked) | Evidence Studio (Year 11), Evidence Studio: SAT (Year 12), Will It Fly?, 9–10 Evidence Lab | Evidence Studios: a makeover leaderboard (the game part), plus an **alphabetical** wall showing each student's makeover rounds, signature, progress per stage or criterion, and whether they've posted **this week's drop**. Class progress bars show where the whole class is. |

**Why the studios aren't ranked.** Their "strong" and "assessor-ready" statuses are the students' own judgements, so ranking them would reward ticking boxes rather than capturing evidence. Year 12 records are also SAT work: students can be behind for legitimate reasons, and showing "last place" on the projector isn't the kind of accountability we want. The wall keeps everyone visible, makes the weekly routine public (dropped this week ✓/✗), and keeps the details in the private teacher view.

## Points (the same in every 🏆 activity)

| | Points |
|---|---|
| Correct first try | 10 |
| Correct after a retry | 5 (persistence counts) |
| Answer revealed | 0 |
| Each section completed | 20 |
| Finishing the activity | 50 |

Each question and section counts **once**, so replaying never adds points. Points earned before joining (at home, or in practice) are added to the board when the student joins.

## Running a session

1. Open `dashboard.html` and sign in (same teacher account as before).
2. Pick the activity from the buttons (ORIENTATION … STUDIO SAT), then **START SESSION** with a code (or **MAKE A RANDOM CODE**).
3. Students join either way:
   - open the link shown under the code (it contains `?session=CODE`), **or**
   - click **📡 Join class board** (bottom corner of every activity) and type the code.

   If the page already knows their name, the link joins them straight away. Otherwise they enter first name and class once.
4. Project the board. Press **T** for the private teacher view (don't project it), **L** for level locks, **F** for full screen. **EXPORT CSV** downloads the session.

**Practice mode:** without a code nothing is sent. The chip just says "📡 Join class board". The Controller Challenge stays anonymous unless a student chooses to join.

**Offline:** if the school network drops, the chip turns yellow ("saving offline") and events are re-sent automatically when it's back.

### What the teacher view shows

- **🏆 activities:** points, sections done, time, wrong attempts (expand to see which), and the most-missed questions across the class.
- **📋 Evidence Studios:**
  - system and makeover progress
  - signature (yes/no)
  - number of drops and date of the last one (⚠ if none this week)
  - what the student is **stuck on**
  - this week / next week, and what they **still need**, under "View"
  - the share of the class that is complete for each stage or criterion

  Students who haven't dropped this week, or who are stuck, are listed first.

## One-time database check (please do this before the first lesson)

The new activities write to the existing `rubric_events` table with level numbers **1, 5, 6, 7, 8 and 9**. They use the same columns Rubric Heist uses (`session_code, player_id, name, class, event, level, elapsed_s, vault, score, question_id, correct, payload`). Only the events `join`, `answer`, `vault` and `finish` are used, `vault` stays between 0 and 9, and `elapsed_s` is capped at 7200.

If your table has a rule that only allows levels 2–4, the new activities' rows will be rejected silently: the chip still says LIVE, but nothing appears on the board. Run this in the Supabase SQL editor to check:

```sql
-- 1. Any CHECK rules on the table?
select conname, pg_get_constraintdef(oid)
from pg_constraint where conrelid = 'public.rubric_events'::regclass and contype = 'c';

-- 2. What do the insert policies allow?
select policyname, cmd, with_check
from pg_policies where tablename = 'rubric_events';
```

If either output limits `level` (for example `level in (2, 3, 4)` or `level between 2 and 4`), widen it:

```sql
-- example: replace a CHECK constraint (use the name returned by query 1)
alter table public.rubric_events drop constraint rubric_events_level_check;
alter table public.rubric_events add constraint rubric_events_level_check check (level between 1 and 9);
```

For a policy, edit it in **Authentication → Policies** so its check allows levels 1–9.

**Quick live test:** start a session for **CIRCUIT RESCUE** on the dashboard, open the student link in another browser window, join, and match one component in Mission 1. Within about 3 seconds the student should appear on the leaderboard. If they don't, run the checks above.

## Privacy

- Only **first name, class and progress** are sent, and only after a student joins with a code.
- The projected boards show first names. Evidence Studio text (this week, next week, stuck on, still needed) appears **only in the teacher view**.
- "Hide" removes a student from your dashboard (for example a test or joke entry). Rows stay in Supabase until you delete them there.

## For developers

- `live.js` is the shared client. Each activity calls `SELive.init({ level })`, `identify(name, cls)`, `answer(qid, correct, { sec })`, `stage(id, { sec, label })`, `finish()`, and (for walls) `report(kind, payload)`. Each event carries `payload.total`, the student's running points, which the dashboard uses for game and wall levels.
- Level numbers match the teacher lock ids. Add a new activity to `LEVELS` in `dashboard.html` with `type: 'game'` (plus `maxV` and `secs`) or `type: 'wall'`.
- `tests/live-board.spec.js` runs the real pages and the real dashboard against a mock Supabase. It covers practice mode, joining (chip and link), scoring and replay protection, the offline queue, all six activities, both dashboard views, and the hub markers.
