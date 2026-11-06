import { LAYOUTS } from '../music/layouts'
import { OCTAVE_MAX, OCTAVE_MIN, layoutId, octave, rootIndex, scaleId, setLayoutId, setOctave, setRootIndex, setScaleId } from '../state'
import { ROOTS, SCALES } from '../music/theory'
import { blurActiveElement } from './ui/focus'

type ChangeEventT = CustomEvent<{ value: string | number }>

const keyOptions = ROOTS.map((root, index) => ({ value: String(index), label: root.id }))
const scaleOptions = SCALES.map((scale) => ({ value: scale.id, label: scale.name }))

const layoutOptions = LAYOUTS.map((layout) => ({ value: layout.id, label: layout.name }))

export const Controls = () => {
  const handleKeyChange = (event: ChangeEventT) => {
    setRootIndex(Number(event.detail.value))
    blurActiveElement()
  }

  const handleScaleChange = (event: ChangeEventT) => {
    setScaleId(String(event.detail.value))
    blurActiveElement()
  }

  const handleLayoutChange = (event: ChangeEventT) => {
    setLayoutId(String(event.detail.value))
    blurActiveElement()
  }

  const handleOctaveChange = (event: ChangeEventT) => {
    setOctave(Number(event.detail.value))
    blurActiveElement()
  }

  const selectedKey = String(rootIndex())

  return (
    <div class="controls">
      <z-field class="field-key" label="Key">
        <z-select prop:options={keyOptions} prop:value={selectedKey} on:change={handleKeyChange} />
      </z-field>

      <z-field class="field-scale" label="Scale">
        <z-select prop:options={scaleOptions} prop:value={scaleId()} on:change={handleScaleChange} />
      </z-field>

      <z-field class="field-octave" label="Octave">
        <z-number-input
          has-stepper-buttons
          prop:min={OCTAVE_MIN}
          prop:max={OCTAVE_MAX}
          prop:value={octave()}
          on:change={handleOctaveChange}
        />
      </z-field>

      <z-field class="field-layout" label="Layout">
        <z-select prop:options={layoutOptions} prop:value={layoutId()} on:change={handleLayoutChange} />
      </z-field>
    </div>
  )
}
