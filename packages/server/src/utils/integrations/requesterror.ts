/**
 * @program: heyform-integrations
 * @description: Request Error
 * @author: Mufeng
 * @date: 2021-06-10 13:52
 **/

export class RequestError extends Error {
  readonly response?: any

  constructor(response?: any) {
    super(response?.message)
    this.response = response
  }

  getResponse(): any {
    return this.response
  }
}
