import { Dom } from './utils'

export type AnyMap = Record<string, any>

export interface FullPageSettings {
  customUrl: string
  transparentBackground?: boolean
}

export interface StandardSettings extends FullPageSettings {
  widthType?: 'px' | '%'
  width?: number
  autoResizeHeight?: boolean
  heightType?: 'px' | '%'
  height?: number
}

export interface ModalSettings extends Omit<FullPageSettings, 'transparentBackground'> {
  size?: 'large' | 'medium' | 'small'
  openTrigger?: 'click' | 'loaded' | 'delay' | 'exit' | 'scroll'
  openDelay?: number
  openScrollPercent?: number
  triggerBackground?: string
  hideAfterSubmit?: boolean
  autoClose?: number
}

export interface PopupSettings extends Omit<ModalSettings, 'size'> {
  position?: 'bottom-left' | 'bottom-right'
  iconUrl?: string
  width?: number
  height?: number
}

export interface EmbedConfig<T> {
  formId: string
  type: 'standard' | 'fullpage' | 'modal' | 'popup'
  container: Dom
  settings: T
  hiddenFields?: Record<string, string>
}
