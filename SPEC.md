# Pianist — Product & Technical Spec

Play piano from a computer keyboard. Every key plays a note from the selected key and scale. A **layout** decides which scale degree each key plays.

---

## 1. Goals

- **World-class, intentional UX.** Calm, precise, no clutter.
- **Light theme, grayscale only.** No accent colors.
- **Instant feel.** Key down → sound with no perceptible lag.
- **Can't play a wrong note.** Every key is in the scale.

### Non-goals (v1)
- No arrow-key, numpad, function-key or modifier-key notes.
- No recording, MIDI in/out, or multiple instruments.

---

## 2. Stack

| Part | Choice |
| --- | --- |
| UI | **SolidJS** + TypeScript |
| Build | Vite (`base: './'` so it runs under any sub-path) |
| Audio | `smplr` → **`SplendidGrandPiano`** |
| Fonts | Inter (UI), JetBrains Mono (key legends, numbers) |
| Hosting | GitHub Pages via Actions on every push to `main` |

---

## 3. Key grid

36 keys, matched by **`KeyboardEvent.code`** (physical position, so any language layout works).

| Row (top → bottom) | Keys | Count | Stagger indent |
| --- | --- | --- | --- |
| 0 — number | `1 2 3 4 5 6 7 8 9 0` | 10 | 0u |
| 1 — top | `Q W E R T Y U I O P` | 10 | 0.5u |
| 2 — home | `A S D F G H J K L` | 9 | 0.75u |
| 3 — bottom | `Z X C V B N M` | 7 | 1.25u |

- **Space** = sustain pedal (drawn as a 6.25u bar, indent 2.75u).
- `u` = one key width. Keyboard width = 10.5u.
- Codes: `Digit1`…`Digit0`, `KeyQ`…`KeyM`, `Space`.

Each key has `{ code, label, row, col }`. `row` 0 = number row. `col` 0 = leftmost.

---

## 4. Music model

### 4.1 Roots
`C, D♭, D, E♭, E, F, F♯, G, A♭, A, B♭, B` (spelled the common way).

### 4.2 Scales
Each step is `[semitones above root, letters above root]`. The letter offset gives correct spelling (E♭ in C minor, never D♯).

| Group | Scale | Steps |
| --- | --- | --- |
| Common | Major | `0:0 2:1 4:2 5:3 7:4 9:5 11:6` |
| | Natural Minor | `0:0 2:1 3:2 5:3 7:4 8:5 10:6` |
| | Harmonic Minor | `0:0 2:1 3:2 5:3 7:4 8:5 11:6` |
| | Melodic Minor | `0:0 2:1 3:2 5:3 7:4 9:5 11:6` |
| | Major Pentatonic | `0:0 2:1 4:2 7:4 9:5` |
| | Minor Pentatonic | `0:0 3:2 5:3 7:4 10:6` |
| | Blues | `0:0 3:2 5:3 6:4 7:4 10:6` |
| Modes | Dorian | `0:0 2:1 3:2 5:3 7:4 9:5 10:6` |
| | Phrygian | `0:0 1:1 3:2 5:3 7:4 8:5 10:6` |
| | Lydian | `0:0 2:1 4:2 6:3 7:4 9:5 11:6` |
| | Mixolydian | `0:0 2:1 4:2 5:3 7:4 9:5 10:6` |
| | Locrian | `0:0 1:1 3:2 5:3 6:4 8:5 10:6` |
| Other | Whole Tone | `0:0 2:1 4:2 6:3 8:4 10:5` |
| | Chromatic | 12 semitones, spelled by pitch: flats if root is flat or F, else sharps |

### 4.3 Note from a scale step
`scaleNote(root, scale, octave, index)` → `{ midi, letter, accidental, octave, degree }`

- `len` = notes in scale. `octaveShift = floor(index / len)`, `step = index mod len`.
- `midi = (octave + 1) * 12 + root.pitchClass + semis[step] + 12 * octaveShift`.
- Letter = root letter + letter offset. Accidental = midi − natural midi of that letter.
- Written octave follows the **letter** (B♯3 stays B♯3).
- `degree = step + 1`.
- Accidental symbols: ♯ ♭ 𝄪 𝄫.
- Negative indexes walk down.

### 4.4 Range
- **Base octave**: 1–5, default 3.
- Piano range **A0–C8 (MIDI 21–108)**. Keys outside it are **silent**.

---

## 5. Layouts

A layout is a pure function:

