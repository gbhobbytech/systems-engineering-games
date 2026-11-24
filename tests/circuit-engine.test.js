// Unit tests for the circuit engine inside step-up-circuit-rescue.html.
// Run with:  node tests/circuit-engine.test.js   (Node 16+, no packages needed)
// The engine block is extracted from the HTML file, so these tests always check the shipped code.
'use strict';
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'step-up-circuit-rescue.html'), 'utf8');
const src = html.slice(html.indexOf('const CircuitEngine = (function'), html.indexOf('/* ===================== CIRCUIT ENGINE END'));
const E = new Function(src + '\nreturn CircuitEngine;')();

let pass = 0, fail = 0;
function t(name, fn) { try { fn(); pass++; console.log('  ✓ ' + name); } catch (e) { fail++; console.log('  ✗ ' + name + '\n      ' + e.message); } }
function eq(a, b, msg) { if (a !== b) throw new Error((msg ? msg + ': ' : '') + `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function ok(v, msg) { if (!v) throw new Error(msg || 'expected truthy'); }
const L = parts => ({ parts });
const SUP = (pos, neg) => ({ id: 'SUP', type: 'supply', pos, neg });
const BTN = anchor => ({ id: 'S1', type: 'button', anchor });
const RES = (a, b) => ({ id: 'R1', type: 'resistor', a, b });
const LED = (anode, cathode) => ({ id: 'D1', type: 'led', anode, cathode });
const J = (n, a, b) => ({ id: 'J' + n, type: 'jumper', a, b, color: '#fff' });
const code = (l, p) => E.evaluate(l, p).code;
function assertValid(l) { const seen = []; l.parts.forEach(p => { const err = E.validate({ parts: seen }, p); if (err) throw new Error(`layout not placeable (${p.id}): ${err}`); seen.push(p); }); }

// Ohmbot's reference layout (same as referenceLayout() in the game)
const REF = () => L([SUP('A2', 'A13'), BTN('E5'), J(1, 'B2', 'B5'), RES('G7', 'G11'), LED('H11', 'H13'), J(2, 'I13', 'D13')]);

console.log('\nBreadboard geometry');
t('A–E in a row share a strip; F–J share another', () => { eq(E.strip('A5'), E.strip('E5')); eq(E.strip('F5'), E.strip('J5')); ok(E.strip('E5') !== E.strip('F5')); });
t('adjacent rows are separate strips', () => ok(E.strip('C5') !== E.strip('C6')));
t('every one of the 170 holes parses; nothing outside does', () => {
  let n = 0; for (const c of 'ABCDEFGHIJ') for (let r = 1; r <= 17; r++) if (E.parseHole(c + r)) n++;
  eq(n, 170); ok(!E.parseHole('K1')); ok(!E.parseHole('A18')); ok(!E.parseHole('A0'));
});
t('34 strips of 5 holes, no power rails', () => { const s = new Set(); for (const c of 'ABCDEFGHIJ') for (let r = 1; r <= 17; r++) s.add(E.strip(c + r)); eq(s.size, 34); });
t('the channel is 3 pitches wide (E→F)', () => eq(E.span('E4', 'F4'), 3));
t('tactile switch pins straddle the channel two rows apart', () => { const p = E.buttonPins('E5'); eq(p['1a'], 'E5'); eq(p['1b'], 'F5'); eq(p['2a'], 'E7'); eq(p['2b'], 'F7'); ok(!E.buttonPins('C5')); ok(!E.buttonPins('E16')); });

console.log('\nPlacement rules');
t('one leg per hole', () => ok(E.validate(REF(), J(5, 'A2', 'C9'))));
t('LED legs limited to ~3 pitches; resistor to 8', () => { ok(E.validate(L([]), LED('A1', 'A5'))); ok(!E.validate(L([]), LED('E3', 'F3'))); ok(E.validate(L([]), RES('A1', 'A12'))); ok(!E.validate(L([]), RES('G7', 'G11'))); });
t('button must straddle the channel', () => { ok(E.validate(L([]), BTN('B4'))); ok(!E.validate(L([]), BTN('E4'))); });
t('reference layout is placeable', () => assertValid(REF()));

console.log('\n1–2. Correct operation and switch behaviour');
t('reference: LED lit only while pressed', () => { eq(code(REF(), true), 'lit'); eq(code(REF(), false), 'open'); ok(E.works(REF())); });
t('reference: LED current is safe (≈9 mA) and below the 30 mA limit', () => { const r = E.evaluate(REF(), true); ok(r.ledmA > 7 && r.ledmA < 11, 'got ' + r.ledmA); });
t('released switch: no current anywhere', () => { const r = E.evaluate(REF(), false); ok(r.supplymA < 0.01, 'leak ' + r.supplymA); eq(r.ledmA, 0); });
t('current path order: button → resistor → LED', () => eq(E.tracePath(REF()).order.join(','), 'S1,R1,D1'));

console.log('\n3. Multiple valid arrangements');
const ALT = {
  'shifted to other rows / halves': L([SUP('J1', 'J17'), BTN('E9'), J(1, 'I1', 'G9'), RES('A11', 'A15'), LED('C15', 'C16'), J(2, 'D16', 'H17')]),
  'no jumpers at all (parts share strips)': L([SUP('A3', 'D12'), BTN('E3'), RES('G5', 'G9'), LED('H9', 'H12'), J(1, 'I12', 'C12')]),
  'different order: + → resistor → LED → button → −': L([SUP('A1', 'A16'), RES('B1', 'B5'), LED('C5', 'C7'), BTN('E7'), J(1, 'G9', 'G16'), J(2, 'H16', 'B16')]),
  'LED straddling the channel E→F': L([SUP('A2', 'J15'), BTN('E2'), RES('A4', 'A8'), LED('E8', 'F8'), J(1, 'G8', 'G15')]),
  'resistor straddling the channel': L([SUP('A1', 'J12'), BTN('E1'), RES('D3', 'G5'), LED('H5', 'H7'), J(1, 'I7', 'I12')]),
  'long chain of jumpers': L([SUP('A1', 'A17'), J(1, 'B1', 'B3'), J(2, 'C3', 'C5'), J(3, 'D5', 'D8'), BTN('E8'), RES('G10', 'G14'), LED('H14', 'H16'), J(4, 'I16', 'B17')]),
  'button on the − side of the LED, supply lead straight into a button row': L([SUP('A1', 'H10'), RES('B1', 'B4'), LED('C4', 'C6'), J(1, 'D6', 'D8'), BTN('E8')]),
};
Object.entries(ALT).forEach(([name, l]) => t(name, () => { assertValid(l); ok(E.works(l), `pressed=${code(l, true)} released=${code(l, false)}`); }));
t('alternative order traced correctly', () => eq(E.tracePath(ALT['different order: + → resistor → LED → button → −']).order.join(','), 'R1,D1,S1'));

console.log('\nThe schematic is the reference');
const SCHEMATIC_ORDER_LAYOUTS = ['shifted to other rows / halves', 'no jumpers at all (parts share strips)', 'LED straddling the channel E→F', 'resistor straddling the channel', 'long chain of jumpers'];
t('reference layout matches the schematic', () => ok(E.matchesSchematic(REF())));
SCHEMATIC_ORDER_LAYOUTS.forEach(n => t(`"${n}" matches the schematic (different holes, same order)`, () => ok(E.matchesSchematic(ALT[n]))));
t('working circuit in a different order does NOT match the schematic', () => { const l = ALT['different order: + → resistor → LED → button → −']; ok(E.works(l)); ok(!E.matchesSchematic(l)); });
t('button on the − side works but does NOT match', () => { const l = ALT['button on the − side of the LED, supply lead straight into a button row']; ok(E.works(l)); ok(!E.matchesSchematic(l)); });
t('reversed supply "fixed" by flipping the LED lights but does NOT match', () => { const l = REF(); const s = E.getPart(l, 'SUP'); [s.pos, s.neg] = [s.neg, s.pos]; const l2 = E.flipLed(l); ok(E.works(l2)); ok(!E.matchesSchematic(l2)); });
t('reversed supply fixed by swapping the leads matches', () => { const l = REF(); const s = E.getPart(l, 'SUP'); [s.pos, s.neg] = [s.neg, s.pos]; [s.pos, s.neg] = [s.neg, s.pos]; ok(E.matchesSchematic(l)); });
t('reversed LED "fixed" by swapping the supply lights but does NOT match', () => { const l = E.flipLed(REF()); const s = E.getPart(l, 'SUP'); [s.pos, s.neg] = [s.neg, s.pos]; ok(E.works(l)); ok(!E.matchesSchematic(l)); });
t('wrong-row leg repaired with a jumper still matches (same connections)', () => { const l = REF(); E.getPart(l, 'D1').cathode = 'H14'; l.parts.push(J(3, 'J14', 'J13')); ok(E.matchesSchematic(l)); });
t('gap check uses the schematic: the true gap matches, a gap that bypasses parts does not', () => {
  const l = REF(); l.parts = l.parts.filter(p => p.id !== 'J1');
  ok(E.matchesSchematic(l, [['C2', 'C5']])); ok(!E.matchesSchematic(l, [['C2', 'G7']]));
});

console.log('\n4. Incorrect breadboard connections');
t('LED leg in the next row: open circuit', () => { const l = REF(); E.getPart(l, 'D1').cathode = 'H14'; eq(code(l, true), 'open'); });
t('resistor leg in the wrong row: open circuit', () => { const l = REF(); E.getPart(l, 'R1').b = 'G12'; eq(code(l, true), 'open'); });
t('parts placed visually close but in different strips are NOT connected', () => {
  // resistor ends in row 11 right half, LED anode in row 11 left half (just across the channel, 3 pitches away)
  const l = REF(); const d = E.getPart(l, 'D1'); d.anode = 'D11'; d.cathode = 'C13'; eq(code(l, true), 'open');
});
t('both LED legs in one strip: LED shorted out by the board', () => { const l = REF(); const d = E.getPart(l, 'D1'); d.anode = 'H11'; d.cathode = 'J11'; eq(code(l, true), 'open'); });
t('both LED legs in a strip that IS in the path: led-bypassed', () => { const l = L([SUP('A2', 'A13'), BTN('E5'), J(1, 'B2', 'B5'), RES('G7', 'G11'), LED('H11', 'J11'), J(2, 'I11', 'D13')]); eq(code(l, true), 'led-bypassed'); });
t('push-button not straddling (missing from path) → open', () => { const l = REF(); l.parts = l.parts.filter(p => p.id !== 'S1'); eq(code(l, true), 'open'); });
t('switch bypassed by a jumper: LED on without pressing (not a working circuit)', () => { const l = REF(); l.parts.push(J(3, 'C5', 'H7')); eq(code(l, false), 'lit'); ok(!E.works(l)); });
t('resistor directly across the supply: current flows, not through LED', () => { const l = L([SUP('A2', 'A13'), RES('B2', 'B9'), J(1, 'C9', 'C13'), LED('H1', 'H3')]); eq(code(l, false), 'led-not-in-path'); });
t('supply leads missing → no-supply', () => { const l = REF(); E.getPart(l, 'SUP').neg = null; eq(code(l, true), 'no-supply'); });

console.log('\n5. Reversed LED');
t('reversed LED: polarity fault, no light', () => { const l = REF(); const d = E.getPart(l, 'D1'); [d.anode, d.cathode] = [d.cathode, d.anode]; eq(code(l, true), 'polarity'); eq(E.evaluate(l, true).ledmA, 0); });
t('reversed LED with switch open is just open (no false diagnosis)', () => { const l = REF(); const d = E.getPart(l, 'D1'); [d.anode, d.cathode] = [d.cathode, d.anode]; eq(code(l, false), 'open'); });

console.log('\n6. Reversed supply');
t('reversed supply: polarity fault', () => { const l = REF(); const s = E.getPart(l, 'SUP'); [s.pos, s.neg] = [s.neg, s.pos]; eq(code(l, true), 'polarity'); });
t('reversed supply + reversed LED lights (electrically valid series loop)', () => { const l = REF(); const s = E.getPart(l, 'SUP'); [s.pos, s.neg] = [s.neg, s.pos]; const d = E.getPart(l, 'D1'); [d.anode, d.cathode] = [d.cathode, d.anode]; ok(E.works(l)); });

console.log('\n7. Unintended open circuits');
t('removed jumper', () => { const l = REF(); l.parts = l.parts.filter(p => p.id !== 'J1'); eq(code(l, true), 'open'); });
t('missing connection across the channel', () => { const l = REF(); l.parts = l.parts.filter(p => p.id !== 'J2'); eq(code(l, true), 'open'); });
t('repairing with a jumper in different holes of the same strips works', () => { const l = REF(); l.parts = l.parts.filter(p => p.id !== 'J1'); l.parts.push(J(1, 'E2', 'A5')); ok(E.works(l)); });
t('gap check: a virtual link across the true gap fixes it; elsewhere does not', () => {
  const l = REF(); l.parts = l.parts.filter(p => p.id !== 'J1');
  eq(E.evaluate(l, true, { extraLinks: [['C2', 'J5']] }).code, 'lit');
  ok(E.evaluate(l, true, { extraLinks: [['C2', 'G11']] }).code !== 'lit');
});

console.log('\n8. Direct supply short circuits');
t('jumper from + strip to − strip: short (even with switch open)', () => { const l = REF(); l.parts.push(J(3, 'C2', 'C13')); eq(code(l, false), 'short'); eq(code(l, true), 'short'); });
t('both supply leads in one strip: short', () => { const l = REF(); E.getPart(l, 'SUP').neg = 'E2'; l.parts = l.parts.filter(p => p.id !== 'J1'); eq(code(l, false), 'short'); });
t('button wired straight across the supply: short only when pressed', () => { const l = L([SUP('A5', 'A7'), BTN('E5')]); eq(code(l, false), 'open'); eq(code(l, true), 'short'); });

console.log('\n9. Bypassed resistor and LED shorts');
t('jumper across the resistor: LED overcurrent (not a supply short)', () => { const l = REF(); l.parts.push(J(3, 'H7', 'I11')); const r = E.evaluate(l, true); eq(r.code, 'led-over'); ok(r.ledmA > 30); });
t('bypassed resistor is harmless while switch is open', () => { const l = REF(); l.parts.push(J(3, 'H7', 'I11')); eq(code(l, false), 'open'); });
t('jumper across the LED: LED bypassed, resistor still limits current', () => { const l = REF(); l.parts.push(J(3, 'J11', 'J13')); const r = E.evaluate(l, true); eq(r.code, 'led-bypassed'); ok(r.supplymA > 10 && r.supplymA < 20, 'mA ' + r.supplymA); });
t('LED straight across the supply (no resistor at all): overcurrent', () => { const l = L([SUP('A2', 'A4'), LED('B2', 'B4')]); eq(code(l, false), 'led-over'); });

console.log('\nGame fault scenarios (as applied by the game)');
const FAULTS = {
  'led-reversed': l => { const d = E.getPart(l, 'D1'); d.anode = 'H13'; d.cathode = 'H11'; },
  'supply-reversed': l => { const s = E.getPart(l, 'SUP'); s.pos = 'A13'; s.neg = 'A2'; },
  'missing-jumper': l => { l.parts = l.parts.filter(p => p.id !== 'J1'); },
  'missing-connection': l => { l.parts = l.parts.filter(p => p.id !== 'J2'); },
  'led-wrong-row': l => { E.getPart(l, 'D1').cathode = 'H14'; },
  'wrong-row': l => { E.getPart(l, 'R1').b = 'G12'; },
  'supply-short': l => { l.parts.push(J(3, 'C2', 'C13')); },
  'resistor-bypass': l => { l.parts.push(J(3, 'H7', 'I11')); },
  'led-short': l => { l.parts.push(J(3, 'J11', 'J13')); }
};
const EXPECT = { 'led-reversed': 'polarity', 'supply-reversed': 'polarity', 'missing-jumper': 'open', 'missing-connection': 'open', 'led-wrong-row': 'open', 'wrong-row': 'open', 'supply-short': 'short', 'resistor-bypass': 'led-over', 'led-short': 'led-bypassed' };
Object.keys(FAULTS).forEach(k => t(`${k} → ${EXPECT[k]}, placeable, and not "working"`, () => { const l = REF(); FAULTS[k](l); assertValid(l); eq(code(l, true), EXPECT[k]); ok(!E.works(l)); }));
t('the html game file defines the same fault edits', () => { Object.keys(FAULTS).forEach(k => ok(html.includes(`'${k}':`), 'missing fault ' + k)); });

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
