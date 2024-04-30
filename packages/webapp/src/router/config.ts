import { lazy } from 'react'

import {
  AuthGuard,
  AuthLayout,
  CommonLayout,
  FormLayout,
  PublicLayout,
  WorkspaceLayout
} from '@/components'

export interface CustomRouteConfig {
  path: string
  title?: string
  loginRequired?: boolean
  redirectIfLogged?: boolean
  layout: any
  component: any
}

/* Auth */
const Login = lazy(() => import('@/pages/auth/Login'))
const SignUp = lazy(() => import('@/pages/auth/SignUp'))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'))
const OauthAuthorization = lazy(() => import('@/pages/auth/OauthAuthorization'))

/* Verify email address */
const VerifyEmail = lazy(() => import('@/pages/user/VerifyEmail'))

/* Join workspace */
const JoinWorkspace = lazy(() => import('@/pages/workspace/JoinWorkspace'))

/* Workspace */
const Home = lazy(() => import('@/pages/home/Home'))
const CreateWorkspace = lazy(() => import('@/pages/workspace/CreateWorkspace'))
const Workspace = lazy(() => import('@/pages/workspace/Workspace'))
const Members = lazy(() => import('@/pages/workspace/Members'))

/* Project */
const Project = lazy(() => import('@/pages/project/Project'))
const Trash = lazy(() => import('@/pages/project/Trash'))

/* Form */
const FormBuilder = lazy(() => import('@/pages/form/Create'))
const Integration = lazy(() => import('@/pages/form/Integration'))
const Analytics = lazy(() => import('@/pages/form/Analytics'))
const Submissions = lazy(() => import('@/pages/form/Submissions'))
const FormSettings = lazy(() => import('@/pages/form/FormSettings'))
const FormRender = lazy(() => import('@/pages/form/Render'))

const config: CustomRouteConfig[] = [
  /* Login */
  {
    path: '/login',
    loginRequired: false,
    redirectIfLogged: true,
    layout: CommonLayout,
    component: Login,
    title: 'Login'
  },
  /* Sign Up */
  {
    path: '/sign-up',
    loginRequired: false,
    redirectIfLogged: true,
    layout: CommonLayout,
    component: SignUp,
    title: 'auth.signup.signUp'
  },
  /* Forgot Password */
  {
    path: '/forgot-password',
    loginRequired: false,
    redirectIfLogged: true,
    layout: CommonLayout,
    component: ForgotPassword,
    title: 'Forgot Password'
  },
  /* Reset Password */
  {
    path: '/reset-password',
    loginRequired: false,
    redirectIfLogged: true,
    layout: CommonLayout,
    component: ResetPassword,
    title: 'Reset Password'
  },

  /* Verify email address */
  {
    path: '/verify-email',
    loginRequired: true,
    layout: AuthLayout,
    component: VerifyEmail,
    title: 'Verify email address'
  },

  /* Home */
  {
    path: '/',
    loginRequired: true,
    layout: AuthGuard,
    component: Home
  },

  /* Setup workspace if there is no one exists */
  {
    path: '/workspace/create',
    loginRequired: true,
    layout: AuthLayout,
    component: CreateWorkspace,
    title: 'Create workspace'
  },

  /* OAuth v2 authorize */
  {
    path: '/oauth/authorize',
    loginRequired: true,
    layout: AuthLayout,
    component: OauthAuthorization,
    title: 'Authorize'
  },

  /* Workspace */
  {
    path: '/workspace/:workspaceId',
    loginRequired: true,
    layout: WorkspaceLayout,
    component: Workspace
  },
  {
    path: '/workspace/:workspaceId/member',
    loginRequired: true,
    layout: WorkspaceLayout,
    component: Members
  },

  /* Join workspace with invite code */
  {
    path: '/workspace/:workspaceId/invitation/:inviteCode',
    loginRequired: true,
    layout: AuthLayout,
    component: JoinWorkspace,
    title: 'Form invitation'
  },

  /* Project */
  {
    path: '/workspace/:workspaceId/project/:projectId',
    loginRequired: true,
    layout: WorkspaceLayout,
    component: Project
  },
  {
    path: '/workspace/:workspaceId/project/:projectId/trash',
    loginRequired: true,
    layout: WorkspaceLayout,
    component: Trash
  },

  /* Form */
  {
    path: '/form/:formId',
    component: FormRender,
    loginRequired: false,
    redirectIfLogged: false,
    layout: PublicLayout
  },
  {
    path: '/workspace/:workspaceId/project/:projectId/form/:formId/create',
    layout: FormLayout,
    component: FormBuilder
  },
  {
    path: '/workspace/:workspaceId/project/:projectId/form/:formId/connect',
    layout: FormLayout,
    component: Integration
  },
  {
    path: '/workspace/:workspaceId/project/:projectId/form/:formId/analytics',
    layout: FormLayout,
    component: Analytics
  },
  {
    path: '/workspace/:workspaceId/project/:projectId/form/:formId/submissions',
    layout: FormLayout,
    component: Submissions
  },
  {
    path: '/workspace/:workspaceId/project/:projectId/form/:formId/submissions/:category',
    layout: FormLayout,
    component: Submissions
  },
  {
    path: '/workspace/:workspaceId/project/:projectId/form/:formId/settings',
    layout: FormLayout,
    component: FormSettings
  }
]

export default config
