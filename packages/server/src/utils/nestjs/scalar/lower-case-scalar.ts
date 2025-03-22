import { CustomScalar, Scalar } from '@nestjs/graphql'
import { Kind, ValueNode } from 'graphql'

export class LowerCase extends String {}

@Scalar('LowerCase', () => LowerCase)
export class LowerCaseScalar implements CustomScalar<string, LowerCase> {
  description = 'Lower string custom scalar type'

  parseValue(value: string): LowerCase {
    return value.toLowerCase()
  }

  serialize(value: LowerCase): string {
    return value.toString()
  }

  parseLiteral(ast: ValueNode): LowerCase | null {
    if (ast.kind === Kind.STRING) {
      return ast.value.toLowerCase()
    }
    return null
  }
}
