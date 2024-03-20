import type { FormTheme } from '@heyform-inc/shared-types-enums'
import { alpha, helper, hexToRgb, isDarkColor } from '@heyform-inc/utils'

export const DEFAULT_THEME: FormTheme = {
  fontFamily: 'Public Sans',
  questionTextColor: '#000',
  answerTextColor: '#0445AF',
  buttonBackground: '#0445AF',
  buttonTextColor: '#fff',
  backgroundColor: '#fff'
}

export const GOOGLE_FONTS = [
  'Public Sans',
  'Inter',
  'Montserrat',
  'Alegreya',
  'B612',
  'Muli',
  'Titillium Web',
  'Varela',
  'Vollkorn',
  'IBM Plex Mono',
  'Crimson Text',
  'Cairo',
  'BioRhyme',
  'Karla',
  'Lora',
  'Frank Ruhl Libre',
  'Playfair Display',
  'Archivo',
  'Spectral',
  'Fjalla One',
  'Roboto',
  'Rubik',
  'Source Sans Pro',
  'Cardo',
  'Cormorant',
  'Work Sans',
  'Rakkas',
  'Concert One',
  'Yatra One',
  'Arvo',
  'Lato',
  'Abril Fatface',
  'Ubuntu',
  'PT Serif',
  'Old Standard TT',
  'Oswald',
  'Open Sans',
  'Courier Prime',
  'Poppins',
  'Josefin Sans',
  'Fira Sans',
  'Nunito',
  'Exo 2',
  'Merriweather',
  'Noto Sans'
]

export function getWebFontURL(fontName?: string) {
  if (fontName && GOOGLE_FONTS.includes(fontName)) {
    fontName = fontName.replace(/\s+/g, '+')
    return `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;600;700;800&display=swap`
  }
}

export function insertWebFont(fontName?: string) {
  const href = getWebFontURL(fontName)

  if (!href) {
    return
  }

  let link = document.getElementById('heyform-webfont')

  if (!link) {
    link = document.createElement('link')

    link.id = 'heyform-webfont'
    link.setAttribute('rel', 'stylesheet')

    document.head.appendChild(link)
  }

  link.setAttribute('href', href)
}

export function getTheme(theme?: FormTheme): FormTheme {
  return {
    ...DEFAULT_THEME,
    ...theme
  }
}

function getAdaptedColor(color: string, alphaNum = 0.5, step = 20): string {
  const isDark = isDarkColor(color)
  const [red, green, blue] = hexToRgb(color).map(c =>
    isDark ? Math.min(255, c + step) : Math.max(0, c - step)
  )
  return `rgba(${red}, ${green}, ${blue}, ${alphaNum})`
}

export function getThemeStyle(theme: FormTheme): string {
  return `
  html {
    --heyform-font-family: ${theme.fontFamily};
    --heyform-question-color: ${theme.questionTextColor};
    --heyform-description-color: ${alpha(theme.questionTextColor!, 0.7)};
    --heyform-label-color: ${alpha(theme.questionTextColor!, 0.5)};
    --heyform-answer-color: ${theme.answerTextColor};
    --heyform-answer-opacity-80-color: ${alpha(theme.answerTextColor!, 0.8)};
    --heyform-answer-opacity-60-color: ${alpha(theme.answerTextColor!, 0.6)};
    --heyform-answer-opacity-30-color: ${alpha(theme.answerTextColor!, 0.3)};
    --heyform-answer-opacity-10-color: ${alpha(theme.answerTextColor!, 0.1)};
    --heyform-button-color: ${theme.buttonBackground};
    --heyform-button-opacity-80-color: ${alpha(theme.buttonBackground!, 0.8)};
    --heyform-button-text-color: ${theme.buttonTextColor};
    --heyform-button-text-opacity-20-color: ${alpha(theme.buttonTextColor!, 0.2)};
    --heyform-background-color: ${theme.backgroundColor};
    --heyform-group-background-color: ${getAdaptedColor(theme.backgroundColor!)};
  }

  .heyform-theme-background {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2;
    background-size: cover;
    background-position: center;
    pointer-events: none;
    background-color: var(--heyform-background-color);
    ${theme.backgroundImage ? `background-image: url(${theme.backgroundImage});` : ''}
  }

  .heyform-block-group {
    pointer-events: none;
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    padding-left: 5rem;
    padding-right: 5rem;
    background: var(--heyform-group-background-color);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    backdrop-filter: saturate(180%) blur(20px);
    z-index: 12;
  }

  @media (max-width: 800px) {
    .heyform-block-group {
      padding-left: 1.5rem;
      padding-right: 1.5rem;
    }

    .heyform-theme-background,
    .heyform-block-group {
      position: fixed;
    }
  }

  ${
    helper.isValid(theme.backgroundBrightness)
      ? `
    .heyform-theme-background:before {
      pointer-events: none;
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      content: "";
      z-index: 2;
      opacity: ${Math.abs(theme.backgroundBrightness! / 100)};
      background: ${theme.backgroundBrightness! > 0 ? '#fff' : '#000'};
    }`
      : ''
  }
  `
}

const DEFAULT_FONTS =
  'Public Sans, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji'

export function getStripeElementStyle(theme: FormTheme) {
  return {
    base: {
      color: theme.answerTextColor,
      fontFamily: [theme.fontFamily, DEFAULT_FONTS].filter(Boolean).join(','),
      fontSize: '24px',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: alpha(theme.answerTextColor!, 0.3)
      }
    },
    invalid: {
      color: '#dc2626'
    }
  }
}
