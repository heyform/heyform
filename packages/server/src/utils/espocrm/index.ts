import got from 'got'
import { Logger } from '../logger'

export interface EspoCRMOptions {
  apiURL: string
  apiKey: string
}

export interface EspoCRMAccount {
  name: string
  emailAddress: string
  cCustomerStatus: string
  description?: string
}

export interface EspoCRMLead extends Omit<EspoCRMAccount, 'cCustomerStatus'> {
  source?: string
  firstName?: string
  lastName?: string
}

export enum EspoCRMAction {
  CREATE_LEAD,
  UPDATE_LEAD,
  DELETE_LEAD,
  CREATE_ACCOUNT,
  UPDATE_ACCOUNT,
  DELETE_ACCOUNT
}

export class EspoCRM {
  private readonly options: EspoCRMOptions
  private readonly logger = new Logger(EspoCRM.name)

  constructor(options: EspoCRMOptions) {
    this.options = options
  }

  async createLead(lead: EspoCRMLead) {
    const [firstName, lastName] = lead.name.split(' ')

    return this.request('/Lead', {
      method: 'POST',
      json: {
        name: lead.name,
        emailAddress: lead.emailAddress,
        source: lead.source || 'Existing Customer',
        salutationName: 'Dr.',
        firstName,
        lastName
      }
    })
  }

  async updateLead(leadId: string, updates: Partial<EspoCRMLead>) {
    if (updates.name) {
      const [firstName, lastName] = updates.name.split(' ')

      updates.firstName = firstName
      updates.lastName = lastName
    }

    return this.request(`/Lead/${leadId}`, {
      method: 'PUT',
      json: updates
    })
  }

  async deleteLead(leadId: string) {
    return this.request(`/Lead/${leadId}`, {
      method: 'DELETE'
    })
  }

  async createAccount(account: EspoCRMAccount) {
    return this.request('/Account', {
      method: 'POST',
      json: account
    })
  }

  async updateAccount(accountId: string, updates: Partial<EspoCRMAccount>) {
    return this.request(`/Account/${accountId}`, {
      method: 'PUT',
      json: updates
    })
  }

  async deleteAccount(accountId: string) {
    return this.request(`/Account/${accountId}`, {
      method: 'DELETE'
    })
  }

  private request(url: string, options?: any): Promise<any> {
    try {
      return got(this.options.apiURL + url, {
        ...options,
        headers: {
          'X-Api-Key': this.options.apiKey,
          ...options?.headers
        },
        timeout: 30_000
      }).json()
    } catch (err: any) {
      if (err.response) {
        err.message = err.response.headers['x-status-reason']
      }

      this.logger.error(err)
      throw err
    }
  }
}
