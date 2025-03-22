import { IconArrowUpRight } from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import { Trans, useTranslation } from 'react-i18next'

import { Button, Modal, Tooltip } from '@/components'
import { CUSTOM_DOMAIN_ANAME_VALUE, CUSTOM_DOMAIN_CNAME_VALUE } from '@/consts'
import { WorkspaceService } from '@/services'
import { useAppStore, useModal, useWorkspaceStore } from '@/store'
import { getDomainName, isRootDomain, useParam } from '@/utils'

export default function CustomDomainModal() {
  const { t } = useTranslation()

  const { workspaceId } = useParam()
  const { updateWorkspace } = useWorkspaceStore()
  const { closeModal } = useAppStore()
  const { isOpen, payload, onOpenChange } = useModal('CustomDomainModal')

  const { loading, error, run } = useRequest(
    async () => {
      const result = await WorkspaceService.addCustomDomain(workspaceId, payload?.domain as string)

      if (result) {
        updateWorkspace(workspaceId, {
          customDomain: payload?.domain as string
        })
        closeModal('CustomDomainModal')
      } else {
        throw new Error(t('settings.customDomain.dnsError'))
      }
    },
    {
      manual: true,
      refreshDeps: [payload?.domain]
    }
  )

  return (
    <Modal.Simple
      open={isOpen}
      title={t('settings.customDomain.headline')}
      description={
        <div className="space-y-2.5 text-sm text-secondary">
          <p>
            <Trans
              t={t}
              i18nKey="settings.customDomain.tip1"
              components={{
                a: (
                  <a
                    className="underline underline-offset-4 hover:text-primary"
                    href="https://docs.heyform.net/custom-domain"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
                icon: <IconArrowUpRight className="inline h-4 w-4" stroke={1.5} />
              }}
            />
          </p>
          <p>
            <Trans
              t={t}
              i18nKey="settings.customDomain.tip2"
              components={{
                a: (
                  <a
                    className="underline underline-offset-4 hover:text-primary"
                    href="https://dnschecker.org/all-dns-records-of-domain.php"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
                icon: <IconArrowUpRight className="inline h-4 w-4" stroke={1.5} />
              }}
            />
          </p>
        </div>
      }
      contentProps={{
        className: 'max-w-2xl'
      }}
      loading={loading}
      onOpenChange={onOpenChange}
    >
      <table className="mt-6 min-w-full text-left text-sm/6">
        <thead className="text-secondary">
          <tr>
            <th className="border-b border-b-accent-light px-4 py-2 font-medium sm:pl-1">
              {t('settings.customDomain.type')}
            </th>
            <th className="border-b border-b-accent-light px-4 py-2 font-medium">
              {t('settings.customDomain.name')}
            </th>
            <th className="border-b border-b-accent-light px-4 py-2 font-medium">
              {t('settings.customDomain.content')}
            </th>
            <th className="border-b border-b-accent-light px-4 py-2 font-medium">
              {t('settings.customDomain.ttl')}
            </th>
            <th className="border-b border-b-accent-light px-4 py-2 font-medium sm:pr-1">
              {t('settings.customDomain.proxyStatus')}
            </th>
          </tr>
        </thead>
        <tbody className="table-body">
          <tr>
            <td className="border-b border-accent p-4 sm:pl-1">
              {isRootDomain(payload?.domain as string)
                ? t('settings.customDomain.aname')
                : t('settings.customDomain.cname')}
            </td>
            <td className="border-b border-accent p-4">
              {getDomainName(payload?.domain as string)}
            </td>
            <td className="border-b border-accent p-4">
              {isRootDomain(payload?.domain as string)
                ? CUSTOM_DOMAIN_ANAME_VALUE
                : CUSTOM_DOMAIN_CNAME_VALUE}
            </td>
            <td className="border-b border-accent p-4">{t('settings.customDomain.ttlAuto')}</td>
            <td className="border-b border-accent p-4 sm:pr-1">
              <Tooltip
                label={t('settings.customDomain.proxyTip')}
                contentProps={{
                  className: 'max-w-52'
                }}
              >
                <span className="cursor-default underline underline-offset-4">
                  {t('settings.customDomain.dnsOnly')}
                </span>
              </Tooltip>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-4">
        <Button className="min-w-20" size="md" loading={loading} onClick={run}>
          {t('components.save')}
        </Button>
      </div>

      {error && !loading && <div className="text-sm/6 text-error">{error.message}</div>}
    </Modal.Simple>
  )
}
