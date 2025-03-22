import { IconArrowUpRight, IconDots } from '@tabler/icons-react'
import { FC, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import IconLogo from '@/assets/logo.svg?react'
import { Image, Modal } from '@/components'
import { useModal } from '@/store'
import { IntegratedAppType } from '@/types'

import AirtableSettings from './AirtableSettings'
import DropboxSettings from './DropboxSettings'
import EmailSettings from './EmailSettings'
import FacebookPixelSettings from './FacebookPixelSettings'
import GoogleAnalyticsSettings from './GoogleAnalyticsSettings'
import GoogleDriveSettings from './GoogleDriveSettings'
import GoogleSheetsSettings from './GoogleSheetsSettings'
import HubSpotSettings from './HubSpotSettings'
import LarkSettings from './LarkSettings'
import LegacySlackSettings from './LegacySlackSettings'
import MailChimpSettings from './MailChimpSettings'
import MondaySettings from './MondaySettings'
import NotionSettings from './NotionSettings'
import OsticketSettings from './OsticketSettings'
import SlackSettings from './SlackSettings'
import SupportPalSettings from './SupportPalSettings'
import TelegramSettings from './TelegramSettings'
import WebhookSettings from './WebhookSettings'

const Settings: FC<{ app: IntegratedAppType }> = ({ app }) => {
  const { t } = useTranslation()

  const children = useMemo(() => {
    switch (app.uniqueId) {
      case 'airtable':
        return <AirtableSettings app={app} />

      case 'dropbox':
        return <DropboxSettings app={app} />

      case 'email':
        return <EmailSettings app={app} />

      case 'facebookpixel':
        return <FacebookPixelSettings app={app} />

      case 'googleanalytics':
        return <GoogleAnalyticsSettings app={app} />

      case 'googledrive':
        return <GoogleDriveSettings app={app} />

      case 'googlesheets':
        return <GoogleSheetsSettings app={app} />

      case 'hubspot':
        return <HubSpotSettings app={app} />

      case 'legacyslack':
        return <LegacySlackSettings app={app} />

      case 'slack':
        return <SlackSettings app={app} />

      case 'lark':
        return <LarkSettings app={app} />

      case 'mailchimp':
        return <MailChimpSettings app={app} />

      case 'monday':
        return <MondaySettings app={app} />

      case 'osticket':
        return <OsticketSettings app={app} />

      case 'supportpal':
        return <SupportPalSettings app={app} />

      case 'telegram':
        return <TelegramSettings app={app} />

      case 'webhook':
        return <WebhookSettings app={app} />

      case 'notion':
        return <NotionSettings app={app} />
    }
  }, [app])

  return (
    <div>
      <div className="pt-6">
        <div className="flex items-center justify-center gap-x-4">
          <div className="h-12 w-12 rounded-lg border border-accent-light p-1.5">
            <IconLogo className="h-full w-full" />
          </div>

          <IconDots className="h-6 w-6 text-input" />

          <div className="relative h-12 w-12 p-1 after:absolute after:inset-0 after:rounded-lg after:border after:border-accent-light">
            <Image className="h-full w-full rounded-lg object-cover" src={app.avatar} />
          </div>
        </div>

        <h2 className="mt-6 text-center text-lg/6 font-semibold">
          {t('form.integrations.connectWith', { name: app.name })}
        </h2>
        <p className="mt-2 text-center text-sm text-secondary">
          {app.description}{' '}
          <a
            className="underline hover:text-primary"
            href={app.helpLinkUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Trans
              t={t}
              i18nKey="form.integrations.readMore"
              components={{
                icon: <IconArrowUpRight className="inline h-4 w-4" stroke={1.5} />
              }}
              values={{
                name: app.name
              }}
            />
          </a>
        </p>
      </div>

      <div className="mt-12">{children}</div>
    </div>
  )
}

export default function IntegrationSettingsModal() {
  const { isOpen, payload, onOpenChange } = useModal('IntegrationSettingsModal')

  return (
    <Modal
      open={isOpen}
      contentProps={{
        className: 'max-w-2xl',
        forceMount: true
      }}
      onOpenChange={onOpenChange}
    >
      {payload?.app && <Settings app={payload.app} />}
    </Modal>
  )
}