```ts
place(key: KeyDef, ctx: { len: number; custom: CustomParams; seed: number })
  → { steps: number; octave: number } | null   // null = silent key
```

Final note = `scaleNote(root, scale, baseOctave + octave, steps)`.

Numbers below are **1-based** (1 = root). In code, `steps = number − 1`. Grids are written top row = number row.

### 5.1 Generic grid rule (used by most layouts and by Custom)

Inputs: horizontal interval `h`, vertical interval `v` (or `'octave'` = `len`), direction, wrap, row lengths.

```
fromTop  = direction starts with "down"
fromLeft = direction is right-up or down-right
r = fromTop  ? row : (3 − row)          // rows away from origin row
c = fromLeft ? col : (rowLen − 1 − col)  // cols away from origin col
raw = h·c + v·r
wrap 'scale' → { steps: raw mod len, octave: r }   // each row folds into one octave
wrap 'none'  → { steps: raw,         octave: 0 }   // keeps climbing
col ≥ rowLen → silent
```

### 5.2 Melodic
*Makes melodic movement and scale exploration intuitive.*

**Standard** — grid `h=1, v=octave, right-up, none`. Each row starts on the root, each row up is +1 octave.
```
22 23 24 25 26 27 28 29 30 31
15 16 17 18 19 20 21 22 23 24
 8  9 10 11 12 13 14 15 16
 1  2  3  4  5  6  7
```
(shown for a 7-note scale)

**Isometric** — grid `h=1, v=3, right-up, none`.
```
10 11 12 13 14 15 16 17 18 19
 7  8  9 10 11 12 13 14 15 16
 4  5  6  7  8  9 10 11 12
 1  2  3  4  5  6  7
```

**Right Up** — fixed row starts `26 / 16 / 8 / 1` (top → bottom), +1 per key.
```
26 27 28 29 30 31 32 33 34 35
16 17 18 19 20 21 22 23 24 25
 8  9 10 11 12 13 14 15 16
 1  2  3  4  5  6  7
```

**Down Right** — grid `h=4, v=1, down-right, none`.
```
 1  5  9 13 17 21 25 29 33 37
 2  6 10 14 18 22 26 30 34 38
 3  7 11 15 19 23 27 31 35
 4  8 12 16 20 24 28
```

**Linear** — grid `h=1, v=10, down-right, none`.
```
 1  2  3  4  5  6  7  8  9 10
11 12 13 14 15 16 17 18 19 20
21 22 23 24 25 26 27 28 29
31 32 33 34 35 36 37
```

**Staircase** — only 10 keys play; the rest are silent.
```
V=1 B=2 N=3 M=4 · J=5 K=6 L=7 · O=8 P=9 · 0=10
```

### 5.3 Harmonic
*Makes intervals, chord tones and arpeggios easy to find.*

**Thirds** — grid `h=2, v=1, down-right, none`. (Degrees shown mod 7.)
```
 1  3  5  7  2  4  6  1  3  5
 2  4  6  1  3  5  7  2  4  6
 3  5  7  2  4  6  1  3  5
 4  6  1  3  5  7  2
```

**Fifths** — grid `h=4, v=5, down-right, scale` (folded; each row down +1 octave).
```
 1  5  2  6  3  7  4  1  5  2
 6  3  7  4  1  5  2  6  3  7
 4  1  5  2  6  3  7  4  1
 2  6  3  7  4  1  5
```

**Arpeggio** — chord tones only. `k = col + row`; `steps = floor(k/3)·len + [0,2,4][k mod 3]`. Climbs (no fold).
```
 1  3  5  1  3  5  1  3  5  1
 3  5  1  3  5  1  3  5  1  3
 5  1  3  5  1  3  5  1  3
 1  3  5  1  3  5  1
```

**Pentatonic** — degrees 1 2 3 5 6 only. `k = col + row`; picks `[0,1,2,4,5]` (or all steps if scale has < 7 notes); `steps = floor(k/5)·len + picks[k mod 5]`.
```
 1  2  3  5  6  1  2  3  5  6
 2  3  5  6  1  2  3  5  6  1
 3  5  6  1  2  3  5  6  1
 5  6  1  2  3  5  6
```

### 5.4 Experimental
*Unexpected relationships and happy accidents.*

**Zig-Zag** — boustrophedon. `steps = row·10 + (row odd ? rowLen−1−col : col)`.
```
 1  2  3  4  5  6  7  8  9 10
20 19 18 17 16 15 14 13 12 11
21 22 23 24 25 26 27 28 29
37 36 35 34 33 32 31
```

