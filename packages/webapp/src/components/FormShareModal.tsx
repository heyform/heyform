import { random } from '@heyform-inc/utils'
import {
  IconBrandFacebook,
  IconBrandLinkedin,
  IconBrandX,
  IconMail,
  IconX
} from '@tabler/icons-react'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'

import { Button, Modal, Switch, notification } from '@/components/ui'
import { HOMEPAGE_URL } from '@/consts'
import { FormService } from '@/service'
import { useStore } from '@/store'
import { urlBuilder } from '@/utils'

import { CopyButton } from './CopyButton'

function getShareURL(formId?: string) {
  return HOMEPAGE_URL + `/form/${formId}`
}

export const FormShareModal = observer(() => {
  const [loading, setLoading] = useState(false)
  const [loading2, setLoading2] = useState(false)
  const formStore = useStore('formStore')
  const appStore = useStore('appStore')

  const sharingLinkUrl = getShareURL(formStore.current?.id)

  async function handleChange(requirePassword: boolean) {
    if (loading) {
      return
    }

    setLoading(true)

    await handleUpdate({
      requirePassword
    })

    setLoading(false)
  }

  async function handleClick() {
    if (loading2) {
      return
    }

    setLoading2(true)

    const password = random(4)
    await handleUpdate({
      password
    })

    setLoading2(false)
  }

  async function handleUpdate(updates: IMapType) {
    try {
      await FormService.update(formStore.current!.id, updates)
      formStore.updateSettings(updates)
    } catch (err: any) {
      notification.error({
        title: 'Failed to update form settings'
      })
    }
  }

  function handleClose() {
    appStore.isFormShareModalOpen = false
  }

  function handleEmail() {
    const url = urlBuilder('mailto:', {
      subject: 'Cold you take a moment to fill in this heyform?',
      body: `We would really appreciate it if you filled in this form: ${sharingLinkUrl}. Thank you.`
    })
    window.open(url)
  }

  function handleFacebook() {
    const url = urlBuilder('https://www.facebook.com/sharer/sharer.php', {
      u: sharingLinkUrl
    })
    window.open(url)
  }

  function handleLinkedin() {
    const url = urlBuilder('https://www.linkedin.com/sharing/share-offsite', {
      url: sharingLinkUrl
    })
    window.open(url)
  }

  function handleTwitter() {
    const url = urlBuilder('https://twitter.com/share', {
      url: sharingLinkUrl,
      title: formStore.current!.name
    })
    window.open(url)
  }

  return (
    <Modal
      className="share-modal"
      contentClassName="max-w-md md:max-w-lg"
      visible={appStore.isFormShareModalOpen}
      onClose={handleClose}
    >
      <div className="space-y-6 text-sm text-slate-700">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-medium leading-6 text-slate-900">Share this form</h1>

          <button onClick={handleClose}>
            <IconX className="text-slate-700 hover:text-slate-900" />
          </button>
        </div>

        <div>
          <div className="mb-1 font-medium">Share on social networks</div>
          <div className="flex items-center gap-2">
            <Button.Link
              leading={<IconBrandX className="text-slate-900" />}
              onClick={handleTwitter}
            />
            <Button.Link
              leading={<IconBrandFacebook className="text-slate-900" />}
              onClick={handleFacebook}
            />
            <Button.Link
              leading={<IconBrandLinkedin className="text-slate-900" />}
              onClick={handleLinkedin}
            />
            <Button.Link leading={<IconMail className="text-slate-900" />} onClick={handleEmail} />
          </div>
        </div>

        <div>
          <div className="mb-1 font-medium">URL link</div>
          <div className="relative">
            <div className="h-10 rounded-lg border border-slate-200 px-3 leading-10">
              {sharingLinkUrl}
            </div>
            <CopyButton className="!absolute right-2 top-1.5 !p-1" text={sharingLinkUrl} />
          </div>

          <div className="mb-2 mt-6 flex items-center">
            <div className="flex-1 font-medium">Password protection</div>
            <Switch
              value={formStore.current?.settings?.requirePassword}
              loading={loading}
              disabled={loading}
              onChange={handleChange}
            />
          </div>
          <div className="flex gap-x-2">
            <div className="relative flex-1">
              <div className="h-10 rounded-lg border border-slate-200 px-3 leading-10">
                {formStore.current?.settings?.password}
              </div>
              <CopyButton
                className="!absolute right-2 top-1.5 !p-1"
                text={formStore.current?.settings?.password || ''}
              />
            </div>
            <Button type="primary" loading={loading2} onClick={handleClick}>
              Generate
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
})
