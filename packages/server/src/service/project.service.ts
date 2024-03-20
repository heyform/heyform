import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { helper } from '@heyform-inc/utils'

import { ProjectMemberModel, ProjectModel } from '@model'

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(ProjectModel.name)
    private readonly projectModel: Model<ProjectModel>,
    @InjectModel(ProjectMemberModel.name)
    private readonly projectMemberModel: Model<ProjectMemberModel>
  ) {}

  async findAllInTeam(teamId: string): Promise<ProjectModel[]> {
    return this.projectModel
      .find({
        teamId
      })
      .sort({
        createdAt: -1
      })
  }

  async findById(id: string): Promise<ProjectModel | null> {
    return this.projectModel.findById(id)
  }

  async findByIds(ids: string[], conditions?: Record<string, any>): Promise<ProjectModel[]> {
    return this.projectModel
      .find({
        _id: {
          $in: ids
        },
        ...conditions
      })
      .sort({
        createdAt: -1
      })
  }

  public async create(project: ProjectModel | any): Promise<string> {
    const result = await this.projectModel.create(project)
    return result.id
  }

  public async update(id: string, updates: Record<string, any>): Promise<boolean> {
    const result = await this.projectModel.updateOne(
      {
        _id: id
      },
      updates
    )
    return !!result.ok
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.projectModel.deleteOne({
      _id: id
    })
    return result?.n > 0
  }

  public async findMemberById(
    projectId: string,
    memberId: string
  ): Promise<ProjectMemberModel | null> {
    return this.projectMemberModel.findOne({
      projectId,
      memberId
    })
  }

  public async findProjectsByMemberId(memberId: string): Promise<string[]> {
    const members = await this.projectMemberModel.find({
      memberId
    })
    return members.map(row => row.projectId)
  }

  public async findMembers(projectId: string | string[]): Promise<ProjectMemberModel[]> {
    return this.projectMemberModel.find({
      projectId: helper.isArray(projectId) ? { $in: projectId } : projectId
    })
  }

  public async memberCount(projectId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.projectMemberModel.countDocuments(
        {
          projectId
        },
        (err, count) => {
          if (err) {
            reject(err)
          } else {
            resolve(count)
          }
        }
      )
    })
  }

  public async addMembers(members: any): Promise<any> {
    return this.projectMemberModel.insertMany(members, {
      // see https://docs.mongodb.com/php-library/master/reference/method/MongoDBCollection-insertMany/
      ordered: false
    })
  }

  public async createMember(member: ProjectMemberModel | any): Promise<boolean> {
    const result = await this.projectMemberModel.create(member)
    return !!result.id
  }

  public async deleteMember(projectId: string, memberId: string): Promise<boolean> {
    const result = await this.projectMemberModel.deleteOne({
      projectId,
      memberId
    })
    return result?.n > 0
  }

  public async deleteMembers(projectId: string, memberIds: string[]): Promise<boolean> {
    const result = await this.projectMemberModel.deleteMany({
      projectId,
      memberId: {
        $in: memberIds
      }
    })
    return result?.n > 0
  }

  public async deleteMemberInProjects(projectIds: string[], memberId: string): Promise<boolean> {
    const result = await this.projectMemberModel.deleteMany({
      projectId: {
        $in: projectIds
      },
      memberId
    })
    return result?.n > 0
  }

  public async deleteAllMemberInProject(projectId: string): Promise<boolean> {
    const result = await this.projectMemberModel.deleteMany({
      projectId
    })
    return result?.n > 0
  }

  /**
   * Create a project for every new team
   */
  async createByNewTeam(teamId: string, ownerId: string, userName: string): Promise<void> {
    const projectId = await this.create({
      teamId,
      name: `${userName}'s project`,
      ownerId
    })

    // Link member with project
    await this.createMember({
      projectId,
      memberId: ownerId
    })
  }
}
