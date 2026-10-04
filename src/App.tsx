import { For, Match, Switch } from 'solid-js'
import { audioUnlocked, loadState } from './audio/piano'
import { Controls } from './components/Controls'
import { Keyboard } from './components/Keyboard'
import { PianoStrip } from './components/PianoStrip'
import { useKeyboardInput } from './input'
import { mod, noteLabel } from './music/theory'
import { root, scale, scaleNotes, sounding } from './state'

export default function App() {
  useKeyboardInput()

  const soundingClasses = () => new Set([...sounding()].map((m) => mod(m, 12)))

  return (
    <div class="app">
      <header class="topbar">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true" />
          Pianist
        </div>
        <Status />
      </header>

      <Controls />

      <main class="stage">
        <section class="readout" aria-live="polite">
          <h1 class="readout-title">
            {root().id} <span class="readout-scale">{scale().name}</span>
          </h1>
          <ol class="degrees">
            <For each={scaleNotes()}>
              {(n) => (
                <li class="degree" classList={{ 'is-on': soundingClasses().has(mod(n.midi, 12)) }}>
                  <span class="degree-note">{noteLabel(n)}</span>
                  <span class="degree-num">{n.degree}</span>
                </li>
              )}
            </For>
          </ol>
        </section>

        <Keyboard />
        <PianoStrip />
      </main>

      <footer class="hints">
        <span><kbd>↑</kbd><kbd>↓</kbd> Octave</span>
        <span><kbd>←</kbd><kbd>→</kbd> Key</span>
        <span><kbd>Space</kbd> Sustain</span>
        <span class="hints-note">Each row up is one octave higher. First letter of each row is the root.</span>
      </footer>
    </div>
  )
}

function Status() {
  return (
    <div class="status" role="status">
      <Switch>
        <Match when={loadState().status === 'error'}>
          <span class="status-dot is-error" />
          Couldn’t load piano
        </Match>
        <Match when={loadState().status === 'loading'}>
          <span class="status-ring" style={{ '--p': progress() }} />
          Loading piano
        </Match>
        <Match when={!audioUnlocked()}>
          <span class="status-dot is-idle" />
          Press any key to start
        </Match>
        <Match when={true}>
          <span class="status-dot is-ready" />
          Ready
        </Match>
      </Switch>
    </div>
  )
}

const progress = () => {
  const s = loadState()
  return s.status === 'loading' ? s.progress : 1
}
