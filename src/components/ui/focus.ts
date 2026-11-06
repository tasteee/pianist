// Controls never keep focus: the keyboard belongs to the instrument.
export const blurActiveElement = () => {
  const active = document.activeElement as HTMLElement | null
  active?.blur()
}
