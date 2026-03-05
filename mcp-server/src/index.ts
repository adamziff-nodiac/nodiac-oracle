#!/usr/bin/env bun
/**
 * Nodiac Tracker MCP Server
 *
 * Exposes the portfolio tracker database to Claude via the Model Context
 * Protocol. Authenticates users via Google OAuth through Supabase (same
 * sign-in flow as the web app).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... bun run src/index.ts
 *
 * Or configure in Claude Desktop's config:
 *   {
 *     "mcpServers": {
 *       "nodiac-tracker": {
 *         "command": "bun",
 *         "args": ["run", "/path/to/mcp-server/src/index.ts"],
 *         "env": {
 *           "SUPABASE_URL": "...",
 *           "SUPABASE_PUBLISHABLE_KEY": "..."
 *         }
 *       }
 *     }
 *   }
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getAuthenticatedClient } from './auth.js'
import { registerReadTools } from './tools-read.js'
import { registerWriteTools } from './tools-write.js'
import { registerResources } from './resources.js'
import { registerPrompts } from './prompts.js'

function log(msg: string) {
  process.stderr.write(`[nodiac-mcp] ${msg}\n`)
}

async function main() {
  log('Starting Nodiac Tracker MCP server...')

  // Authenticate with Supabase (cached session or browser OAuth)
  let supabaseClient: SupabaseClient
  try {
    supabaseClient = await getAuthenticatedClient()
  } catch (err) {
    log(`Authentication failed: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }

  // Accessor function so tools always get the current client
  const getClient = () => supabaseClient

  // Create the MCP server
  const server = new McpServer({
    name: 'nodiac-tracker',
    version: '1.0.0',
  })

  // Register all capabilities
  registerReadTools(server, getClient)
  registerWriteTools(server, getClient)
  registerResources(server)
  registerPrompts(server)

  // Connect via stdio
  const transport = new StdioServerTransport()
  await server.connect(transport)

  log('MCP server connected and ready.')
}

main().catch((err) => {
  log(`Fatal error: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
