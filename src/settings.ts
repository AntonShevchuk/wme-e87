import { NAME } from './name'

export const SETTINGS = {}

export function getButtons() {
  return {
    toggle: {
      title: WMEUI.t(NAME).buttons.toggle,
      description: WMEUI.t(NAME).buttons.toggle,
      shortcut: null,
    },
  }
}
