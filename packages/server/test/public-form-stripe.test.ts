import assert from 'assert'

// The resolver reads the key when it's loaded, so load it only after setting the key
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_1'

async function resolve(form: Record<string, any>) {
  const { PublicFormResolver } = await import('../src/resolver/form/form-detail.resolver')
  const resolver = new PublicFormResolver(
    {
      findPublicForm: async () => ({
        id: 'form_1',
        teamId: 'team_1',
        projectId: 'project_1',
        settings: { active: true },
        ...form
      })
    } as any,
    { findPageConfigs: async () => ({}) } as any
  )

  return resolver.publicForm({ formId: 'form_1' } as any)
}

async function testFormWithoutStripeAccountHasNoStripe() {
  const result = await resolve({})

  // PublicStripeAccountType's fields are non-nullable: a partial object fails the whole query
  assert.strictEqual(result.stripe, undefined)
}

async function testFormWithStripeAccountGetsAccountAndKeyOnly() {
  const result = await resolve({
    stripeAccount: { accountId: 'acct_1', email: 'owner@example.com' }
  })

  assert.deepStrictEqual(result.stripe, { accountId: 'acct_1', publishableKey: 'pk_test_1' })
}

async function run() {
  await testFormWithoutStripeAccountHasNoStripe()
  await testFormWithStripeAccountGetsAccountAndKeyOnly()
}

if (require.main === module) {
  run().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  })
}
