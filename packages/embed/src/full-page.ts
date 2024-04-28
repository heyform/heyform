import { Dom } from '@/utils'

import IconLoading from './assets/icon-loading.svg'
import { Standard } from './standard'
import { FullPageSettings } from './type'

const FULLPAGE_TEMPLATE = `
<div class="heyform__iframe-container">
  <iframe src="{src}" allow="microphone; camera"></iframe>
  <div class="heyform__loading-container">${IconLoading}</div>
</div>
`

export class FullPage extends Standard<FullPageSettings> {
  override render() {
    this.$container
      .style({
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: '9999'
      })
      .append(
        Dom.compile(FULLPAGE_TEMPLATE, {
          src: this.formUrl
        })
      )
  }
}
