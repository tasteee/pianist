import { onCleanup } from 'solid-js'
import { startMapper } from './mapper'
import { startPlayer } from './player'

/** Boot the mapper and player layers for the lifetime of the calling component. */
export function usePlayEngine(lookup: (code: string) => number | undefined) {
  const stopPlayer = startPlayer()
  const stopMapper = startMapper(lookup)
  onCleanup(() => {
    stopMapper()
    stopPlayer()
  })
}
