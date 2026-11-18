import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import { HeyFormClient } from './client'
import { createServer } from './server'

async function main() {
  const baseUrl = process.env.HEYFORM_URL
  const email = process.env.HEYFORM_EMAIL
  const password = process.env.HEYFORM_PASSWORD

  if (!baseUrl || !email || !password) {
    console.error('HEYFORM_URL, HEYFORM_EMAIL and HEYFORM_PASSWORD must be set')
    process.exit(1)
  }

  const server = createServer(new HeyFormClient({ baseUrl, email, password }))

  await server.connect(new StdioServerTransport())
}

main().catch(err => {
  // stdout carries the MCP protocol, so log to stderr only
  console.error(err)
  process.exit(1)
})
