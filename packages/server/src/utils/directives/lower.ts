import { SchemaDirectiveVisitor } from 'apollo-server'
import { GraphQLField, defaultFieldResolver } from 'graphql'

export class LowerCaseDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field
    field.resolve = async function (...args) {
      const result = await resolve.apply(this, args)
      if (typeof result === 'string') {
        return result.toLowerCase()
      }
      return result
    }
  }
}
