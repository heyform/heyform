import { useTranslation } from 'react-i18next'

import IconWavingHand from '@/assets/waving-hand.webp'
import { useUserStore } from '@/store'
import { getTimePeriod } from '@/utils'

import Overview from './Overview'
import RecentForms from './RecentForms'

export default function WorkspaceDashboard() {
  const { t } = useTranslation()

  const { user } = useUserStore()

  return (
    <>
      <h1 className="flex items-center gap-2 text-2xl/8 font-semibold sm:text-xl/8">
        <img className="-mt-2 h-9 w-9 sm:h-8 sm:w-8" src={IconWavingHand} />
        {t(`dashboard.${getTimePeriod()}`, { name: user.name })}
      </h1>

      {/* Overview */}
      <section className="mt-8">
        <div className="flex items-end justify-between">
          <h2 className="text-base/6 font-semibold">{t('dashboard.overview')}</h2>
        </div>
        <Overview />
      </section>

      {/* Recent forms */}
      <section className="mt-14">
        <h2 className="text-base/6 font-semibold">{t('dashboard.recentForms')}</h2>
        <RecentForms />
      </section>
    </>
  )
}
