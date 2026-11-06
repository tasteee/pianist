import { Match, Switch } from 'solid-js'
import { Controls } from './components/Controls'
import { ControlsBar } from './components/ControlsBar'
import { Keyboard } from './components/Keyboard'
import { usePlayEngine } from './engine'
import { audioUnlocked, loadState } from './engine/player'
import { useKeyboardInput } from './input'
import { noteForCode } from './state'

export default function App() {
  usePlayEngine((code) => noteForCode(code)?.midi)
  useKeyboardInput()

  return (
    <div class="app">
      <header class="topbar">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true" />
          Pianist
        </div>
        <Status />
      </header>

      <main class="stage">
        <Controls />
        <z-card class="keyboard-card">
          <Keyboard />
        </z-card>
        <ControlsBar />
      </main>

      <footer class="hints">
        <z-text size="sm" color="muted">
          <z-kbd size="sm">↑</z-kbd> <z-kbd size="sm">↓</z-kbd> Octave
        </z-text>
        <z-text size="sm" color="muted">
          <z-kbd size="sm">←</z-kbd> <z-kbd size="sm">→</z-kbd> Key
        </z-text>
        <z-text size="sm" color="muted">
          <z-kbd size="sm">Space</z-kbd> Sustain
        </z-text>
        <z-text size="sm" color="muted" class="hints-note">
          Numbers on keys are scale degrees.
        </z-text>
      </footer>
    </div>
  )
}

const getLoadProgressPercent = () => {
  const state = loadState()
  const isLoading = state.status === 'loading'
  if (!isLoading) return 100
  return Math.round(state.progress * 100)
}

const Status = () => {
  const isError = () => loadState().status === 'error'
  const isLoading = () => loadState().status === 'loading'
  const isIdle = () => !audioUnlocked()

  return (
    <div class="status" role="status">
      <Switch>
        <Match when={isError()}>
          <z-status-dot status="busy" label="Couldn’t load piano" />
        </Match>
        <Match when={isLoading()}>
          <z-progress size="sm" tone="secondary" label="Loading piano" prop:value={getLoadProgressPercent()} />
          <z-text size="sm" color="muted">Loading piano</z-text>
        </Match>
        <Match when={isIdle()}>
          <z-status-dot status="away" does-pulse label="Press any key to start" />
        </Match>
        <Match when={true}>
          <z-status-dot status="online" label="Ready" />
        </Match>
      </Switch>
    </div>
  )
}
