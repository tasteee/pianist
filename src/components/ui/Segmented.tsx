import { For, type JSX } from 'solid-js'
import { blurTarget } from './Stepper'

type Option<T> = { value: T; label: JSX.Element; title?: string }

export function Segmented<T>(props: { options: Option<T>[]; value: T; onChange: (v: T) => void; label: string; class?: string }) {
  return (
    <div class={`segmented ${props.class ?? ''}`} role="radiogroup" aria-label={props.label}>
      <For each={props.options}>
        {(o) => (
          <button
            type="button"
            role="radio"
            title={o.title}
            aria-checked={props.value === o.value}
            class="segment"
            classList={{ 'is-active': props.value === o.value }}
            onClick={(e) => {
              props.onChange(o.value)
              blurTarget(e)
            }}
          >
            {o.label}
          </button>
        )}
      </For>
    </div>
  )
}
