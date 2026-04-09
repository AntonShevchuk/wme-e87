import { NAME } from './name'
import { TRANSLATION } from './translations'
import { SETTINGS, getButtons } from './settings'
import { E87 } from './e87'
import css from './style.css'

$(document).on('bootstrap.wme', () => {
  WMEUI.addTranslation(NAME, TRANSLATION)
  WMEUI.addStyle(css)

  new E87(NAME, SETTINGS, getButtons())
})
