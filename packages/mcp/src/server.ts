import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { HeyFormClient } from './client'
import { registerTools } from './tools'

export function createServer(client: HeyFormClient): McpServer {
  const server = new McpServer({ name: 'heyform', version: '0.1.0' })

  registerTools(server, client)

  return server
}
