import { helper } from '@heyform-inc/utils'

export function rgbaToString(type: 'hex' | 'rgba', rgba: number[]) {
  if (helper.isValidArray(rgba)) {
    const [r, g, b, alpha] = rgba!

    if (type === 'hex') {
      let value = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')

      if (alpha < 1) {
        value += Math.round(alpha * 0xff)
          .toString(16)
          .padStart(2, '0')
      }

      return value
    } else {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
  }
}
