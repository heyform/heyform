import { Auth } from '@decorator'
import { PlanType } from '@graphql'
import { PlanModel } from '@model'
import { Query, Resolver } from '@nestjs/graphql'
import { PlanService } from '@service'

@Resolver()
@Auth()
export class PlansResolver {
  constructor(private readonly planService: PlanService) {}

  @Query(returns => [PlanType])
  async plans(): Promise<PlanModel[]> {
    return this.planService.findAllActive()
  }
}