**Mirror** — triangle wave over the scale. `p = (row·10 + col) mod 2(len−1)`; `steps = p < len ? p : 2(len−1) − p`; `octave = row`.
```
 1  2  3  4  5  6  7  6  5  4
 3  2  1  2  3  4  5  6  7  6
 5  4  3  2  1  2  3  4  5
 7  6  5  4  3  2  1
```

**Random Walk** — reading order (row by row), each key moves `{−2,−1,+1,+2,+3}` from the last, mod `len`. `octave = row`. Seeded (xorshift32) so it's stable; **Reshuffle** picks a new seed.

**Custom** — the generic grid rule with user params:

| Param | Range | Default |
| --- | --- | --- |
| Horizontal interval | −12…+12 | +4 |
| Vertical interval | −12…+12 | +1 |
| Direction | Right Up →↑, Down Right ↓→, Left Up ←↑, Down Left ↓← | Down Right |
| Wrap | Scale (fold per row) / None (climb) | Scale |
| Row lengths | 0…max per row (10/10/9/7) | 10/10/9/7 |

Quick presets (chips): `+1/+3`, `+3/+2`, `+4/−1`, `+5/+1`.

---

## 6. Play pipeline

Three layers. Each only talks to the next, through a small typed event bus.

```
keyboard / tap ──key:down──▶ MAPPER ──note:on──▶ PLAYER ──▶ SplendidGrandPiano
                (key code)   (lookup)  (MIDI)   (voices, pedal)
```

### 6.1 Events

```ts
// keys bus
'key:down'  { code: string; source: 'keyboard' | 'pointer' }
'key:up'    { code: string; source: 'keyboard' | 'pointer' }
'key:reset' void                        // release everything

// notes bus
'note:on'    { id: string; midi: number; velocity: number }
'note:off'   { id: string }
'pedal'      { down: boolean }
'note:panic' void
```

### 6.2 Layer 1 — Input
- `keydown` / `keyup` on `window`. Emit only for the 36 keys + Space.
- Ignore when Meta / Ctrl / Alt is held, or focus is in a text field.
- `preventDefault` on play keys (stops `'`, `/`, Space side effects).
- Ignore `e.repeat`.
- **Arrow keys** change settings, never play: ↑/↓ octave, ←/→ root by semitone.
- On-screen keycaps emit the same `key:down` / `key:up` with `source: 'pointer'` (use pointer capture).
- Window `blur` and tab hidden → `key:reset`.
- First pointer or key gesture resumes the `AudioContext`.

### 6.3 Layer 2 — Mapper
- Voice id = `${source}:${code}`.
- On `key:down`: ignore if already held. Space → `pedal {down:true}`. Else look up the key's **current** note; if not silent → `note:on`.
- Remember which ids started a note. On `key:up` → `note:off` for that id. This stops the right note even if layout, key or octave changed while held.
- Pedal stays down while any source (keyboard or pointer) holds Space.
- Exposes `isKeyDown(code)` for keycap visuals (true if either source holds it).
- Velocity: fixed **100** (computer keys have no velocity).

### 6.4 Layer 3 — Player
- One `AudioContext({ latencyHint: 'interactive' })`.
- `SplendidGrandPiano(context, { decayTime: 0.6, onLoadProgress })`.
- `note:on`: stop any voice with the same id (re-strike), then `piano.start({ note: midi, velocity })`.
- `note:off`: if pedal down → keep ringing (mark sustained); else stop.
- `pedal` up → stop all sustained voices.
- Volume: `piano.output.volume` (0–127, default 100).
- Exposes signals: `loadState` (`loading{progress}` / `ready` / `error`), `audioUnlocked`, `pedalDown`, `sounding: Set<midi>`.

### 6.5 Piano strip input
The on-screen piano strip already knows its note, so it emits `note:on` / `note:off` directly (id `strip:${midi}`), skipping the mapper.

---

## 7. Screen layout

Centered column, max-width 1120px, 16px side gutter on phones (32px ≥ 720px). No horizontal scroll at any width.

1. **Top bar** — wordmark "Pianist" (small black piano-key mark) · status pill on the right.
2. **Controls card**
   - **Key** — 12-way segmented control (6×2 on phones, 12×1 ≥ 560px).
   - **Scale** — native `<select>` with optgroups (Common / Modes / Other), custom chevron.
   - **Octave** — − value + stepper.
   - **Volume** — slider, filled track.
   - On ≥ 960px all four sit in one row.
