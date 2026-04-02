import { NAME } from './translations'

export class E87 extends WMEBase {
  helper: any
  panel: any
  container: any

  constructor (name, settings = null, buttons = null) {
    super(name, settings)

    this.initHelper()

    this.initTab()

    this.initPanel(buttons)
  }

  initHelper() {
    this.helper = new WMEUIHelper(this.name)
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
    if ( this.wmeSDK.DataModel.Segments.isRoadTypeDrivable({ roadType: model.roadType })
      && this.wmeSDK.DataModel.Segments.hasPermissions({ segmentId: model.id })
    ) {
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
      this.wmeSDK.DataModel.Segments.isRoadTypeDrivable({ roadType: model.roadType })
      && this.wmeSDK.DataModel.Segments.hasPermissions({ segmentId: model.id })
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
   * @param {Segment} segment of the segment
   */
  invert (segment) {
    if (!this.wmeSDK.DataModel.Segments.hasPermissions({ segmentId: segment.id })) {
      this.log('Locked by higher rank')
      return
    }
    this.group('invert segment ' + segment.id)

    let isReverse = this.wmeSDK.DataModel.Segments.getReversedSegments({
      segmentIds: [segment.id]
    }).length > 0

    // setup and reverse geometry
    let attributes: any = {
      segmentId: segment.id,
      geometry: {
        type: "LineString",
        coordinates: segment.geometry.coordinates.slice().reverse()
      }
    }

    // reverse the Direction
    // direction: SegmentDirection: { A_TO_B: "A_TO_B"; B_TO_A: "B_TO_A"; TWO_WAY: "TWO_WAY" }
    if (!segment.isTwoWay) {
      if (segment.isAtoB) {
        attributes.direction = "B_TO_A"
      } else {
        attributes.direction = "A_TO_B"
      }
    }

    // exchange the Speed Limits
    if (segment.revSpeedLimit !== segment.fwdSpeedLimit) {
      attributes.fwdSpeedLimit = segment.revSpeedLimit
      attributes.revSpeedLimit = segment.fwdSpeedLimit
    }

    // exchange the Lanes' Info
    if (segment.fromLanesInfo || segment.toLanesInfo) {
      attributes.fromLanesInfo = segment.toLanesInfo
      attributes.toLanesInfo = segment.fromLanesInfo
    }

    this.wmeSDK.DataModel.Segments.updateSegment(attributes)

    this.groupEnd()
  }
}
