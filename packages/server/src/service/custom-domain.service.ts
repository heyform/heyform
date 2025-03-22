/**
 * @program: heyform-serves
 * @description:
 * @author: mufeng
 * @date: 11/24/21 4:00 PM
 **/

import {
  CADDY_ANAME_PROXY,
  CADDY_API_URL,
  CADDY_CNAME_PROXY,
  CADDY_SERVER_ID,
  CADDY_TLS_AUTOMATION_POLICY_ID,
  CADDY_UPSTREAM
} from '@environments'
import { CustomDomainModel, SubscriptionStatusEnum } from '@model'
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Caddy, getDNSRecords } from '@utils'
import { Model } from 'mongoose'
import { TeamService } from './team.service'
import { helper } from '@heyform-inc/utils'

@Injectable()
export class CustomDomainService {
  private readonly logger = new Logger(CustomDomainService.name)
  private readonly caddy: Caddy = new Caddy({
    apiUrl: CADDY_API_URL,
    serverId: CADDY_SERVER_ID,
    tlsAutomationPolicyId: CADDY_TLS_AUTOMATION_POLICY_ID
  })

  constructor(
    @InjectModel(CustomDomainModel.name)
    private readonly customDomainModel: Model<CustomDomainModel>,
    private readonly teamService: TeamService
  ) {}

  async findAllInTeams(teamIds: string[]): Promise<CustomDomainModel[]> {
    return this.customDomainModel.find({
      teamId: {
        $in: teamIds
      },
      active: true
    })
  }

  async findByDomain(domain: string): Promise<CustomDomainModel | null> {
    return this.customDomainModel.findOne({
      domain
    })
  }

  public async validateDNSRecords(domain: string) {
    const records = await getDNSRecords(domain)

    // Log dns search result
    this.logger.log({ domain, records })

    // Find the A/CNAME record
    const record = records.find(r => {
      return (
        (r.type === 'CNAME' && r.value === CADDY_CNAME_PROXY) ||
        (r.type === 'A' && r.value === CADDY_ANAME_PROXY)
      )
    })

    return !!record
  }

  public async createOrUpdateRoute(
    teamId: string,
    host: string,
    oldHost?: string
  ) {
    if (helper.isEqual(oldHost?.toLowerCase(), host.toLowerCase())) {
      oldHost = undefined
    }

    return this.caddy.createOrUpdateRoute(teamId, host, CADDY_UPSTREAM, oldHost)
  }

  async validate(domain: string): Promise<boolean> {
    const customDomain = await this.findByDomain(domain)

    if (!customDomain || !customDomain.active) {
      return false
    }

    const team = await this.teamService.findWithPlanById(customDomain.teamId)

    return (
      team &&
      team.subscription.status === SubscriptionStatusEnum.ACTIVE &&
      team.plan.customDomain
    )
  }

  public async create(customDomain: CustomDomainModel | any): Promise<boolean> {
    const result = await this.customDomainModel.create(customDomain)
    return !!result.id
  }

  public async update(
    id: string,
    updates: Record<string, any>
  ): Promise<boolean> {
    const result = await this.customDomainModel.updateOne(
      {
        _id: id
      },
      updates
    )
    return !!result.ok
  }

  public async disable(teamId: string, domain: string) {
    const result = await this.customDomainModel.updateMany(
      {
        teamId,
        domain: {
          $ne: domain
        }
      },
      {
        active: false
      }
    )
    return !!result.ok
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.customDomainModel.deleteOne({
      _id: id
    })
    return result?.n > 0
  }
}
