import { createElement } from 'react'
import { Navigate } from 'react-router-dom'

import { isRegistrationDisabled } from '@/consts'
import { AuthLayout, BaseLayout, WorkspaceGuard, WorkspaceLayout } from '@/layouts'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import Login from '@/pages/auth/Login'
import OAuth from '@/pages/auth/OAuth'
import ResetPassword from '@/pages/auth/ResetPassword'
import SignUp from '@/pages/auth/SignUp'
import VerifyEmail from '@/pages/auth/VerifyEmail'
import FormAnalytics from '@/pages/form/Analytics'
import FormBuilder from '@/pages/form/Builder'
import FormIntegrations from '@/pages/form/Integrations'
import FormRender from '@/pages/form/Render'
import FormSettings from '@/pages/form/Settings'
import FormShare from '@/pages/form/Share'
import FormSubmissions from '@/pages/form/Submissions'
import FormPhotos from '@/pages/form/Photos'
import ProjectForms from '@/pages/project/Forms'
import ProjectTrash from '@/pages/project/Trash'
import CreateWorkspace from '@/pages/workspace/Create'
import WorkspaceDashboard from '@/pages/workspace/Dashboard'
import WorkspaceInvitation from '@/pages/workspace/Invitation'
import WorkspaceMembers from '@/pages/workspace/Members'
import WorkspaceSettings from '@/pages/workspace/Settings'

const SignUpRoute = () =>
  isRegistrationDisabled()
    ? createElement(Navigate, { to: '/login', replace: true })
    : createElement(SignUp)

const routes = [
  {
    path: '/login',
    component: Login,
    layout: AuthLayout,
    options: {
      title: 'login.title'
    }
  },
  {
    path: '/sign-up',
    component: SignUpRoute,
    layout: AuthLayout,
    options: {
      title: 'signUp.title'
    }
  },
  {
    path: '/forgot-password',
    component: ForgotPassword,
    layout: AuthLayout,
    options: {
      title: 'forgotPassword.title'
    }
  },
  {
    path: '/reset-password',
    component: ResetPassword,
    layout: AuthLayout,
    options: {
      title: 'resetPassword.title'
    }
  },
  {
    path: '/verify-email',
    component: VerifyEmail,
    layout: BaseLayout,
    options: {
      title: 'verifyEmail.title',
      loginRequired: true
    }
  },
  {
    path: '/oauth/authorize',
    component: OAuth,
    layout: BaseLayout,
    options: {
      title: 'oauth.title',
      loginRequired: true
    }
  },
  {
    path: '/',
    layout: WorkspaceGuard,
    component: () => null,
    options: {
      loginRequired: true,
      isHomePage: true
    }
  },
  {
    path: '/workspace/create',
    layout: BaseLayout,
    component: CreateWorkspace,
    options: {
      loginRequired: true
    }
  },
  {
    path: '/workspace/:workspaceId',
    layout: WorkspaceLayout,
    component: WorkspaceDashboard,
    options: {
      loginRequired: true
    }
  },
  {
    path: '/workspace/:workspaceId/invitation/:code',
    layout: AuthLayout,
    component: WorkspaceInvitation,
    options: {
      loginRequired: false,
      title: 'workspace.invitation.title'
    }
  },
  {
    path: '/workspace/:workspaceId/members',
    layout: WorkspaceLayout,
    component: WorkspaceMembers,
    options: {
      loginRequired: true,
      title: 'members.title'
    }
  },
  {
    path: '/workspace/:workspaceId/settings',
    layout: WorkspaceLayout,
    component: WorkspaceSettings,
    options: {
      loginRequired: true,
      title: 'form.settings.title'
    }
  },
  {
    path: '/workspace/:workspaceId/project/:projectId',
    layout: WorkspaceLayout,
    component: ProjectForms,
    options: {
      projectShell: true,
      loginRequired: true,
      title: 'project.forms.title'
    }
  },
  {
    path: '/workspace/:workspaceId/project/:projectId/trash',
    layout: WorkspaceLayout,
    component: ProjectTrash,
    options: {
      projectShell: true,
      loginRequired: true,
      title: 'project.trash.title'
    }
  },
  {
    path: '/workspace/:workspaceId/project/:projectId/form/:formId/analytics',
    layout: WorkspaceLayout,
    component: FormAnalytics,
    options: {
      formShell: true,
      loginRequired: true,
      title: 'form.analytics.title'
    }
  },
  {
    path: '/workspace/:workspaceId/project/:projectId/form/:formId/submissions',
    layout: WorkspaceLayout,
    component: FormSubmissions,
    options: {
      formShell: true,
      loginRequired: true,
      title: 'form.submissions.title'
    }
  },
  {
    path: '/workspace/:workspaceId/project/:projectId/form/:formId/photos',
    layout: WorkspaceLayout,
    component: FormPhotos,
    options: {
      formShell: true,
      loginRequired: true,
      title: 'Photos'
    }
  },
  {
    path: '/workspace/:workspaceId/project/:projectId/form/:formId/integrations',
    layout: WorkspaceLayout,
    component: FormIntegrations,
    options: {
      formShell: true,
      loginRequired: true,
      title: 'form.integrations.title'
    }
  },
  {
    path: '/workspace/:workspaceId/project/:projectId/form/:formId/share',
    layout: WorkspaceLayout,
    component: FormShare,
    options: {
      formShell: true,
      loginRequired: true,
      title: 'form.share.title'
    }
  },
  {
    path: '/workspace/:workspaceId/project/:projectId/form/:formId/settings',
    layout: WorkspaceLayout,
    component: FormSettings,
    options: {
      formShell: true,
      loginRequired: true,
      title: 'form.settings.title',
      className: '[&_[data-slot=layout-container]]:!pb-0'
    }
  },
  {
    path: '/workspace/:workspaceId/project/:projectId/form/:formId/create',
    component: FormBuilder,
    options: {
      loginRequired: true,
      title: 'form.builder.title'
    }
  },
  {
    path: '/form/:formId',
    component: FormRender,
    options: {
      loginRequired: false,
      title: 'form.render.title'
    }
  }
]

export default routes
