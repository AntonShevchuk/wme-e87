import { NAME } from './translations'

export class E87 extends WMEBase {
  panel: any
  container: any

  constructor (name, settings = null, buttons = null) {
    super(name, settings)

    this.initTab()

    this.initPanel(buttons)
  }

  initTab() {
    /** @type {WMEUIHelperTab} */
    let tab = this.helper.createTab(
      I18n.t(this.name).title,
      {
        sidebar: this.wmeSDK.Sidebar,
        image: GM_info.script.icon
      }
    )
    tab.addText('description', I18n.t(this.name).description)
    tab.addText('info', '<a href="' + GM_info.scriptUpdateURL + '">' + GM_info.script.name + '</a> ' + GM_info.script.version)
    tab.addText('blue', 'made in')
    tab.addText('yellow', 'Ukraine')
    tab.inject()
  }

  /**
   * Init button for selection of the segment
   * @param buttons
   */
  initPanel (buttons) {
    /** @type {WMEUIHelperPanel} */
    this.panel = this.helper.createPanel(I18n.t(this.name).title)

    buttons.toggle.callback = (e) => {
      e.preventDefault()
      this.getSelectedSegments().forEach(
        segment => this.invert(segment)
      )
    }

    this.panel.addButtons(buttons)
  }

  /**
   * Handler for `segment.wme` event
   * @param {jQuery.Event} event
   * @param {HTMLElement} element
   * @param {Segment} model
   * @return {void}
   */
  onSegment (event, element, model) {
    // Skip for walking trails and blocked roads
    if (this.canEditSegment(model)) {
      element.prepend(this.panel.html())
    } else {
      // Remove the panel
      element.querySelector('div.form-group.e87')?.remove()
    }
  }

  /**
   * Handler for `segments.wme` event
   * @param {jQuery.Event} event
   * @param {HTMLElement} element
   * @param {Array} models
   * @return {void}
   */
  onSegments (event, element, models) {
    // Skip walking trails or locked roads
    if (models.filter((model) =>
      this.canEditSegment(model)
    ).length === 0) {
      // Remove the panel
      element.querySelector('div.form-group.e87')?.remove()
      return
    }

    let reversed = this.wmeSDK.DataModel.Segments.getReversedSegments({
      segmentIds: this.wmeSDK.Editing.getSelection().ids
    })

    if (reversed.length === models.length || reversed.length === 0) {
      // you can reverse all selected segments
      element.prepend(this.panel.html())
      return
    }

    let reversedIds = reversed.map((segment) => segment.id)

    let forward = models.filter((model) => reversedIds.indexOf(model.id) === -1)

    let forwardIds = forward.map((segment) => segment.id)

    if (forwardIds.length && reversedIds.length) {
      this.log('Inconsistent direction detected: forward = ' + forwardIds.length + ' backward = ' + reversedIds.length)

      let buttonToForward = document.createElement('button')
      buttonToForward.type = 'button'
      buttonToForward.title = I18n.t(NAME).buttons.toggle
      buttonToForward.className = 'waze-btn waze-btn-small waze-btn-white e87 e87-forward'
      buttonToForward.innerText = I18n.t(NAME).buttons.forward + ' (' + reversedIds.length + ')'
      buttonToForward.onclick = (e) => {
        e.preventDefault()
        reversed.forEach(el => this.invert(el))
        buttonToForward.innerText = I18n.t(NAME).buttons.forward + ' (0)'
        buttonToForward.disabled = true
      }
      let buttonToReverse = document.createElement('button')
      buttonToReverse.type = 'button'
      buttonToReverse.title = I18n.t(NAME).buttons.toggle
      buttonToReverse.className = 'waze-btn waze-btn-small waze-btn-white e87 e87-reverse'
      buttonToReverse.innerText = I18n.t(NAME).buttons.reverse + ' (' + forwardIds.length + ')'
      buttonToReverse.onclick = (e) => {
        e.preventDefault()
        forward.forEach(el => this.invert(el))
        buttonToReverse.innerText = I18n.t(NAME).buttons.reverse + ' (0)'
        buttonToReverse.disabled = true
      }

      this.container?.remove();

      this.container = document.createElement('div')
      this.container.className = 'e87-container'
      this.container.append(buttonToForward)
      this.container.append(buttonToReverse)

      $('wz-alert.sidebar-alert.inconsistent-direction-alert > div')
        .after(this.container)
    }
  }

