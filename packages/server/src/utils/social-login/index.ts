import { AppleSocialLogin, AppleSocialLoginOptions, UserInfo } from './apple'
import { GoogleSocialLogin, GoogleSocialLoginOptions } from './google'
import { OidcSocialLogin, OidcSocialLoginOptions } from './oidc'

export { UserInfo } from './apple'
export { OidcSocialLoginOptions } from './oidc'

export enum SocialLoginKindEnum {
  APPLE = 'apple',
  GOOGLE = 'google',
  OIDC = 'oidc'
}

export function appleLoginUrl(options: AppleSocialLoginOptions): string {
  return new AppleSocialLogin(options as any).getAuthUrl()
}

export function googleLoginUrl(options: GoogleSocialLoginOptions): string {
  return new GoogleSocialLogin(options as any).getAuthUrl()
}

export async function oidcLoginUrl(options: OidcSocialLoginOptions): Promise<string> {
  return new OidcSocialLogin(options).getAuthUrl()
}

export async function appleUserInfo(
  code: string,
  options: AppleSocialLoginOptions
): Promise<UserInfo> {
  const client = new AppleSocialLogin(options as any)
  const token = await client.getToken(code)
  return client.getUserInfo(token.id_token)
}

export async function googleUserInfo(
  code: string,
  options: GoogleSocialLoginOptions
): Promise<UserInfo> {
  const client = new GoogleSocialLogin(options as any)
  const token = await client.getToken(code)
  return await client.getUserInfo(token)
}

export async function oidcUserInfo(
  code: string,
  options: OidcSocialLoginOptions,
  iss?: string
): Promise<UserInfo> {
  const client = new OidcSocialLogin(options)
  const token = await client.getToken(code, iss)
  return await client.getUserInfo(token)
}
