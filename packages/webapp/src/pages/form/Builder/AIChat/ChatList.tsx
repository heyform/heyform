import { nanoid } from '@heyform-inc/utils'
import { FC, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import IconLogo from '@/assets/logo.svg?react'
import { Avatar, Loader } from '@/components'
import { useUserStore } from '@/store'
import { ChatMessageType } from '@/types'
import { cn } from '@/utils'

import { useChatStore } from './ChatStore'

const MessageLoader = () => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5">
        <div className="relative h-5 w-5 rounded-full p-0.5 after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:border after:border-input">
          <IconLogo className="h-4 w-4" />
        </div>
        <span className="text-sm/6 font-semibold">HeyForm</span>
      </div>

      <div className="mt-2 flex">
        <div className="inline-flex h-[2.25rem] items-center rounded-lg bg-accent px-3 py-2 text-sm text-primary">
          <Loader.ThreeDot />
        </div>
      </div>
    </div>
  )
}

const MessageItem: FC<ChatMessageType> = ({ content, isUser }) => {
  const { user } = useUserStore()

  return (
    <div className="mb-6">
      <div
        className={cn('flex items-center gap-1.5', {
          'justify-end': isUser
        })}
      >
        {isUser ? (
          <Avatar className="h-5 w-5" src={user?.avatar} fallback={user?.name} />
        ) : (
          <div className="relative h-5 w-5 rounded-full p-0.5 after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:border after:border-input">
            <IconLogo className="h-4 w-4" />
          </div>
        )}
        <span className="text-sm/6 font-semibold">{isUser ? 'You' : 'HeyForm AI'}</span>
      </div>

      <div
        className={cn('mt-2 flex', {
          'justify-end': isUser
        })}
      >
        <div className="inline-block max-w-[20rem] whitespace-pre-line break-words rounded-lg bg-accent px-3 py-2 text-sm text-primary">
          {content}
        </div>
      </div>
    </div>
  )
}

export default function ChatList() {
  const { t } = useTranslation()
  const { status, messages, addMessage, clearMessages } = useChatStore()

  useEffect(() => {
    addMessage({
      id: nanoid(12),
      type: 'text',
      content: t('form.chat.welcome')
    })

    return () => {
      clearMessages()
    }
  }, [])

  useEffect(() => {
    document.querySelector('.chat-messages')?.scrollTo(0, 10_000)
  }, [messages.length])

  return (
    <div className="chat-messages scrollbar w-full flex-1 px-4 pb-2 pt-8">
      {messages.map(row => (
        <MessageItem key={row.id} {...row} />
      ))}

      {status === 'loading' && <MessageLoader />}
    </div>
  )
}
