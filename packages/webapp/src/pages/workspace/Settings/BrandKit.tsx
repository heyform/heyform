import { IconChevronRight } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

import { Button, PlanUpgrade } from '@/components'
import { PlanGradeEnum } from '@/consts'
import { useAppStore } from '@/store'

export default function WorkspaceBrandKit() {
  const { t } = useTranslation()
  const { openModal } = useAppStore()

  return (
    <div className="flex items-start gap-8">
      <div className="flex-1">
        <label className="text-base/7 font-medium sm:text-sm/5">
          {t('settings.branding.brandKitHeadline')}
        </label>
        <p data-slot="text" className="text-base/5 text-secondary sm:text-sm/5">
          {t('settings.branding.brandKitSubHeadline')}
        </p>
      </div>

      <div className="pt-2">
        <PlanUpgrade
          minimalGrade={PlanGradeEnum.PREMIUM}
          tooltipLabel={t('billing.upgrade.brandKit')}
        >
          <Button.Ghost size="sm" onClick={() => openModal('BrandKitModal')}>
            {t('settings.branding.viewBrandKit')}
            <IconChevronRight className="-ml-1 h-4 w-4" />
          </Button.Ghost>
        </PlanUpgrade>
      </div>
    </div>
  )
}
