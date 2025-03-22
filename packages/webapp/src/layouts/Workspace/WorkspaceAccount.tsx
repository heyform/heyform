import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { IconCheck, IconChevronRight } from '@tabler/icons-react'
import { useLocalStorageState } from 'ahooks'
import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar, Button } from '@/components'
import {
  APPEARANCE_OPTIONS,
  APPEARANCE_STORAGE_KEY,
  LOCALE_OPTIONS,
  PACKAGE_VERSION
} from '@/consts'
import { useAppStore, useUserStore } from '@/store'
import { clearAuthState, cn, useRouter } from '@/utils'

interface WorkspaceAccountProps extends ComponentProps {
  containerClassName?: string
  isNameVisible?: boolean
}

export default function WorkspaceAccount({
  className,
  containerClassName,
  isNameVisible = true
}: WorkspaceAccountProps) {
  const { t, i18n } = useTranslation()

  const router = useRouter()
  const { user } = useUserStore()
  const { openModal } = useAppStore()

  const [appearance, setAppearance] = useLocalStorageState(APPEARANCE_STORAGE_KEY, {
    defaultValue: 'system',
    listenStorageChange: true
  })

  function handleLogout() {
    clearAuthState()
    router.redirect('/logout', {
      extend: false
    })
  }

  const handleChange = useCallback(
    ({ matches }: any) => {
      let value = appearance

      if (appearance === 'system') {
        value = matches ? 'dark' : 'light'
      }

      if (value === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
    [appearance]
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [handleChange])

  useEffect(() => {
    handleChange({
      matches: appearance === 'dark' || window.matchMedia('(prefers-color-scheme: dark)').matches
    })
  }, [appearance])

  return (
    <div className={cn('border-t border-accent-light px-2.5 py-2.5 sm:py-2.5', containerClassName)}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button.Link
            className={cn(
              'h-auto w-full px-3 py-2.5 sm:h-auto sm:px-2 sm:py-1.5 [&_[data-slot=button]]:justify-start [&_[data-slot=button]]:gap-x-3.5',
              className
            )}
          >
            <Avatar
              className="h-8 w-8"
              src={user?.avatar}
              fallback={user?.name}
              data-slot="avatar"
              resize={{ width: 100, height: 100 }}
            />
            {isNameVisible && (
              <div className="flex-1 text-left">
                <div className="text-sm">{user?.name}</div>
                <div className="text-xs text-secondary">{t('workspace.sidebar.viewProfile')}</div>
              </div>
            )}
          </Button.Link>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="isolate z-10 min-w-80 rounded-xl bg-foreground p-1.5 shadow-lg outline outline-1 outline-transparent ring-1 ring-accent-light focus:outline-none lg:min-w-64"
            align="start"
            sideOffset={8}
          >
            <DropdownMenu.Item className="focus-visible:outline-none">
              <Button.Link
                className="w-full data-[highlighted]:bg-accent-light [&_[data-slot=button]]:justify-start"
                size="md"
                onClick={() => openModal('UserAccountModal')}
              >
                {t('workspace.sidebar.accountSettings')}
              </Button.Link>
            </DropdownMenu.Item>

            {/* Locale switcher */}
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger asChild>
                <Button.Link
                  className="hidden w-full data-[highlighted]:bg-accent-light data-[state=open]:bg-accent-light sm:block [&_[data-slot=button]]:justify-between"
                  size="md"
                >
                  {t('workspace.sidebar.language')}
                  <IconChevronRight className="h-[1.125rem] w-[1.125rem] text-secondary" />
                </Button.Link>
              </DropdownMenu.SubTrigger>

              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className="isolate z-10 min-w-80 rounded-xl bg-foreground p-1.5 shadow-lg outline outline-1 outline-transparent ring-1 ring-accent-light focus:outline-none lg:min-w-64"
                  sideOffset={8}
                  alignOffset={-8}
                >
                  {LOCALE_OPTIONS.map(l => (
                    <DropdownMenu.Item
                      key={l.value}
                      className="grid cursor-pointer grid-cols-[theme(spacing.5),1fr] items-center gap-x-2.5 rounded-lg px-3 py-2.5 text-base/6 text-primary outline-none focus-visible:outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-accent-light data-[disabled]:opacity-50 sm:grid-cols-[theme(spacing.4),1fr] sm:px-2 sm:py-1.5 sm:text-sm/6"
                      onClick={() => i18n.changeLanguage(l.value)}
                    >
                      {i18n.language === l.value ? (
                        <IconCheck className="h-[1.125rem] w-[1.125rem] text-secondary" />
                      ) : (
                        <i />
                      )}

                      <div>
                        <div
                          className="text-sm/[1.4rem] font-medium text-primary"
                          data-slot="label"
                        >
                          {t(l.label)}
                        </div>
                        <div className="text-xs text-secondary" data-slot="translated">
                          {t(l.translated)}
                        </div>
                      </div>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>

            {/* Appearance switcher */}
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger asChild>
                <Button.Link
                  className="hidden w-full data-[highlighted]:bg-accent-light data-[state=open]:bg-accent-light sm:block [&_[data-slot=button]]:justify-between"
                  size="md"
                >
                  {t('workspace.appearance.title')}
                  <IconChevronRight className="h-[1.125rem] w-[1.125rem] text-secondary" />
                </Button.Link>
              </DropdownMenu.SubTrigger>

              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className="isolate z-10 min-w-80 rounded-xl bg-foreground p-1.5 shadow-lg outline outline-1 outline-transparent ring-1 ring-accent-light focus:outline-none lg:min-w-64"
                  sideOffset={8}
                  alignOffset={-8}
                >
                  {APPEARANCE_OPTIONS.map(l => (
                    <DropdownMenu.Item
                      key={l.value}
                      className="grid cursor-pointer grid-cols-[theme(spacing.5),1fr] items-center gap-x-2.5 rounded-lg px-3 py-2.5 text-base/6 text-primary outline-none focus-visible:outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-accent-light data-[disabled]:opacity-50 sm:grid-cols-[theme(spacing.4),1fr] sm:px-2 sm:py-1.5 sm:text-sm/6"
                      onClick={() => setAppearance(l.value)}
                    >
                      {appearance === l.value ? (
                        <IconCheck className="h-[1.125rem] w-[1.125rem] text-secondary" />
                      ) : (
                        <i />
                      )}

                      <div className="text-sm/[1.4rem] font-medium text-primary" data-slot="label">
                        {t(l.label)}
                      </div>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>

            <DropdownMenu.Item className="focus-visible:outline-none" onClick={handleLogout}>
              <Button.Link className="w-full data-[highlighted]:bg-accent-light [&_[data-slot=button]]:justify-start">
                {t('workspace.sidebar.logout')}
              </Button.Link>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="mx-2 mb-1 mt-2 h-px bg-accent-light sm:mx-2" />

            <DropdownMenu.Item className="focus-visible:outline-none">
              <div className="px-3 py-2.5 text-sm/6 text-secondary sm:px-2 sm:py-2">
                {t('workspace.sidebar.version', { version: PACKAGE_VERSION })}
              </div>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}
