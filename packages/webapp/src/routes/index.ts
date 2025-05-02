// import { FormRenderer } from '@heyform-inc/form-renderer'
import { lazy } from 'react'

import {
  AuthLayout,
  BaseLayout,
  FormLayout,
  LoginGuard,
  ProjectLayout, // PublicLayout,
  TemplateLayout,
  WorkspaceGuard,
  WorkspaceLayout
} from '@/layouts'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import Login from '@/pages/auth/Login'
import OAuth from '@/pages/auth/OAuth'
import ResetPassword from '@/pages/auth/ResetPassword'
import SignUp from '@/pages/auth/SignUp'
import VerifyEmail from '@/pages/auth/VerifyEmail'
import FormAnalytics from '@/pages/form/Analytics'
import FormBuilder from '@/pages/form/Builder'
import FormIntegrations from '@/pages/form/Integrations'
import FormSettings from '@/pages/form/Settings'
import FormShare from '@/pages/form/Share'
import FormSubmissions from '@/pages/form/Submissions'
import ProjectForms from '@/pages/project/Forms'
import ProjectTrash from '@/pages/project/Trash'
import Onboarding from '@/pages/user/Onboarding'
import Template from '@/pages/user/Template'
import CreateWorkspace from '@/pages/workspace/Create'
import WorkspaceDashboard from '@/pages/workspace/Dashboard'
import WorkspaceInvitation from '@/pages/workspace/Invitation'
import WorkspaceMembers from '@/pages/workspace/Members'
import WorkspaceSettings from '@/pages/workspace/Settings'
// import FormRender from '@/pages/form/Render'

const FormRender = lazy(() => import('@/pages/form/Render'))

const routes = [
  // Auth
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
    component: SignUp,
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

  /* Onboarding */
  {
    path: '/onboarding',
    layout: LoginGuard,
    component: Onboarding,
    options: {
      loginRequired: true,
      isOnboardingPage: true,
      title: 'onboarding.title'
    }
  },

  /* Home */
  {
    path: '/',
    layout: WorkspaceGuard,
    component: () => null,
    options: {
      loginRequired: true,
      isHomePage: true
    }
  },

  // Workspace
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
    layout: BaseLayout,
    component: WorkspaceInvitation,
    options: {
      loginRequired: true,
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

  // Project
  {
    path: '/workspace/:workspaceId/project/:projectId',
    layout: ProjectLayout,
    component: ProjectForms,
    options: {
      loginRequired: true,
      title: 'project.forms.title'
    }
  },
  {
    path: '/workspace/:workspaceId/project/:projectId/trash',
    layout: ProjectLayout,
    component: ProjectTrash,
    options: {
      loginRequired: true,
      title: 'project.trash.title'
    }
  },

  // Form
  {
    path: '/workspace/:workspaceId/project/:projectId/form/:formId/analytics',
    layout: FormLayout,
    component: FormAnalytics,
    options: {
      loginRequired: true,
      title: 'form.analytics.title'
    }
  },
  {
    path: '/workspace/:workspaceId/project/:projectId/form/:formId/submissions',
    layout: FormLayout,
    component: FormSubmissions,
    options: {
      loginRequired: true,
      className: '[&_[data-slot=layout-inner]]:max-w-full',
      title: 'form.submissions.title'
      // className: '[&_[data-slot=sidebar]]:-translate-x-full [&_[data-slot=main]]:lg:pl-2'
    }
  },
  {
    path: '/workspace/:workspaceId/project/:projectId/form/:formId/integrations',
    layout: FormLayout,
    component: FormIntegrations,
    options: {
      loginRequired: true,
      title: 'form.integrations.title'
    }
  },
  {
    path: '/workspace/:workspaceId/project/:projectId/form/:formId/share',
    layout: FormLayout,
    component: FormShare,
    options: {
      loginRequired: true,
      title: 'form.share.title'
    }
  },
  {
    path: '/workspace/:workspaceId/project/:projectId/form/:formId/settings',
    layout: FormLayout,
    component: FormSettings,
    options: {
      loginRequired: true,
      title: 'form.settings.title',
      className: '[&_[data-slot=layout-container]]:!pb-0'
    }
  },

  // Builder
  {
    path: '/workspace/:workspaceId/project/:projectId/form/:formId/create',
    component: FormBuilder,
    options: {
      loginRequired: true,
      title: 'form.builder.title'
    }
  },

  // Render Form
  {
    path: '/form/:formId',
    // layout: PublicLayout,
    // component: FormRenderer,
    component: FormRender,
    options: {
      loginRequired: false,
      title: 'form.render.title'
      // redirectIfLogged: false
    }
  },

  // Template
  {
    path: '/template/:templateId',
    layout: TemplateLayout,
    component: Template,
    options: {
      loginRequired: true,
      title: 'template.use.title'
    }
  }
]

export default routes
