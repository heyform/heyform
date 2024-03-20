import { observer } from 'mobx-react-lite'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar, Dropdown, Menus } from '@/components/ui'
import { useStore } from '@/store'
import { clearAuthState } from '@/utils'

export const UserAccount: FC = observer(() => {
  const userStore = useStore('userStore')
  const appStore = useStore('appStore')
  const { t } = useTranslation()

  function handleMenuClick(name?: IKeyType) {
    switch (name) {
      case 'accountSettings':
        appStore.isUserSettingsOpen = true
        break

      case 'logout':
        clearAuthState()
        window.location.href = '/login'
        break
    }
  }

  const Overlay = (
    <Menus className="bottom-12" onClick={handleMenuClick}>
      <Menus.Item value="accountSettings" label={t('other.labelList.Account')} />
      <Menus.Item value="logout" label={t('other.labelList.Logout')} />
      <Menus.Divider />
      <Menus.Item
        className="cursor-default text-slate-400 hover:bg-transparent"
        label={`${t('other.labelList.Version')} ${import.meta.env.PACKAGE_VERSION}`}
      />
    </Menus>
  )

  return (
    <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
      <Dropdown
        className="group block w-full flex-shrink-0"
        placement="top-start"
        overlay={Overlay}
      >
        <div className="flex cursor-pointer items-center">
          <div>
            <Avatar
              className="inline-block h-8 w-8"
              src={userStore.user.avatar}
              size={80}
              circular
              rounded
            />
          </div>
          <div className="ml-3">
            <p className="truncate text-sm font-medium text-slate-700 group-hover:text-slate-900">
              {userStore.user.name}
            </p>
            <p className="text-sm text-slate-500 group-hover:text-slate-700">
              {t('other.labelList.View')}
            </p>
          </div>
        </div>
      </Dropdown>
    </div>
  )
})
