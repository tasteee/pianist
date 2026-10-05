// Minimal typed pub/sub. Each layer talks to the next through one of these.

type Listener<T> = (payload: T) => void

export type Bus<Events extends Record<string, unknown>> = {
  on<K extends keyof Events>(type: K, listener: Listener<Events[K]>): () => void
  emit<K extends keyof Events>(type: K, payload: Events[K]): void
}

export function createBus<Events extends Record<string, unknown>>(): Bus<Events> {
  const listeners = new Map<keyof Events, Set<Listener<never>>>()

  return {
    on(type, listener) {
      const set = listeners.get(type) ?? new Set()
      set.add(listener as Listener<never>)
      listeners.set(type, set)
      return () => set.delete(listener as Listener<never>)
    },
    emit(type, payload) {
      listeners.get(type)?.forEach((fn) => (fn as Listener<typeof payload>)(payload))
    },
  }
}
