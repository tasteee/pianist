# Pianist

Play piano from your computer keyboard, locked to any key and scale.

## Run

```bash
npm install
npm run dev
```

## How it plays

- **36 keys:** `1`–`0`, `Q`–`P`, `A`–`L`, `Z`–`M` (10 / 10 / 9 / 7).
- **Layouts** decide which scale degree each key plays. Pick one from the Layout menu:
  - **Melodic:** Standard, Isometric, Right Up, Down Right, Linear, Staircase
  - **Harmonic:** Thirds, Fifths, Arpeggio, Pentatonic
  - **Experimental:** Zig-Zag, Mirror, Random Walk, Custom
- **Custom** sets horizontal and vertical intervals, direction, scale wrapping and row lengths.
- **Space** = sustain pedal. **↑ ↓** = octave. **← →** = change key.
- Keys match by physical position (`KeyboardEvent.code`), so any language layout works.

## Play pipeline

```
keyboard / tap ──key:down──▶ mapper ──note:on──▶ player ──▶ Splendid Grand Piano
                (key code)   (looks up   (MIDI)   (sustain,
                              layout)              voices)
```

## Code map

| File | Job |
| --- | --- |
| `src/music/theory.ts` | Roots, scales, correct note spelling (E♭ not D♯) |
| `src/music/keymap.ts` | Physical key grid |
| `src/music/layouts.ts` | Layouts: key position → scale step |
| `src/state.ts` | Settings (saved to localStorage), key → note lookup |
| `src/input.ts` | Layer 1: keyboard / pointer → `key:down` / `key:up` |
| `src/engine/mapper.ts` | Layer 2: key code → current note → `note:on` / `note:off` |
| `src/engine/player.ts` | Layer 3: notes → `smplr` Splendid Grand Piano, sustain pedal |
| `src/engine/bus.ts`, `events.ts` | Typed event buses between the layers |
| `src/components/*` | Controls, keyboard, piano strip |

Built with SolidJS + Vite + TypeScript.

## Deploy

Every push to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.
Live at https://tasteee.github.io/pianist/
