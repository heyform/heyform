import { Field, InputType, ObjectType } from '@nestjs/graphql'

import { FormDetailInput } from './form.graphql'

@InputType()
export class ConnectStripeInput extends FormDetailInput {
  @Field()
  state: string

  @Field()
  code: string
}

@ObjectType()
export class ConnectStripeType {
  @Field()
  accountId: string

  @Field()
  email: string
}
