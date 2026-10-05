// Controls never keep focus: the keyboard belongs to the instrument.
export const blurTarget = (e: Event) => (e.currentTarget as HTMLElement).blur()

type StepperProps = {
  value: number
  min: number
  max: number
  onChange: (n: number) => void
  label: string
  /** Show a leading + on positive values (intervals). */
  signed?: boolean
  size?: 'm' | 's'
}

export function Stepper(props: StepperProps) {
  const set = (e: Event, n: number) => {
    props.onChange(Math.min(props.max, Math.max(props.min, n)))
    blurTarget(e)
  }
  const shown = () => (props.signed && props.value > 0 ? `+${props.value}` : props.value.toString().replace('-', '−'))

  return (
    <div class="stepper" classList={{ 'stepper--s': props.size === 's' }} role="group" aria-label={props.label}>
      <button
        type="button"
        class="stepper-btn"
        aria-label={`${props.label} down`}
        disabled={props.value <= props.min}
        onClick={(e) => set(e, props.value - 1)}
      >
        −
      </button>
      <output class="stepper-value" aria-live="polite">
        {shown()}
      </output>
      <button
        type="button"
        class="stepper-btn"
        aria-label={`${props.label} up`}
        disabled={props.value >= props.max}
        onClick={(e) => set(e, props.value + 1)}
      >
        +
      </button>
    </div>
  )
}
