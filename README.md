# Pianist

Play piano from your computer keyboard, locked to any key and scale.

## Run

```bash
npm install
npm run dev
```

## How it plays

- **Rows = octaves.** `Z` row is the base octave, `A` row +1, `Q` row +2, number row +3.
- **First letter of each row is the root.** Keys to the right walk up the scale.
- **Backtick** is one step below the number row's root, so all rows line up.
- **Space** = sustain pedal. **↑ ↓** = octave. **← →** = change key.
- Keys match by physical position (`KeyboardEvent.code`), so any layout works.

## Code map

| File | Job |
| --- | --- |
| `src/music/theory.ts` | Roots, scales, correct note spelling (E♭ not D♯) |
| `src/music/keymap.ts` | Physical key rows and their scale steps |
| `src/audio/piano.ts` | AudioContext + SoundFont piano (`smplr`, MusyngKite) |
| `src/state.ts` | Settings (saved to localStorage), held/sustained notes |
| `src/input.ts` | Keyboard events → notes |
| `src/components/*` | Controls, keyboard, piano strip |

Built with SolidJS + Vite + TypeScript.

## Deploy

Every push to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.
Live at https://tasteee.github.io/pianist/
