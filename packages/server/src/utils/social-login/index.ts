import { AppleSocialLogin, AppleSocialLoginOptions, UserInfo } from './apple'
import { GoogleSocialLogin, GoogleSocialLoginOptions } from './google'

export { UserInfo } from './apple'

export enum SocialLoginKindEnum {
  APPLE = 'apple',
  GOOGLE = 'google'
}

export function appleLoginUrl(options: AppleSocialLoginOptions): string {
  return new AppleSocialLogin(options as any).getAuthUrl()
}

export function googleLoginUrl(options: GoogleSocialLoginOptions): string {
  return new GoogleSocialLogin(options as any).getAuthUrl()
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
