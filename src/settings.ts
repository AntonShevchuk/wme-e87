import { NAME } from './translations'

export const SETTINGS = {}

export function getButtons() {
  return {
    toggle: {
      title: I18n.t(NAME).buttons.toggle,
      description: I18n.t(NAME).buttons.toggle,
      shortcut: null,
    },
  }
}
