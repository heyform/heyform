import { nanoid } from '@heyform-inc/utils'
import { IconSend } from '@tabler/icons-react'
import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Input, InputRef } from '@/components'
import { FormService } from '@/services'
import { useFormStore } from '@/store'
import { nextTick, useParam } from '@/utils'

import { useStoreContext } from '../store'
import { useChatStore } from './ChatStore'

export default function ChatBar() {
  const { t, i18n } = useTranslation()

  const { formId } = useParam()
  const { addMessage, updateMessage, status, setStatus } = useChatStore()
  const { dispatch } = useStoreContext()
  const { themeSettings, updateThemeSettings } = useFormStore()

  const inputRef = useRef<InputRef | null>(null)
  const loading = useMemo(() => status === 'loading' || status === 'pending', [status])

  async function handleField(prompt: string) {
    const fields = await FormService.createFieldsWithAI(formId, prompt)

    if (fields) {
      dispatch({
        type: 'setFields',
        payload: {
          fields
        }
      })

      addMessage({
        id: nanoid(12),
        type: 'text',
        content: t('form.chat.fieldsUpdated')
      })

      nextTick(() => {
        dispatch({
          type: 'setActiveTabName',
          payload: {
            activeTabName: 'question'
          }
        })
      })
    }
  }

  async function handleLogic(prompt: string) {
    const logics = await FormService.createLogicsWithAI(formId, prompt)

    if (logics) {
      dispatch({
        type: 'setLogics',
        payload: logics
      })

      addMessage({
        id: nanoid(12),
        type: 'text',
        content: t('form.chat.logicUpdated')
      })

      nextTick(() => {
        dispatch({
          type: 'setActiveTabName',
          payload: {
            activeTabName: 'logic'
          }
        })
      })
    }
  }

  async function handleTheme(prompt: string) {
    const theme = await FormService.createThemesWithAI(
      formId,
      prompt,
      JSON.stringify(themeSettings?.theme)
    )

    if (theme) {
      updateThemeSettings({
        theme
      })

      addMessage({
        id: nanoid(12),
        type: 'text',
        content: t('form.chat.themeUpdated')
      })

      nextTick(() => {
        dispatch({
          type: 'setActiveDesignTabName',
          payload: {
            activeDesignTabName: 'customize'
          }
        })
      })
    }
  }

  async function handleAction(action: string, prompt: string) {
    switch (action) {
      case 'FIELD':
        return handleField(prompt)

      case 'LOGIC':
        return handleLogic(prompt)

      case 'THEME':
        return handleTheme(prompt)
    }
  }

  async function handleEnter(content: string) {
    inputRef.current?.clear()

    addMessage({
      id: nanoid(12),
      type: 'text',
      isUser: true,
      content
    })

    let messageId: string | null = null
    setStatus('loading')

    await FormService.chat(formId, content, i18n.language, {
      onMessage: data => {
        if (data?.message) {
          setStatus('pending')
          if (!messageId) {
            messageId = nanoid(12)

            handleAction(data.action, content)
            addMessage({
              id: messageId,
              type: 'text',
              content: data.message
            })
          } else {
            updateMessage(messageId, {
              content: data.message
            })

            nextTick(() => {
              document.querySelector('.chat-messages')?.scrollTo(0, 10_000)
            })
          }
        }
      },

      onError: error => {
        addMessage({
          id: nanoid(12),
          type: 'notification',
          content: error
        })
      },

      onClose: () => {
        setStatus('idle')
      }
    })
  }

  return (
    <Input
      ref={inputRef}
      className="[&_[data-slot=input]]:h-10 [&_[data-slot=input]]:rounded-none [&_[data-slot=input]]:border-x-0 [&_[data-slot=input]]:border-b-0 [&_[data-slot=input]]:pr-11 [&_[data-slot=input]]:focus:border-input [&_[data-slot=input]]:focus:shadow-none"
      placeholder={t('form.chat.compose')}
      trailing={
        <Button.Link
          size="sm"
          className="-mr-1 text-secondary hover:text-primary"
          loading={loading}
          iconOnly
          onClick={inputRef.current?.submit}
        >
          <IconSend />
        </Button.Link>
      }
      disabled={loading}
      autoFocus
      onEnter={handleEnter}
    />
  )
}
