import * as Tabs from '@radix-ui/react-tabs'
import { useRequest } from 'ahooks'
import { useTranslation } from 'react-i18next'

import { UserService } from '@/services'

import { Button, ImageFormPicker, Input, Modal, usePrompt } from '@/components'
import { OIDC_DISPLAY_NAME } from '@/consts'
import { useAppStore, useModal, useUserStore } from '@/store'

import AccountApiAccess from './AccountApiAccess'

const UserAccount = () => {
  const { t } = useTranslation()

  const prompt = usePrompt()
  const { openModal } = useAppStore()
  const { user, updateUser } = useUserStore()

  const { run: handleNameChange } = useRequest(
    async (name: string) => {
      const updates = {
        name
      }

      updateUser(updates)
      await UserService.update(updates)
    },
    {
      debounceWait: 300,
      manual: true
    }
  )

  const { run: handleAvatarChange } = useRequest(
    async (avatar?: string) => {
      const updates = {
        avatar
      }

      updateUser(updates)
      await UserService.update(updates)
    },
    {
      manual: true
    }
  )

  function handleSendCode() {
    prompt({
      title: t('user.email.headline'),
      inputProps: {
        name: 'email',
        label: t('user.email.label'),
        rules: [
          {
            type: 'email',
            required: true,
            message: t('user.email.invalid')
          }
        ]
      },
      submitProps: {
        className: '!mt-4 px-5 min-w-24',
        size: 'md',
        label: t('components.change')
      },
      fetch: async values => {
        await UserService.changeEmailCode(values.email)
        handleVerifyEmail(values.email)
      }
    })
  }

  function handleVerifyEmail(email: string) {
    prompt({
      title: t('verifyEmail.title'),
      inputProps: {
        name: 'code',
        label: t('verifyEmail.subHeadline', { email }),
        rules: [
          {
            required: true,
            message: t('user.email.code.requried')
          }
        ]
      },
      submitProps: {
        className: '!mt-4 px-5 min-w-24',
        size: 'md',
        label: t('user.email.button')
      },
      onChange: values => {
        handleConfirmEmail(email, values.code)
      }
    })
  }

  function handleConfirmEmail(email: string, code: string) {
    prompt({
      title: t('user.email.headline'),
      inputProps: {
        name: 'currentPassword',
        type: 'password',
        label: t('login.password.label'),
        rules: [
          {
            required: true,
            message: t('login.password.required')
          },
          {
            max: 100,
            message: t('login.password.maxLength')
          }
        ]
      },
      submitProps: {
        className: '!mt-4 px-5 min-w-24',
        size: 'md',
        label: t('components.change')
      },
      fetch: async values => {
        await UserService.updateEmail(email, code, values.currentPassword)
        updateUser({ email })
      }
    })
  }

  return (
    <div className="mt-4 space-y-6">
      <section className="border-accent-light border-b pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
          <div className="md:max-w-sm">
            <h3 className="text-sm font-medium leading-6">{t('user.avatar.headline')}</h3>
          </div>
          <div className="md:w-80">
            <p data-slot="text" className="text-secondary text-sm/5 sm:text-xs/5">
              {t('user.avatar.subHeadline')}
            </p>
            <ImageFormPicker
              className="mt-4"
              value={user?.avatar}
              fallback={user?.name}
              onChange={handleAvatarChange}
            />
          </div>
        </div>
      </section>

      <section className="border-accent-light border-b pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
          <div className="md:max-w-sm">
            <h3 className="text-sm font-medium leading-6">{t('user.name')}</h3>
          </div>
          <div className="md:w-80">
            {user?.isNameManaged ? (
              <div className="space-y-1">
                <div className="text-sm/6">{user?.name}</div>
                <p className="text-secondary text-sm/5 sm:text-xs/5">
                  {t('user.managedBy', { provider: OIDC_DISPLAY_NAME })}
                </p>
              </div>
            ) : (
              <Input id="name" value={user?.name} onChange={handleNameChange} />
            )}
          </div>
        </div>
      </section>

      <section className="border-accent-light border-b pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
          <div className="md:max-w-sm">
            <h3 className="text-sm font-medium leading-6">{t('user.email.headline')}</h3>
          </div>
          <div className="space-y-3 md:w-80">
            <div className="text-sm/6">{user?.email}</div>

            {!user.isSocialAccount && (
              <Button.Ghost size="sm" onClick={handleSendCode}>
                {t('user.email.button')}
              </Button.Ghost>
            )}
          </div>
        </div>
      </section>

      <section className="border-accent-light border-b pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
          <div className="md:max-w-sm">
            <h3 className="text-sm font-medium leading-6">{t('user.password.headline')}</h3>
          </div>
          <div className="md:w-80">
            <Button.Ghost
              className="w-full sm:w-auto"
              size="sm"
              onClick={() => openModal('ChangePasswordModal')}
            >
              {t('user.password.button')}
            </Button.Ghost>
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
          <div className="md:max-w-sm">
            <h3 className="text-sm font-medium leading-6">{t('user.deletion.headline')}</h3>
          </div>
          <div className="md:w-80">
            <p className="text-secondary text-base/5 sm:text-sm/5">
              {t('user.deletion.subHeadline')}
            </p>
            <Button.Ghost
              size="md"
              className="border-error/40 bg-error/10 text-error hover:bg-error/15 mt-4 border"
              onClick={() => openModal('UserDeletionModal')}
            >
              {t('user.deletion.button')}
            </Button.Ghost>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function UserAccountModal() {
  const { t } = useTranslation()
  const { isOpen, onOpenChange } = useModal('UserAccountModal')

  return (
    <Modal.Simple
      open={isOpen}
      title={t('user.headline')}
      contentProps={{ className: 'sm:max-w-[min(48rem,calc(100vw-2rem))]' }}
      onOpenChange={onOpenChange}
    >
      <Tabs.Root
        defaultValue="account"
        orientation="vertical"
        className="flex flex-col gap-4 sm:flex-row"
      >
        <Tabs.List
          aria-label={String(t('user.headline'))}
          className="border-accent-light flex gap-1 border-b pb-2 sm:w-36 sm:shrink-0 sm:flex-col sm:border-b-0 sm:pb-0"
        >
          {[
            { value: 'account', label: String(t('apiAccess.account')) },
            { value: 'api-keys', label: String(t('apiAccess.keys')) }
          ].map(({ value, label }) => (
            <Tabs.Trigger key={value} value={value} className="hf-anchor-item">
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <div className="relative min-w-0 flex-1">
          {/* Account stays in flow so both panels share its height. */}
          <Tabs.Content value="account" forceMount className="data-[state=inactive]:invisible">
            <h3 className="flex min-h-9 items-center text-base font-semibold">
              {String(t('apiAccess.account'))}
            </h3>
            <p className="text-secondary text-sm">{String(t('user.subHeadline'))}</p>
            <UserAccount />
          </Tabs.Content>
          {/* Stays mounted so a new key's one-time secret survives tab switches. */}
          <Tabs.Content
            value="api-keys"
            forceMount
            className="scrollbar absolute inset-0 overflow-y-auto data-[state=inactive]:hidden"
          >
            <AccountApiAccess />
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </Modal.Simple>
  )
}
