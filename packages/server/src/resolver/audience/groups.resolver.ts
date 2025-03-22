import { Auth, TeamGuard } from '@decorator'
import { GroupsInput, GroupsResultType } from '@graphql'
import { helper } from '@heyform-inc/utils'
import { Args, Query, Resolver } from '@nestjs/graphql'
import { ContactService, GroupService } from '@service'

@Resolver()
@Auth()
export class GroupsResolver {
  constructor(
    private readonly contactService: ContactService,
    private readonly groupService: GroupService
  ) {}

  @TeamGuard()
  @Query(returns => GroupsResultType)
  async groups(@Args('input') input: GroupsInput): Promise<GroupsResultType> {
    const total = await this.groupService.count(input.teamId, input.keyword)
    let groups: any[] = []

    if (total > 0) {
      const [maps, tmpGroups] = await Promise.all([
        this.contactService.countInGroups(input.teamId),
        this.groupService.findAll(
          input.teamId,
          input.keyword,
          input.page,
          input.limit
        )
      ])

      groups = tmpGroups.map(row => {
        const t = maps.find(m => helper.isEqual(m._id, row.id))
        row.contactCount = t?.count ?? 0
        return row
      })
    }

    return {
      total,
      groups
    }
  }
}
