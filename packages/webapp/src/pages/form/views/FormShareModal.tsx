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
import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'

import { CopyButton } from '@/components'
import { Button, Modal, Switch, Tooltip, notification } from '@/components'
import { HOMEPAGE_URL } from '@/consts'
import { FormService } from '@/services'
import { useStore } from '@/store'
import { urlBuilder, useParam } from '@/utils'

import { FORM_EMBED_OPTIONS } from './FormEmbedModal'

function getShareURL(formId?: string) {
  return HOMEPAGE_URL + `/form/${formId}`
}

export const FormShareModal = observer(() => {
  const { workspaceId, projectId, formId } = useParam()
  const formStore = useStore('formStore')
  const appStore = useStore('appStore')

  const sharingLinkUrl = getShareURL(formStore.current?.id)
  const { t } = useTranslation()

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

  function openEmbedModal(type: string) {
    appStore.isFormShareModalOpen = false
    formStore.embedType = type
  }

  return (
    <Modal
      className="share-modal"
      contentClassName="max-w-md md:max-w-lg"
      visible={appStore.isFormShareModalOpen}
      onClose={handleClose}
    >
      <div className="space-y-6 text-sm text-slate-900">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold leading-6 text-slate-900">{t('share.title')}</h1>

          <button onClick={handleClose}>
            <IconX className="text-slate-700 hover:text-slate-900" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip ariaLabel="Share on X">
            <div>
              <Button.Link
                leading={<IconBrandX className="text-slate-900" />}
                onClick={handleTwitter}
              />
            </div>
          </Tooltip>

          <Tooltip ariaLabel="Share on Facebook">
            <div>
              <Button.Link
                leading={<IconBrandFacebook className="text-slate-900" />}
                onClick={handleFacebook}
              />
            </div>
          </Tooltip>

          <Tooltip ariaLabel="Share on LinkedIn">
            <div>
              <Button.Link
                leading={<IconBrandLinkedin className="text-slate-900" />}
                onClick={handleLinkedin}
              />
            </div>
          </Tooltip>

          <Tooltip ariaLabel="Share via Email">
            <div>
              <Button.Link
                leading={<IconMail className="text-slate-900" />}
                onClick={handleEmail}
              />
            </div>
          </Tooltip>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">{t('share.shareLink')}</span>
            <div className="flex items-center gap-1">
              <NavLink
                to={`/workspace/${workspaceId}/project/${projectId}/form/${formId}/settings#form-settings-protection`}
              >
                {t('share.passwordProtection')}
              </NavLink>
            </div>
          </div>
          <div className="relative">
            <div className="h-10 rounded-lg border border-slate-200 px-3 leading-10">
              {sharingLinkUrl}
            </div>
            <CopyButton className="!absolute right-2 top-1.5 !p-1" text={sharingLinkUrl} />
          </div>
        </div>

        <div>
          <div className="mb-1 text-sm font-medium">{t('share.embedForm')}</div>
          <div className="mb-4 text-sm text-slate-600">{t('share.embedOptionsText')}</div>

          <div className="grid grid-cols-4 gap-5">
            {FORM_EMBED_OPTIONS.map((row, key) => (
              <div className="cursor-pointer" onClick={() => openEmbedModal(row.type)} key={key}>
                <div className="rounded-md border border-black/10">
                  <row.icon className="w-full rounded-md" />
                </div>
                <div className="mt-1.5 text-center text-sm text-slate-600">
                  {t(`share.${row.type}`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
})
