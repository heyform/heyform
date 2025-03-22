import { helper } from '@heyform-inc/utils'
import { IconArrowUpRight } from '@tabler/icons-react'
import { useRequest } from 'ahooks'
import { Trans, useTranslation } from 'react-i18next'

import { Form, Input, PlanUpgrade, Switch } from '@/components'
import { PlanGradeEnum } from '@/consts'
import { WorkspaceService } from '@/services'
import { useAppStore, useWorkspaceStore } from '@/store'
import { useParam } from '@/utils'

export default function WorkspaceCustomDomain() {
  const { t } = useTranslation()

  const { workspaceId } = useParam()

  const { openModal } = useAppStore()
  const { workspace, updateWorkspace } = useWorkspaceStore()

  const { run } = useRequest(
    async (enableCustomDomain: boolean) => {
      const updates = {
        enableCustomDomain
      }

      updateWorkspace(workspaceId, updates)
      await WorkspaceService.update(workspaceId, updates)
    },
    {
      manual: true,
      refreshDeps: [workspaceId]
    }
  )

  async function handleFinish(values: AnyMap) {
    openModal('CustomDomainModal', values)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-8">
        <div className="flex-1">
          <label className="text-base/7 font-medium sm:text-sm/5">
            {t('settings.customDomain.headline')}
          </label>
          <p data-slot="text" className="text-base/5 text-secondary sm:text-sm/5">
            <Trans
              t={t}
              i18nKey="settings.customDomain.subHeadline"
              components={{
                a: (
                  <a
                    key="a"
                    className="underline underline-offset-4 hover:text-primary"
                    href="https://docs.heyform.net/custom-domain"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
                icon: <IconArrowUpRight key="icon" className="inline h-4 w-4" stroke={1.5} />
              }}
            />
          </p>
        </div>

        <div className="pt-2">
          <PlanUpgrade
            minimalGrade={PlanGradeEnum.PREMIUM}
            tooltipLabel={t('billing.upgrade.customDomain')}
          >
            <Switch value={workspace?.enableCustomDomain} onChange={run} />
          </PlanUpgrade>
        </div>
      </div>

      <PlanUpgrade minimalGrade={PlanGradeEnum.PREMIUM} isUpgradeShow={false}>
        {workspace?.enableCustomDomain && (
          <Form.Simple
            className="flex items-start gap-x-2.5 [&_[data-slot=control]]:space-y-0 [&_[data-slot=item]]:flex-1"
            initialValues={{
              domain: workspace?.customDomain
            }}
            submitProps={{
              label: t('components.continue'),
              className: 'min-w-[6rem]'
            }}
            submitOnChangedOnly
            onFinish={handleFinish}
          >
            <Form.Item
              name="domain"
              rules={[
                {
                  validator: async (rule, value) => {
                    if (!helper.isFQDN(value)) {
                      throw new Error(rule.message as string)
                    }
                  },
                  message: t('settings.customDomain.invalid')
                }
              ]}
            >
              <Input
                value={workspace?.customDomain}
                placeholder={t('settings.customDomain.placeholder')}
                autoComplete="off"
              />
            </Form.Item>
          </Form.Simple>
        )}
      </PlanUpgrade>
    </div>
  )
}
