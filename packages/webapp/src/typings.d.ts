/// <reference types="vite/client" />
import type { HTMLAttributes, ReactNode } from 'react'

export {}

declare global {
  type IComponentProps<E = HTMLElement> = HTMLAttributes<E>
  type IKeyType = string | number
  type IValueType = IKeyType | boolean
  type IMapType<V = any> = Record<string | number | symbol, V>
  type IOptionType = IMapType<IValueType> & {
    label: ReactNode
    value: IValueType
    disabled?: boolean
  }

  interface IModalProps {
    visible?: boolean
    onClose?: () => void
    onComplete?: () => void
  }

  interface Window {
    stripe: any
    grecaptcha: any
    initGeetest: any
    heyform: {
      homepageURL: string
      cookieDomain: string
      graphqlURL: string
      stripePublishableKey: string
      geetestCaptchaId: string
      googleRecaptchaKey: string
      device: {
        ios: boolean
        android: boolean
        mobile: boolean
        windowHeight: number
        screenHeight: number
      }
    }
    __APOLLO_DEVTOOLS_GLOBAL_HOOK__: boolean
    DEVICE_INFO: {
      ios: boolean
      android: boolean
      mobile: boolean
      windowHeight: number
      screenHeight: number
    }
  }
}
