import 'tsconfig-paths/register'
import { helper } from '@heyform-inc/utils'
import {
  FormModel,
  FormSchema,
  ProjectMemberModel,
  ProjectMemberSchema,
  ProjectModel,
  ProjectSchema,
  TeamModel,
  TeamSchema
} from '@model'
import { Connection } from 'mongoose'

export default {
  async up(mongoose: Connection) {
    const teamModel = mongoose.model<TeamModel>(TeamModel.name, TeamSchema)
    const projectModel = mongoose.model<ProjectModel>(
      ProjectModel.name,
      ProjectSchema
    )
    const projectMemberModel = mongoose.model<ProjectMemberModel>(
      ProjectMemberModel.name,
      ProjectMemberSchema
    )
    const formModel = mongoose.model<FormModel>(FormModel.name, FormSchema)
    const teams = await teamModel.find()

    for (const team of teams) {
      const projects = await projectModel.find({
        teamId: team.id
      })

      if (helper.isEmpty(projects)) {
        const project = await projectModel.create({
          teamId: team.id,
          name: 'New Project',
          ownerId: team.ownerId
        } as any)

        // Link members with project
        await projectMemberModel.create({
          projectId: project.id,
          memberId: team.ownerId
        })

        // Link forms to project
        await formModel.updateMany(
          {
            teamId: team.id
          },
          {
            projectId: project.id
          }
        )
      }
    }
  },
  async down(mongoose: Connection) {
    //
  }
}