  /**
   * Invert direction of the segment
   *
   * Full reversal requires these steps:
   * 1. Disconnect segment from both nodes
   * 2. Reverse geometry
   * 3. Swap direction, speed limits, lanes, restrictions
   * 4. Reconnect segment to nodes (swapped)
   * 5. Restore turns with flipped fwd/rev directions
   *
   * Currently WME SDK lacks disconnect/connect/turn-graph methods,
   * so only geometry and attributes are updated.
   *
   * @param {Segment} segment
   */
  invert (segment: any) {
    if (!this.canEditSegment(segment)) {
      this.log('Locked by higher rank')
      return
    }
    this.group('invert segment ' + segment.id)

    // Step 1: Disconnect segment from both nodes
    // TODO: waiting for wmeSDK.DataModel.Segments.disconnectSegment()
    // this.disconnectFromNodes(segment)

    // Step 2: Reverse geometry with node snapping
    let reversedGeometry = this.reverseGeometry(segment)

    // Step 3: Build reversed attributes
    let attributes: any = {
      segmentId: segment.id,
      geometry: reversedGeometry
    }

    this.swapDirection(segment, attributes)
    this.swapSpeedLimits(segment, attributes)
    this.swapLanes(segment, attributes)

    // Step 4: Apply changes
    this.wmeSDK.DataModel.Segments.updateSegment(attributes)

    // Step 5: Reconnect segment to nodes (swapped)
    // TODO: waiting for wmeSDK.DataModel.Segments.connectSegment()
    // this.connectToNodes(segment)

    // Step 6: Restore turns with flipped fwd/rev directions
    // TODO: waiting for wmeSDK.DataModel.Turns.setTurn() or similar
    // this.restoreTurns(segment)

    this.groupEnd()
  }

  /**
   * Reverse segment geometry and snap endpoints to node positions
   */
  reverseGeometry (segment: any): any {
    let fromNode = this.wmeSDK.DataModel.Nodes.getById({ nodeId: segment.fromNodeId })
    let toNode = this.wmeSDK.DataModel.Nodes.getById({ nodeId: segment.toNodeId })

    let coordinates = segment.geometry.coordinates.slice().reverse()

    // Snap endpoints to exact node positions
    if (toNode) {
      coordinates[0] = toNode.geometry.coordinates.slice()
    }
    if (fromNode) {
      coordinates[coordinates.length - 1] = fromNode.geometry.coordinates.slice()
    }

    return { type: "LineString", coordinates }
  }

  /**
   * Swap segment direction (A→B becomes B→A and vice versa)
   */
  swapDirection (segment: any, attributes: any) {
    if (!segment.isTwoWay) {
      attributes.direction = segment.isAtoB ? "B_TO_A" : "A_TO_B"
    }
  }

  /**
   * Swap forward/reverse speed limits
   */
  swapSpeedLimits (segment: any, attributes: any) {
    if (segment.revSpeedLimit !== segment.fwdSpeedLimit) {
      attributes.fwdSpeedLimit = segment.revSpeedLimit
      attributes.revSpeedLimit = segment.fwdSpeedLimit
    }
  }

  /**
   * Swap forward/reverse lane info
   */
  swapLanes (segment: any, attributes: any) {
    if (segment.fromLanesInfo || segment.toLanesInfo) {
      attributes.fromLanesInfo = segment.toLanesInfo
      attributes.toLanesInfo = segment.fromLanesInfo
    }
  }

  /**
   * Disconnect segment from both nodes
   * TODO: implement when SDK provides disconnectSegment
   */
  // disconnectFromNodes (segment: any) {
  //   this.wmeSDK.DataModel.Segments.disconnectSegment({ segmentId: segment.id, nodeId: segment.fromNodeId })
  //   this.wmeSDK.DataModel.Segments.disconnectSegment({ segmentId: segment.id, nodeId: segment.toNodeId })
  // }

  /**
   * Reconnect segment to nodes (swapped after reversal)
   * TODO: implement when SDK provides connectSegment
   */
  // connectToNodes (segment: any) {
  //   this.wmeSDK.DataModel.Segments.connectSegment({ segmentId: segment.id, nodeId: segment.toNodeId })
  //   this.wmeSDK.DataModel.Segments.connectSegment({ segmentId: segment.id, nodeId: segment.fromNodeId })
  // }

  /**
   * Restore turns at both nodes with flipped fwd/rev directions
   * TODO: implement when SDK provides turn graph manipulation
   */
  // restoreTurns (segment: any) {
  //   this.log('TODO: restore turns after reversal')
  // }
}
