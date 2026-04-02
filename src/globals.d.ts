declare module '*.css' {
  const css: string
  export default css
}

declare class WMEBase {
  name: string
  id: string
  wmeSDK: any

  constructor(name: string, settings?: any)

  log(...args: any[]): void
  group(...args: any[]): void
  groupEnd(): void
  getSelectedSegments(): any[]
}

declare class WMEUI {
  static addTranslation(name: string, translation: Record<string, any>): void
  static addStyle(css: string): void
}

declare class WMEUIHelper {
  constructor(name: string)
  createTab(title: string, options?: any): any
  createPanel(title: string, options?: any): any
}

declare class WMEUIHelperTab {}
declare class WMEUIHelperPanel {}
declare class WMEUIHelperModal {}
declare class WMEUIHelperFieldset {}

declare const I18n: {
  t(key: string): any
}

declare const GM_info: any

declare const Container: any
declare const Settings: any
declare const SimpleCache: any
declare const Tools: any
