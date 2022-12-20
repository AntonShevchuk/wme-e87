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
    'button.waze-btn.e87 { background: #f2f4f7; border: 1px solid #ccc; margin: 2px 8px; } ' +
    'button.waze-btn.e87:hover { background: #ffffff; transition: background-color 100ms linear; box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.1), inset 0 0 100px 100px rgba(255, 255, 255, 0.3); } ' +
    'button.waze-btn.e87:focus { background: #f2f4f7; } ' +
    'div.e87-container { display: flex; } ' +
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
  const SETTINGS = {}

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

    /**
     * Handler for `segment.wme` event
     * @param {jQuery.Event} event
     * @param {HTMLElement} element
     * @param {W.model} model
     * @return {void}
     */
    onSegment (event, element, model) {
      this.log('Selected one segment')
    }

    /**
     * Handler for `segments.wme` event
     * @param {jQuery.Event} event
     * @param {HTMLElement} element
     * @param {Array} models
     * @return {void}
     */
    onSegments (event, element, models) {
      this.log('Check selected segments')
      this.detect(models)
    }

    /**
     * Detect directions
     * @param {Array<Object>} segments
     */
    detect (segments) {
      let forward = [], backward = [], node
      for (let i = 0; i < segments.length; i++) {
        // check first segment direction
        let A = segments[i].getFromNode().getID()
        let B = segments[i].getToNode().getID()
        let nextA, nextB

        // check next segment
        if (i + 1 < segments.length) {
          nextA = segments[i + 1].getFromNode().getID()
          nextB = segments[i + 1].getToNode().getID()
        } else {
          if (node === A) {
            forward.push(segments[i].getID())
          } else if (node === B) {
            backward.push(segments[i].getID())
          }
          continue
        }

        // looking for intersection of two segments
        if (A === nextA || A === nextB) {
          // B-A × A-B or B-A × B-A
          node = A
          backward.push(segments[i].getID())
        } else if (B === nextA || B === nextB) {
          // A-B × A-B or A-B × B-A
          node = B
          forward.push(segments[i].getID())
        } else {
          this.log('Segments doesn\'t have intersection')
          return
        }
      }

      if (forward.length && backward.length) {
        this.log('Inconsistent direction detected: forward = ' + forward.length + ' backward = ' + backward.length)

        let buttonToForward = document.createElement('button')
        buttonToForward.type = 'button'
        buttonToForward.className = 'waze-btn waze-btn-small waze-btn-white e87'
        buttonToForward.innerText = 'Make all forward (' + backward.length + ')'
        buttonToForward.onclick = (e) => {
          e.preventDefault()
          backward.forEach(el => this.invert(el))
        }
        let buttonToBackward = document.createElement('button')
        buttonToBackward.type = 'button'
        buttonToBackward.className = 'waze-btn waze-btn-small waze-btn-white e87'
        buttonToBackward.innerText = 'Make all backward (' + forward.length + ')'
        buttonToBackward.onclick = (e) => {
          e.preventDefault()
          forward.forEach(el => this.invert(el))
        }

        let container = document.createElement('div')
        container.className = 'e87-container'
        container.append(buttonToForward)
        container.append(buttonToBackward)

        $('wz-alert.sidebar-alert.inconsistent-direction-alert .sidebar-alert-content').after(container)
      }
    }

    /**
     * Invert direction of the segment
     * @param {Number} id of the segment
     */
    invert (id) {
      let segment = W.model.segments.getObjectById(id)
      if (segment.isLockedByHigherRank()) {
        this.log('Locked by higher rank')
        return
      }
      console.groupCollapsed(
        '%c' + this.name + ':%c invert segment',
        'color: #0DAD8D; font-weight: bold',
        'color: dimgray; font-weight: normal'
      )

      console.log('segment', segment)

      let attributes = {}
      attributes.fwdDirection = segment.attributes.revDirection
      attributes.revDirection = segment.attributes.fwdDirection
      // attributes.fwdTurnsLocked = segment.revTurnsLocked // ???
      // attributes.revTurnsLocked = segment.fwdTurnsLocked // ???
      attributes.fwdMaxSpeed = segment.attributes.revMaxSpeed
      attributes.revMaxSpeed = segment.attributes.fwdMaxSpeed
      attributes.fwdMaxSpeedUnverified = segment.attributes.revMaxSpeedUnverified
      attributes.revMaxSpeedUnverified = segment.attributes.fwdMaxSpeedUnverified
      attributes.fwdLaneCount = segment.attributes.revLaneCount
      attributes.revLaneCount = segment.attributes.fwdLaneCount

      attributes.restrictions = []

      for (let i = 0; i < segment.attributes.restrictions.length; i++) {
        attributes.restrictions[i] = segment.attributes.restrictions[i].withReverseDirection()
      }

      console.log('attributes', attributes)

      let fromNode = segment.getFromNode()
      let toNode = segment.getToNode()

      let onA = {}
      let toConnections = {}
      fromNode.getSegmentIds().forEach(segId => {
        if (segId !== id) {
          onA[segId] = W.model.getTurnGraph().getTurnThroughNode(fromNode, W.model.segments.getObjectById(segId), segment)
          onA[segId].toVertex.direction = onA[segId].toVertex.direction === 'fwd' ? 'rev' : 'fwd'
        }

        toConnections[segId] = W.model.getTurnGraph().getTurnThroughNode(fromNode, segment, W.model.segments.getObjectById(segId))
        toConnections[segId].fromVertex.direction = toConnections[segId].fromVertex.direction === 'fwd' ? 'rev' : 'fwd'

        // u-turn
        if (segId === id) {
          toConnections[segId].toVertex.direction = toConnections[segId].toVertex.direction === 'fwd' ? 'rev' : 'fwd'
        }
      })

      let onB = {}
      let fromConnections = {}
      toNode.getSegmentIds().forEach(segId => {
        if (segId !== id) {
          onB[segId] = W.model.getTurnGraph().getTurnThroughNode(toNode, W.model.segments.getObjectById(segId), segment)
          onB[segId].toVertex.direction = onB[segId].toVertex.direction === 'fwd' ? 'rev' : 'fwd'
        }

        fromConnections[segId] = W.model.getTurnGraph().getTurnThroughNode(toNode, segment, W.model.segments.getObjectById(segId))
        fromConnections[segId].fromVertex.direction = fromConnections[segId].fromVertex.direction === 'fwd' ? 'rev' : 'fwd'

        // u-turn
        if (segId === id) {
          fromConnections[segId].toVertex.direction = fromConnections[segId].toVertex.direction === 'fwd' ? 'rev' : 'fwd'
        }
      })

      // on inverse la geometrie du segment
      let geometry = segment.geometry.clone()
      geometry.components.reverse()

      // controle de position
      let nbPoints = geometry.components.length - 1
      if (!geometry.components[0].equals(toNode.attributes.geometry)) {
        let delta = { x: 0, y: 0 }
        delta.x = toNode.attributes.geometry.x - geometry.components[0].x
        delta.y = toNode.attributes.geometry.y - geometry.components[0].y
        geometry.components[0].move(delta.x, delta.y)
      }
      if (!geometry.components[nbPoints].equals(fromNode.attributes.geometry)) {
        let delta = { x: 0, y: 0 }
        delta.x = fromNode.attributes.geometry.x - geometry.components[nbPoints].x
        delta.y = fromNode.attributes.geometry.y - geometry.components[nbPoints].y
        geometry.components[nbPoints].move(delta.x, delta.y)
      }

      // On deconnecte le segment
      W.model.actionManager.add(new WazeActionMultiAction([new WazeActionDisconnectSegment(segment, fromNode), new WazeActionDisconnectSegment(segment, toNode)]))

      // maj de la geo du seg
      W.model.actionManager.add(new WazeActionUpdateSegmentGeometry(segment, segment.geometry, geometry))

      // On reconnecte le segment
      W.model.actionManager.add(new WazeActionMultiAction([new WazeActionConnectSegment(toNode, segment), new WazeActionConnectSegment(fromNode, segment)]))

      this.applyTurns(fromConnections)
      this.applyTurns(toConnections)
      this.applyTurns(onA)
      this.applyTurns(onB)

      console.groupEnd()
    }

    /**
     * Apply turns for segments
     * @param segments
     */
    applyTurns (segments) {
      let actions = []
      for (let sid in segments) {
        let segment = segments[sid]
        let turn
        switch (segment.turnData.state) {
          case 0 :
          case 1 :
            turn = WazeModelGraphTurnData.create()
            turn = turn.withState(segment.turnData.state)
            turn = turn.withRestrictions(segment.turnData.restrictions)
            turn = turn.withInstructionOpcode(segment.turnData.instructionOpcode)
            turn = turn.withLanes(segment.turnData.lanes)

            actions.push(new WazeModelGraphActionsSetTurn(W.model.getTurnGraph(), segment.withTurnData(turn)))
            break
        }
      }
      W.model.actionManager.add(new WazeActionMultiAction(actions))
    }
  }

  let WazeActionConnectSegment
  let WazeActionDisconnectSegment
  let WazeActionModifyAllConnections
  let WazeActionMultiAction
  let WazeActionUpdateObject
  let WazeActionUpdateSegmentGeometry
  let WazeModelGraphTurnData
  let WazeModelGraphActionsSetTurn

  $(document).on('bootstrap.wme', () => {
    let Instance = new E87(NAME, SETTINGS)
    Instance.init(BUTTONS)

    WazeActionConnectSegment = require('Waze/Action/ConnectSegment')
    WazeActionDisconnectSegment = require('Waze/Action/DisconnectSegment')
    WazeActionModifyAllConnections = require('Waze/Action/ModifyAllConnections')
    WazeActionMultiAction = require('Waze/Action/MultiAction')
    WazeActionUpdateObject = require('Waze/Action/UpdateObject')
    WazeActionUpdateSegmentGeometry = require('Waze/Action/UpdateSegmentGeometry')
    WazeModelGraphTurnData = require('Waze/Model/Graph/TurnData')
    WazeModelGraphActionsSetTurn = require('Waze/Model/Graph/Actions/SetTurn')
  })
})()
