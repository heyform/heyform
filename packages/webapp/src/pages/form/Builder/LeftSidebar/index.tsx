import { Content, Description, Overlay, Portal, Root, Title } from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { ReactNode } from 'react'

import { useModal } from '@/store'

import SidebarToggle from '../SidebarToggle'
import QuestionList from './QuestionList'
import SidebarHeader from './SidebarHeader'

const BuilderLeftSidebarComponent = ({ action }: { action?: ReactNode }) => {
  return (
    <>
      <SidebarHeader action={action} />
      <QuestionList />
    </>
  )
}

export const BuilderLeftSidebarModal = () => {
  const { isOpen, onOpenChange } = useModal('BuilderLeftSidebarModal')

  return (
    <Root open={isOpen} onOpenChange={onOpenChange}>
      <Portal>
        <Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-10 bg-black/60" />
        <Content className="border-accent-light bg-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-0 data-[state=open]:slide-in-from-bottom-[80%] fixed bottom-0 left-0 right-0 z-10 max-h-[80vh] rounded-lg border shadow-lg duration-200">
          <Title>
            <VisuallyHidden />
          </Title>
          <Description>
            <VisuallyHidden />
          </Description>
          <BuilderLeftSidebarComponent />
        </Content>
      </Portal>
    </Root>
  )
}

export default function BuilderLeftSidebar({
  collapsed,
  onToggle
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <div
      data-collapsed={collapsed}
      className="builder-sidebar bg-foreground lg:ring-primary/5 relative flex h-full w-[16rem] shrink-0 flex-col data-[collapsed=true]:w-16 max-lg:hidden lg:rounded-lg lg:shadow-sm lg:ring-1"
    >
      <BuilderLeftSidebarComponent
        action={!collapsed && <SidebarToggle side="left" expanded onClick={onToggle} />}
      />
    </div>
  )
}
