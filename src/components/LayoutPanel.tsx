import { For, Show } from 'solid-js'
import { ROWS } from '../music/keymap'
import { CUSTOM_EXAMPLES, DIRECTIONS, type Direction, type Wrap } from '../music/layouts'
import { custom, layoutId, setCustom } from '../state'
import { blurActiveElement } from './ui/focus'

type ChangeEventT = CustomEvent<{ value: string | number | string[] | undefined }>

const INTERVAL_LIMIT = 12

const wrapOptions = [
  { value: 'scale', label: 'Scale', title: 'Fold each row into one octave' },
  { value: 'none', label: 'None', title: 'Keep climbing past the octave' },
]

const formatInterval = (interval: number) => {
  if (interval > 0) return `+${interval}`
  if (interval < 0) return `−${-interval}`
  return '0'
}

/** Edits the Custom layout. Only shown while Custom is selected. */
export const CustomLayoutEditor = () => {
  const isCustom = () => layoutId() === 'custom'

  const handleHorizontalChange = (event: ChangeEventT) => setCustom({ horizontal: Number(event.detail.value) })
  const handleVerticalChange = (event: ChangeEventT) => setCustom({ vertical: Number(event.detail.value) })

  const handleDirectionChange = (event: ChangeEventT) => {
    const nextDirection = event.detail.value
    const wasCleared = nextDirection === undefined
    if (wasCleared) return
    setCustom({ direction: nextDirection as Direction })
    blurActiveElement()
  }

  const handleWrapChange = (event: ChangeEventT) => {
    const nextWrap = event.detail.value
    const wasCleared = nextWrap === undefined
    if (wasCleared) return
    setCustom({ wrap: nextWrap as Wrap })
    blurActiveElement()
  }

  const handleRowLengthChange = (rowIndex: number, event: ChangeEventT) => {
    const rowLengths = custom().rowLengths.map((length, index) => (index === rowIndex ? Number(event.detail.value) : length))
    setCustom({ rowLengths })
  }

  const handleExampleClick = (horizontal: number, vertical: number) => {
    setCustom({ horizontal, vertical })
    blurActiveElement()
  }

  return (
    <Show when={isCustom()}>
      <div class="custom-editor">
        <div class="field-row">
          <z-field label="Horizontal">
            <z-number-input
              has-stepper-buttons
              prop:min={-INTERVAL_LIMIT}
              prop:max={INTERVAL_LIMIT}
              prop:value={custom().horizontal}
              on:change={handleHorizontalChange}
            />
          </z-field>

          <z-field label="Vertical">
            <z-number-input
              has-stepper-buttons
              prop:min={-INTERVAL_LIMIT}
              prop:max={INTERVAL_LIMIT}
              prop:value={custom().vertical}
              on:change={handleVerticalChange}
            />
          </z-field>

          <z-field label="Direction">
            <z-toggle-button-group kind="outline" prop:value={custom().direction} on:change={handleDirectionChange}>
              <For each={DIRECTIONS}>
                {(direction) => (
                  <z-toggle-button-group-item
                    value={direction.id}
                    title={direction.label}
                    prop:isPressed={custom().direction === direction.id}
                  >
                    {direction.arrows}
                  </z-toggle-button-group-item>
                )}
              </For>
            </z-toggle-button-group>
          </z-field>

          <z-field label="Wrap">
            <z-toggle-button-group kind="outline" prop:value={custom().wrap} on:change={handleWrapChange}>
              <For each={wrapOptions}>
                {(option) => (
                  <z-toggle-button-group-item
                    value={option.value}
                    title={option.title}
                    prop:isPressed={custom().wrap === option.value}
                  >
                    {option.label}
                  </z-toggle-button-group-item>
                )}
              </For>
            </z-toggle-button-group>
          </z-field>
        </div>

        <div class="field-row">
          <For each={ROWS}>
            {(row, rowIndex) => {
              const firstLabel = row.keys[0].label
              const lastLabel = row.keys[row.keys.length - 1].label
              const handleChange = (event: ChangeEventT) => handleRowLengthChange(rowIndex(), event)

              return (
                <z-field label={`Row ${firstLabel}–${lastLabel}`}>
                  <z-number-input
                    size="sm"
                    has-stepper-buttons
                    prop:min={0}
                    prop:max={row.keys.length}
                    prop:value={custom().rowLengths[rowIndex()]}
                    on:change={handleChange}
                  />
                </z-field>
              )
            }}
          </For>
        </div>

        <div class="chip-row">
          <z-label color="muted">Try</z-label>
          <For each={CUSTOM_EXAMPLES}>
            {(example) => {
              const horizontal = example[0]
              const vertical = example[1]
              const isActive = () => custom().horizontal === horizontal && custom().vertical === vertical
              const kind = () => (isActive() ? 'soft' : 'outline')
              const handleClick = () => handleExampleClick(horizontal, vertical)

              return (
                <z-button size="sm" tone="primary" prop:kind={kind()} on:click={handleClick}>
                  {formatInterval(horizontal)} / {formatInterval(vertical)}
                </z-button>
              )
            }}
          </For>
        </div>
      </div>
    </Show>
  )
}
