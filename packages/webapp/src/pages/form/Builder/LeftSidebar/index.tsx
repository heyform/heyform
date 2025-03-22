import { Content, Description, Overlay, Portal, Root, Title } from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

import { useModal } from '@/store'

import QuestionList from './QuestionList'
import SidebarHeader from './SidebarHeader'

const BuilderLeftSidebarComponent = () => {
  return (
    <>
      <SidebarHeader />
      <QuestionList />
    </>
  )
}

export const BuilderLeftSidebarModal = () => {
  const { isOpen, onOpenChange } = useModal('BuilderLeftSidebarModal')

  return (
    <Root open={isOpen} onOpenChange={onOpenChange}>
      <Portal>
        <Overlay className="fixed inset-0 z-10 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Content className="fixed bottom-0 left-0 right-0 z-10 max-h-[80vh] rounded-lg border border-accent-light bg-foreground shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-0 data-[state=open]:slide-in-from-bottom-[80%]">
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

export default function BuilderLeftSidebar() {
  return (
    <div className="builder-sidebar flex h-full w-[16rem] flex-col bg-foreground max-lg:hidden lg:rounded-lg lg:shadow-sm lg:ring-1 lg:ring-primary/5">
      <BuilderLeftSidebarComponent />
    </div>
  )
}
