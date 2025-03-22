import { preventDefault } from '@heyform-inc/form-renderer'
import { Close, Content, Description, Portal, Root, Title, Trigger } from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { IconX } from '@tabler/icons-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import IconAI from '@/assets/ai.svg?react'
import { Button, Tooltip, usePlanGrade } from '@/components'
import { PlanGradeEnum } from '@/consts'

import ChatBar from './ChatBar'
import ChatList from './ChatList'

export default function AIChat() {
  const { t } = useTranslation()

  const { isAllowed, openUpgrade } = usePlanGrade(PlanGradeEnum.BASIC)
  const [open, setOpen] = useState(false)

  function handleOpenChange(isOpen: boolean) {
    isAllowed ? setOpen(isOpen) : openUpgrade()
  }

  return (
    <Root open={open} onOpenChange={handleOpenChange}>
      <Trigger className="fixed bottom-7 right-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-input bg-foreground shadow-lg hover:shadow-xl">
        <Tooltip label={t('form.chat.title')}>
          <div className="flex h-full w-full items-center justify-center">
            <IconAI />
          </div>
        </Tooltip>
      </Trigger>

      <Portal>
        <Content
          onOpenAutoFocus={preventDefault}
          onCloseAutoFocus={preventDefault}
          onPointerDownOutside={preventDefault}
          className="fixed bottom-0 right-0 z-10 max-h-[80vh] w-full max-w-xl rounded-t-lg border border-input bg-foreground pb-[env(safe-area-inset-bottom)] shadow-lg duration-200 focus-visible:outline-0 focus-visible:ring-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-0 data-[state=open]:slide-in-from-bottom-[80%] sm:bottom-20 sm:right-5 sm:h-[40rem] sm:w-[25rem] sm:rounded-b-lg data-[state=closed]:sm:zoom-out-95 data-[state=open]:sm:zoom-in-95"
        >
          <Title>
            <VisuallyHidden />
          </Title>
          <Description>
            <VisuallyHidden />
          </Description>

          <div className="flex h-full w-full flex-col">
            <ChatList />
            <ChatBar />
          </div>

          <Close asChild>
            <Button.Link
              className="absolute right-2 top-2 text-secondary hover:text-primary"
              size="sm"
              iconOnly
              onClick={() => setOpen(false)}
            >
              <span className="sr-only">{t('components.close')}</span>
              <IconX className="h-5 w-5" />
            </Button.Link>
          </Close>
        </Content>
      </Portal>
    </Root>
  )
}