3. **Stage card**
   - **Readout** — large title "E♭ **Major**" (scale name in light gray) · row of scale degrees (note + degree number). Degrees invert to black while any matching pitch sounds.
   - **Layout bar** — Layout `<select>` (optgroups Melodic / Harmonic / Experimental) · category tag (hover shows category description) · one-line layout description · **Reshuffle** button (Random Walk only).
   - **Custom editor** (Custom only) — inset panel: Horizontal and Vertical steppers (signed), Direction segmented (arrows), Wrap segmented, four small row-length steppers labeled `1–0`, `Q–P`, `A–L`, `Z–M`, preset chips.
   - **Keyboard** — the 36 keys + Space bar.
   - **Piano strip** — real piano spanning exactly the notes the keyboard can reach, padded to whole octaves (C to B).
4. **Footer hints** — `↑↓ Octave` · `←→ Key` · `Space Sustain` · "Numbers on keys are scale degrees."

### 7.1 Keycap
- Top-left: key legend (mono, small, gray). Use `navigator.keyboard.getLayoutMap()` when available for the user's real legends.
- Center: note name large (e.g. **E♭**), octave as small subscript.
- Bottom-right: scale degree (mono, tiny). Root degree is bold black.
- **Root keys** (degree 1): light gray fill.
- **Pressed**: near-black fill, white text, 1px down, 30ms in / 220ms out.
- **Silent**: transparent, dashed border, no note.
- Size scales with container: `--u = min(76px, 100cqw / 10.5)`. Below 560px container width, hide legend, degree and octave.

### 7.2 Piano strip
- White keys: in-scale = near-white with hairline; out-of-scale = light gray.
- Black keys: in-scale = dark; out-of-scale = light gray.
- Dot on every in-scale key; root dot larger and solid.
- Sounding key = near-black (white keys) / black with white ring (black keys).
- C keys labeled (`C3`, `C4`…) except on narrow screens.

### 7.3 Status pill
- Loading: ring that fills with progress — "Loading piano".
- Loaded but audio locked: pulsing gray dot — "Press any key to start".
- Ready: black dot — "Ready".
- Error: hollow dot — "Couldn't load piano".

---

## 8. Visual tokens

```css
--bg: #f4f4f4;        --surface: #ffffff;
--ink: #111111;       --ink-2: #4a4a4a;   --ink-3: #8c8c8c;   --ink-4: #b8b8b8;
--line: #e4e4e4;      --line-strong: #d2d2d2;
--fill: #ececec;      --fill-strong: #e0e0e0;
--key: #ffffff;       --key-root: #f0f0f0;  --key-edge: #d6d6d6;  --key-down: #161616;
--radius-s: 8px;      --radius-m: 12px;     --radius-l: 20px;
--shadow-card: 0 1px 2px rgb(0 0 0 / .04), 0 8px 24px -12px rgb(0 0 0 / .08);
--ease: cubic-bezier(.2, .8, .2, 1);
```

- Field labels: 11px, 600, uppercase, 0.08em tracking, `--ink-3`.
- Selected segment: white pill with subtle shadow on a `--fill` track.
- Respect `prefers-reduced-motion` (no transitions or animations).
- Visible `:focus-visible` ring (2px `--ink`).

---

## 9. Behavior rules

- **Controls never keep focus.** After any click or change, blur, so the next key press plays instead of changing the control.
- **Settings persist** to `localStorage` (`pianist:settings`): root, scale, octave, volume, layout, custom params, random seed. Wrap every read and write in try/catch.
- **No stuck notes.** Blur / hidden tab releases all keys and lifts the pedal.
- **Settings change while holding a key** → the held note keeps sounding until released; the next press uses the new mapping.

---

## 10. Acceptance checks

- [ ] Standard, C major, octave 3: `A` plays C4; releasing stops it.
- [ ] Hold Space, tap `D`, release `D` → E4 keeps ringing until Space lifts.
- [ ] Clicking a keycap plays the same note as pressing that key.
- [ ] Every layout's grid matches §5 exactly (verify with a script that prints degrees per key).
- [ ] E♭ minor spells C♭ and G♭; F♯ major spells E♯; chromatic in D♭ spells with flats.
- [ ] Staircase: only V B N M J K L O P 0 play; others render dashed.
- [ ] Notes outside MIDI 21–108 are silent.
- [ ] Switching tabs while holding keys leaves nothing sounding.
- [ ] Settings survive a reload.
- [ ] No horizontal scroll at 390px wide.
- [ ] Push to `main` deploys to GitHub Pages.
