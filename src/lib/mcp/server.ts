/**
 * MCP Server factory — creates a configured McpServer instance with all
 * tools, resources, and prompts registered.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { registerReadTools } from './tools-read'
import { registerWriteTools } from './tools-write'
import { registerResources } from './resources'
import { registerPrompts } from './prompts'

export function createMcpServer(supabaseClient: SupabaseClient, userEmail: string): McpServer {
  const getClient = () => supabaseClient
  const getUserEmail = () => userEmail

  const server = new McpServer({
    name: 'nodiac-tracker',
    version: '1.0.0',
  })

  registerReadTools(server, getClient)
  registerWriteTools(server, getClient, getUserEmail)
  registerResources(server)
  registerPrompts(server)

  return server
}
