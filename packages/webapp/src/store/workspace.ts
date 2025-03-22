import { helper } from '@heyform-inc/utils'
import { create } from 'zustand'
import computed from 'zustand-computed'
import { createJSONStorage, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { WEBSITE_URL, WORKSPACE_STORAGE_KEY } from '@/consts'
import { FormType, MemberType, PlanType, ProjectType, WorkspaceType } from '@/types'

type WorkspaceStoreType = {
  workspaces: WorkspaceType[]
  _memberMap: AnyMap<string, MemberType[]>
  _formMap: AnyMap<string, FormType[]>
  plans: PlanType[]

  currentWorkspaceId?: string
  currentProjectId?: string
  currentFormId?: string

  setWorkspaces: (workspaces: WorkspaceType[]) => void
  selectWorkspace: (workspaceId: string) => void
  addWorkspace: (workspace: WorkspaceType) => void
  updateWorkspace: (workspaceId: string, updates: Partial<WorkspaceType>) => void
  deleteWorkspace: (workspaceId: string) => void
  selectProject: (projectId: string) => void
  addProject: (workspaceId: string, project: ProjectType) => void
  updateProject: (workspaceId: string, projectId: string, updates: Partial<ProjectType>) => void
  deleteProject: (workspaceId: string, projectId: string) => void
  addMemberToProject: (workspaceId: string, projectId: string, memberId: string) => void
  removeMemberFromProject: (workspaceId: string, projectId: string, memberId: string) => void
  selectForm: (formId: string) => void
  setForms: (projectId: string, forms: FormType[]) => void
  addForm: (projectId: string, form: FormType) => void
  updateForm: (projectId: string, formId: string, updates: Partial<FormType>) => void
  deleteForm: (projectId: string, formId: string) => void
  setMembers: (workspaceId: string, members: MemberType[]) => void
  removeMember: (workspaceId: string, memberId: string) => void
  setPlans: (plans: PlanType[]) => void
}

interface ComputedStoreType {
  workspace: WorkspaceType
  sharingURLPrefix: string
  project?: ProjectType
  members: MemberType[]
  forms: FormType[]
}

const computeState = (state: WorkspaceStoreType): ComputedStoreType => {
  let project: ProjectType | undefined
  let members: MemberType[] = []
  let forms: FormType[] = []
  let sharingURLPrefix = WEBSITE_URL

  const workspace = state.workspaces.find(w => w.id === state.currentWorkspaceId)

  if (workspace) {
    members = state._memberMap[workspace.id] || []
    project = workspace.projects.find(p => p.id === state.currentProjectId)

    if (project) {
      forms = state._formMap[project.id] || []
    }

    sharingURLPrefix = `https://localhost:3000`
  }

  return {
    workspace: workspace as WorkspaceType,
    project,
    members,
    forms,
    sharingURLPrefix
  }
}

export const useWorkspaceStore = create<WorkspaceStoreType>()(
  persist(
    computed(
      immer(set => ({
        workspaces: [],
        _memberMap: {},
        _formMap: {},
        plans: [],
        currentWorkspaceId: undefined,
        currentProjectId: undefined,
        currentFormId: undefined,

        setWorkspaces: workspaces => {
          set(state => {
            state.workspaces = workspaces
          })
        },

        selectWorkspace: workspaceId => {
          set(state => {
            state.currentWorkspaceId = workspaceId
          })
        },

        addWorkspace: workspace => {
          set(state => {
            state.workspaces.push(workspace)
          })
        },

        updateWorkspace: (workspaceId, updates) => {
          set(state => {
            const workspace = state.workspaces.find(w => w.id === workspaceId)

            if (workspace) {
              Object.assign(workspace, updates)
            }
          })
        },

        deleteWorkspace: workspaceId => {
          set(state => {
            state.workspaces = state.workspaces.filter(w => w.id !== workspaceId)
            state.currentWorkspaceId = undefined
          })
        },

        selectProject: projectId => {
          set(state => {
            state.currentProjectId = projectId
          })
        },

        addProject: (workspaceId, project) => {
          set(state => {
            const workspace = state.workspaces.find(w => w.id === workspaceId)

            if (workspace) {
              workspace.projects.push(project)
            }
          })
        },

        updateProject: (workspaceId, projectId, updates) => {
          set(state => {
            const workspace = state.workspaces.find(w => w.id === workspaceId)

            if (workspace) {
              const project = workspace?.projects.find(p => p.id === projectId)

              if (project) {
                Object.assign(project, updates)
              }
            }
          })
        },

        deleteProject: (workspaceId, projectId) => {
          set(state => {
            const workspace = state.workspaces.find(w => w.id === workspaceId)

            if (workspace) {
              workspace.projects = workspace.projects.filter(p => p.id !== projectId)
              state.currentProjectId = undefined
            }
          })
        },

        addMemberToProject: (workspaceId, projectId, memberId) => {
          set(state => {
            const workspace = state.workspaces.find(w => w.id === workspaceId)

            if (workspace) {
              const project = workspace.projects.find(p => p.id === projectId)

              if (project) {
                project.members.push(memberId)
              }
            }
          })
        },

        removeMemberFromProject: (workspaceId, projectId, memberId) => {
          set(state => {
            const workspace = state.workspaces.find(w => w.id === workspaceId)

            if (workspace) {
              const project = workspace.projects.find(p => p.id === projectId)

              if (project) {
                project.members = project.members.filter(m => m !== memberId)
              }
            }
          })
        },

        selectForm: formId => {
          set(state => {
            state.currentFormId = formId
          })
        },

        setForms: (projectId, forms) => {
          set(state => {
            state._formMap[projectId] = forms
          })
        },

        addForm: (projectId, form) => {
          set(state => {
            state._formMap[projectId].push(form)
          })
        },

        updateForm: (projectId, formId, updates) => {
          set(state => {
            const forms = state._formMap[projectId]

            if (helper.isValidArray(forms)) {
              const form = forms.find(f => f.id === formId)

              if (form) {
                Object.assign(form, updates)
              }
            }
          })
        },

        deleteForm: (projectId, formId) => {
          set(state => {
            const forms = state._formMap[projectId]

            if (helper.isValidArray(forms)) {
              state._formMap[projectId] = forms.filter(f => f.id !== formId)
            }

            state.currentFormId = undefined
          })
        },

        setMembers: (workspaceId, members) => {
          set(state => {
            state._memberMap[workspaceId] = members
          })
        },

        removeMember: (workspaceId, memberId) => {
          set(state => {
            const members = state._memberMap[workspaceId]

            if (helper.isValidArray(members)) {
              state._memberMap[workspaceId] = members.filter(m => m.id !== memberId)
            }
          })
        },

        setPlans: plans => {
          set(state => {
            state.plans = plans
          })
        }
      })),
      computeState
    ),
    {
      name: WORKSPACE_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage)
    }
  )
)
