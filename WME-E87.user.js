// ==UserScript==
// @name         WME E87 Inconsistent direction
// @version      0.0.1
// @description  Solves the inconsistent direction problem
// @license      MIT License
// @author       Anton Shevchuk
// @namespace    https://greasyfork.org/users/227648-anton-shevchuk
// @supportURL   https://github.com/AntonShevchuk/wme-template/issues
// @match        https://*.waze.com/editor*
// @match        https://*.waze.com/*/editor*
// @exclude      https://*.waze.com/user/editor*
// @icon         https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://anton.shevchuk.name&size=64
// @grant        none
// @require      https://greasyfork.org/scripts/389765-common-utils/code/CommonUtils.js?version=1090053
// @require      https://greasyfork.org/scripts/450160-wme-bootstrap/code/WME-Bootstrap.js?version=1128320
// @require      https://greasyfork.org/scripts/452563-wme/code/WME.js?version=1101598
// @require      https://greasyfork.org/scripts/450221-wme-base/code/WME-Base.js?version=1129908
// @require      https://greasyfork.org/scripts/450320-wme-ui/code/WME-UI.js?version=1128560
// ==/UserScript==

/* jshint esversion: 8 */

/* global require */
/* global $, jQuery */
/* global W */
/* global I18n */
/* global OpenLayers */
/* global WME, WMEBase */
/* global WMEUI, WMEUIHelper, WMEUIHelperPanel, WMEUIHelperModal, WMEUIHelperTab, WMEUIShortcut, WMEUIHelperFieldset */
/* global Container, Settings, SimpleCache, Tools  */

(function () {
  'use strict'

  // Script name, uses as unique index
  const NAME = 'E87'

  // Translations
  const TRANSLATION = {
    'en': {
      title: 'Direction',
      description: 'Plugin WME E87 solves the inconsistent direction problem',
      buttons: {
        A: 'A → B',
        B: 'B → A',
      },
    },
    'uk': {
      title: 'Напрямки →',
      description: 'Плагін WME E87 для вирішиння проблеми різно направленних вулиць',
      buttons: {
        A: 'A → B',
        B: 'B → A',
      },
    },
    'ru': {
      title: 'Направления →',
      description: 'Плагин WME E87 для решения проблемы разнонаправленных улиц',
      buttons: {
        A: 'A → B',
        B: 'B → A',
      },
    }
  }

  const STYLE =
    'button.waze-btn.e87 { background: #f2f4f7; border: 1px solid #ccc; margin: 2px; } ' +
    'button.waze-btn.e87:hover { background: #ffffff; transition: background-color 100ms linear; box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.1), inset 0 0 100px 100px rgba(255, 255, 255, 0.3); } ' +
    'button.waze-btn.e87:focus { background: #f2f4f7; } ' +
    'p.e87-info { border-top: 1px solid #ccc; color: #777; font-size: x-small; margin-top: 15px; padding-top: 10px; text-align: center; }'

  WMEUI.addTranslation(NAME, TRANSLATION)
  WMEUI.addStyle(STYLE)

  const BUTTONS = {
    A: {
      title: I18n.t(NAME).buttons.A,
      description: I18n.t(NAME).buttons.A,
      shortcut: '',
    },
    B: {
      title: I18n.t(NAME).buttons.B,
      description: I18n.t(NAME).buttons.B,
      shortcut: '',
    },
  }

  // Default settings
  const SETTINGS = {
  }

  class E87 extends WMEBase {
    /**
     * Initial UI elements
     * @param {Object} buttons
     */
    init (buttons) {
      /** @type {WMEUIHelper} */
      this.helper = new WMEUIHelper(this.name)

      /** @type {WMEUIHelperTab} */
      this.tab = this.helper.createTab(
        I18n.t(this.name).title,
        I18n.t(this.name).description,
        {
          'icon': '<i class="w-icon panel-header-component-icon w-icon-route"></i>'
        }
      )

      buttons.A.callback = () => this.onButtonA()
      buttons.B.callback = () => this.onButtonB()

      this.tab.addButtons(buttons)

      this.tab.addText(
        'info',
        '<a href="' + GM_info.scriptUpdateURL + '">' + GM_info.script.name + '</a> ' + GM_info.script.version
      )

      // Inject custom HTML to container in the WME interface
      this.tab.inject()
    }

    onButtonA () {
      this.log('Button A')
    }

    onButtonB () {
      this.log('Button B')
    }
  }

  $(document).on('bootstrap.wme', () => {
    let Instance = new E87(NAME, SETTINGS)
    Instance.init(BUTTONS)
  })

})()
