import { useRequest } from 'ahooks'
import { useTranslation } from 'react-i18next'

import { Button, ImageFormPicker, Input, Modal, usePrompt } from '@/components'
import { UserService } from '@/services'
import { useAppStore, useModal, useUserStore } from '@/store'

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
      fetch: async values => {
        await UserService.updateEmail(email, values.code)
        updateUser({ email })
      }
    })
  }

  return (
    <div className="mt-4 space-y-8">
      <div className="space-y-2">
        <div className="space-y-1">
          <div className="block text-sm font-medium leading-6 text-gray-900">
            {t('user.avatar.headline')}
          </div>
          <p data-slot="text" className="text-base/5 text-secondary sm:text-sm/5">
            {t('user.avatar.subHeadline')}
          </p>
        </div>
        <ImageFormPicker value={user?.avatar} fallback={user?.name} onChange={handleAvatarChange} />
      </div>

      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm/6 font-medium leading-6 text-primary">
          {t('user.name')}
        </label>
        <Input id="name" value={user?.name} onChange={handleNameChange} />
      </div>

      <div className="space-y-1">
        <div className="text-base/7 font-medium sm:text-sm/5">{t('user.email.headline')}</div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="text-sm/6">{user?.email}</span>

          {!user.isSocialAccount && (
            <Button.Ghost size="sm" onClick={handleSendCode}>
              {t('user.email.button')}
            </Button.Ghost>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-base/7 font-medium sm:text-sm/5">{t('user.password.headline')}</div>
        <Button.Ghost
          className="w-full sm:w-auto"
          size="sm"
          onClick={() => openModal('ChangePasswordModal')}
        >
          {t('user.password.button')}
        </Button.Ghost>
      </div>

      <div>
        <div className="text-base/7 font-medium sm:text-sm/5">{t('user.deletion.headline')}</div>
        <p className="mt-1 text-base/5 text-secondary sm:text-sm/5">
          {t('user.deletion.subHeadline')}
        </p>
        <div className="mt-3">
          <Button.Ghost
            size="md"
            className="bg-error text-primary-light hover:bg-error/70 dark:text-primary"
            onClick={() => openModal('UserDeletionModal')}
          >
            {t('user.deletion.button')}
          </Button.Ghost>
        </div>
      </div>
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
      description={t('user.subHeadline')}
      onOpenChange={onOpenChange}
    >
      <UserAccount />
    </Modal.Simple>
  )
}
