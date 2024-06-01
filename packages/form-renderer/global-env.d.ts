declare global {
  interface Window {
    heyform: {
      device: {
        ios: boolean
        android: boolean
        mobile: boolean
        windowHeight: number
        screenHeight: number
      }
    }
  }
}

export {}
