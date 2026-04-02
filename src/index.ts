import { NAME, TRANSLATION } from './translations'
import { SETTINGS, getButtons } from './settings'
import { E87 } from './e87'
import css from './style.css'

WMEUI.addTranslation(NAME, TRANSLATION)
WMEUI.addStyle(css)

$(document).on('bootstrap.wme', () => {
  new E87(NAME, SETTINGS, getButtons())
})
