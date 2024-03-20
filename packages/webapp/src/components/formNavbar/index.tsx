import { IconArrowLeft, IconMenu2, IconX } from '@tabler/icons-react'
import { observer } from 'mobx-react-lite'
import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { CSSTransition } from 'react-transition-group'

import { Button } from '@/components/ui'
import { useStore } from '@/store'
import { useParam, useVisible } from '@/utils'

import { FormActions } from './FormActions'
import { Navigation } from './Navigation'
import { UserAccount } from './UserAccount'

export const FormNavbar: FC<IComponentProps> = observer(() => {
  const { workspaceId, projectId } = useParam()
  const workspaceStore = useStore('workspaceStore')
  const navigate = useNavigate()

  const [visible, open, close] = useVisible()

  function toProject() {
    navigate(`/workspace/${workspaceId}/project/${projectId}`)
  }

  return (
    <>
      <div className="space-between -mt-px grid h-[68px] grid-cols-2 gap-3 border-b border-slate-200 px-4 py-3 md:grid-cols-3">
        <div className="flex items-center">
          <Button
            className="group !border-none bg-none !p-0 text-[#4e5d78] !shadow-none hover:!bg-transparent hover:text-[#0252d7]"
            leading={
              <IconArrowLeft className="h-4 w-4 text-[#4e5d78] group-hover:text-[#0252d7]" />
            }
            onClick={toProject}
          >
            {workspaceStore.project?.name}
          </Button>
        </div>

        <div className="hidden md:block">
          <Navigation />
        </div>

        <div className="flex items-center justify-end">
          <div className="hidden md:block">
            <FormActions />
          </div>

          <Button.Link className="mr-2 !block !p-2 md:!hidden" onClick={open}>
            <IconMenu2 />
          </Button.Link>

          <UserAccount />
        </div>
      </div>

      <CSSTransition
        in={visible}
        timeout={0}
        mountOnEnter={true}
        classNames="sidebar-popup-right"
        unmountOnExit={false}
        onExited={close}
      >
        <div className="sidebar fixed inset-0 z-10 flex md:hidden">
          <div
            className="sidebar-overlay fixed inset-0 bg-slate-600 bg-opacity-75 transition-opacity duration-300 ease-in-out"
            aria-hidden="true"
          />
          <div className="sidebar-wrapper relative ml-auto flex h-full w-full max-w-xs flex-1 transform-gpu flex-col bg-white transition-transform duration-300 ease-in-out">
            <div className="px-4 py-10">
              <Navigation />
              <div className="my-10 h-px bg-slate-200"></div>
              <FormActions />
            </div>

            <div className="absolute left-0 top-0 -ml-12 pt-2 md:hidden">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={close}
              >
                <span className="sr-only">Close sidebar</span>
                <IconX className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </CSSTransition>
    </>
  )
})
