import { CaptchaKindEnum, FormModel } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { FC, useEffect, useRef } from 'react'

import { GOOGLE_RECAPTCHA_KEY } from '@/consts'
import { getTheme, getThemeStyle, getWebFontURL } from '@/pages/form/views/FormComponents'

import { isStripeEnabled } from './utils/payment'

const ScriptElement: FC<{ html: string }> = ({ html }) => {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref.current) {
      return
    }

    const range = document.createRange()
    const documentFragment = range.createContextualFragment(html)

    range.selectNode(ref.current)

    ref.current.innerHTML = ''
    ref.current.append(documentFragment)
  }, [])

  return <div ref={ref} />
}

const GoogleAnalytics: FC<{ trackCode: string }> = ({ trackCode }) => {
  return (
    <>
      <ScriptElement
        html={`<script src="https://www.googletagmanager.com/gtag/js?id=${trackCode}" />`}
      />
      <ScriptElement
        html={`
					<script>
						window.dataLayer = window.dataLayer || [];
						function gtag(){dataLayer.push(arguments);}
						gtag('js', new Date());
						gtag('config', '${trackCode}');
					</script>
				`}
      />
    </>
  )
}

const FacebookPixel: FC<{ trackCode: string }> = ({ trackCode }) => {
  return (
    <ScriptElement
      html={`
				<script>
					!function (f, b, e, v, n, t, s) {
							if (f.fbq) return; n = f.fbq = function () {
									n.callMethod ?
									n.callMethod.apply(n, arguments) : n.queue.push(arguments)
							};
							if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
							n.queue = []; t = b.createElement(e); t.async = !0;
							t.src = v; s = b.getElementsByTagName(e)[0];
							s.parentNode.insertBefore(t, s)
					}(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

					fbq('init', '${trackCode}');
					fbq('track', 'PageView');
				</script>
			`}
    />
  )
}

export const CustomCode = ({ form, query }: { form: FormModel; query: Record<string, any> }) => {
  const { integrations } = form
  const theme = getTheme(form.themeSettings?.theme)
  const fontURL = getWebFontURL(theme.fontFamily)

  useEffect(() => {
    document.title = form.name ? `${form.name} - HeyForm` : 'HeyForm'
  }, [form.name])

  return (
    <>
      <link href={fontURL} rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: getThemeStyle(theme, query) }} />
      {helper.isValid(form.themeSettings?.theme?.customCSS) && (
        <style dangerouslySetInnerHTML={{ __html: form.themeSettings!.theme!.customCSS! }} />
      )}

      {form.settings!.captchaKind === CaptchaKindEnum.GOOGLE_RECAPTCHA && (
        <script src={`https://www.google.com/recaptcha/api.js?render=${GOOGLE_RECAPTCHA_KEY}`} />
      )}
      {form.settings!.captchaKind === CaptchaKindEnum.GEETEST_CAPTCHA && (
        <script src="https://static.geetest.com/v4/gt4.js" />
      )}

      {isStripeEnabled(form) && <script id="stripe" src="https://js.stripe.com/v3/" />}

      {helper.isValid(integrations.googleanalytics) && (
        <GoogleAnalytics trackCode={integrations.googleanalytics} />
      )}
      {helper.isValid(integrations.facebookpixel) && (
        <FacebookPixel trackCode={integrations.facebookpixel} />
      )}
    </>
  )
}
