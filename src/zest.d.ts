import 'solid-js'

// Solid has no typings for zest, so every z-* tag accepts any props.
declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      [tag: `z-${string}`]: Record<string, unknown>
    }
  }
}
