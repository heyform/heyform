/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
/// <reference types="unplugin-fonts/client" />
import { DOMAttributes, HTMLAttributes } from 'react'

declare global {
  type DOMProps<E = HTMLElement> = Pick<DOMAttributes<E>, 'children'>
  type ComponentProps<E = HTMLElement> = HTMLAttributes<E>
  type Optional<T, K extends keyof T> = Omit<T, K> & Partial<T>

  type Any = any
  type AnyMap<K = string, V = Any> = Record<K, V>

  type Timeout = ReturnType<typeof setTimeout>

  interface Window {
    initGeetest4: any
    plausible: any
    DEVICE_INFO: any
    TrackdeskObject: any
    heyform: {
      device: {
        ios: boolean
        android: boolean
        mobile: boolean
        windowHeight: number
        screenHeight: number
      }
    }
    __APOLLO_DEVTOOLS_GLOBAL_HOOK__: boolean
  }
}

export {}
