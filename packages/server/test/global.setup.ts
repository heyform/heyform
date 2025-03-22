import 'tsconfig-paths/register'
import { BCRYPT_SALT } from '@environments'
import { md5, passwordHash } from '@heyforms/nestjs'
import { CaptchaKindEnum, FormStatusEnum } from '@heyform-inc/shared-types-enums'
import { timestamp } from '@heyform-inc/utils'
import {
  AppModel,
  BillingCycleEnum,
  PlanModel,
  PlanPriceModel,
  SubscriptionStatusEnum,
  TeamRoleEnum,
  TemplateModel
} from '@model'
import { getModelToken } from '@nestjs/mongoose'
import {
  FormService,
  PlanService,
  ProjectService,
  TeamService,
  UserService
} from '@service'
import * as mongoose from 'mongoose'
import apps from './fixtures/apps'
import planPrices from './fixtures/plan-prices'
import plans from './fixtures/plans'
import templates from './fixtures/templates'
import users from './fixtures/users'
import { dropDatabase, getApp } from './utils'

async function createUser(config: any): Promise<any> {
  return {
    _id: config._id,
    name: config.name,
    email: config.email,
    avatar: md5(config.email),
    password: await passwordHash(config.password, BCRYPT_SALT)
  }
}

module.exports = async function () {
  try {
    // Drop database
    await dropDatabase()

    // Init app
    const app = await getApp()

    // Init models
    const appModel = app.get(getModelToken(AppModel.name))
    const planModel = app.get(getModelToken(PlanModel.name))
    const planPriceModel = app.get(getModelToken(PlanPriceModel.name))
    const templateModel = app.get(getModelToken(TemplateModel.name))

    // Insert Plans and PlanPrices
    await planModel.insertMany(plans)
    await planPriceModel.insertMany(planPrices)

    // Insert templates
    await templateModel.insertMany(templates)

    // Insert apps
    await appModel.insertMany(apps)

    const userService = app.get<UserService>(UserService)
    const planService = app.get<PlanService>(PlanService)
    const teamService = app.get<TeamService>(TeamService)
    const projectService = app.get<ProjectService>(ProjectService)
    const formService = app.get<FormService>(FormService)

    for (const key of Object.keys(users)) {
      const user = users[key]

      // Plan
      const plan = await planService.findByGrade(user.planGrade)

      // Create user
      await userService.create(await createUser(user))

      // Create team
      await teamService.create({
        _id: user.teamId,
        ownerId: user._id,
        name: user.teamName,
        storageQuota: 0,
        subscription: {
          planId: plan.id,
          billingCycle: BillingCycleEnum.FOREVER,
          startAt: timestamp(),
          endAt: -1,
          status: SubscriptionStatusEnum.ACTIVE
        }
      })

      // Connect team with member
      await teamService.createMember({
        teamId: user.teamId,
        memberId: user._id,
        role: TeamRoleEnum.ADMIN
      })

      // Create project
      await projectService.create({
        _id: user.projectId,
        name: user.projectName,
        teamId: user.teamId,
        ownerId: user._id
      })

      // Connect project with team member
      await projectService.addMembers([
        {
          projectId: user.projectId,
          memberId: user._id
        }
      ])

      // Create form
      await formService.create({
        _id: user.formId,
        name: user.formName,
        teamId: user.teamId,
        projectId: user.projectId,
        memberId: user._id,
        settings: {
          captchaKind: CaptchaKindEnum.NONE,
          filterSpam: false,
          active: true,
          published: false,
          allowArchive: true,
          requirePassword: false,
          redirectOnCompletion: false
        },
        fields: [],
        submissionCount: 0,
        status: FormStatusEnum.NORMAL
      })
    }

    // Update owner's form
    await formService.update(users.owner.formId, {
      fields: [
        {
          id: 'member_field_01',
          title: 'short text',
          kind: 'short_text',
          validations: {
            required: true
          }
        }
      ]
    })

    // Add member to users.owner' team
    await teamService.createMember({
      teamId: users.owner.teamId,
      memberId: users.member._id,
      role: TeamRoleEnum.MEMBER
    })

    // Add member to users.owner' project
    await projectService.addMembers([
      {
        projectId: users.owner.projectId,
        memberId: users.member._id
      }
    ])

    // Close app
    await mongoose.connection.close(true)
    await app.close()
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
