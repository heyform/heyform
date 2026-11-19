// Workspace-facing API features are opt-in. These flags do not disable REST bearer access.
export function restApiUiFeatures(env: NodeJS.ProcessEnv = process.env) {
  const enabled = env.HEYFORM_REST_API_UI_ENABLED === 'true'
  return {
    enabled,
    swagger: enabled && env.HEYFORM_REST_API_SWAGGER_ENABLED === 'true',
    keyManagement: enabled && env.HEYFORM_REST_API_KEY_MANAGEMENT_ENABLED === 'true'
  }
}
