/**
 * MCP Prompts — reusable workflow templates for common operations.
 */
import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export function registerPrompts(server: McpServer) {

  server.prompt(
    'portfolio-review',
    'Generate a comprehensive portfolio review with priorities, blockers, and recommendations.',
    {},
    async () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Please generate a portfolio review by following these steps:

1. Call get_portfolio_summary to get the high-level numbers
2. Call list_sites to see all active sites
3. Identify any sites with "Blocked" phase statuses
4. For each blocked site, call get_site to understand what's blocking it
5. Call get_recent_activity with limit=10 to see what's been happening

Then write a structured review covering:
- Portfolio overview (total sites, MW, capex)
- Progress by priority tier (Lead, Active, Pipeline)
- Blocked items requiring attention (with specific next steps)
- Recent activity highlights
- Recommended next actions`,
        },
      }],
    })
  )

  server.prompt(
    'site-status-update',
    'Walk through updating all relevant checkpoints on a specific site.',
    {
      site_name: z.string().describe('The name of the site to update'),
    },
    async ({ site_name }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `I need to do a status update on the site "${site_name}". Please:

1. Call list_sites to find this site by name
2. Call get_site with the site_id to see all current checkpoint statuses
3. Present the current status in a clear table format, grouped by phase
4. Ask me which checkpoints need updating
5. For each update I provide, use update_checkpoint with the correct values
6. After all updates, call get_site again to show the final state

Remember to check the tracker-schema resource for valid enum values before making updates.`,
        },
      }],
    })
  )

  server.prompt(
    'log-meeting-notes',
    'Parse meeting notes and log activities against the relevant sites.',
    {},
    async () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `I'm going to paste meeting notes. Please help me log them properly:

1. Read through the notes I provide
2. Identify which sites are mentioned (use list_sites to match names)
3. For each site mentioned, extract the relevant updates
4. Use log_activity to create an activity entry for each site with:
   - title: Brief summary of what was discussed about this site
   - summary: Detailed notes relevant to this site
   - source: "meeting"
5. If any checkpoint changes were discussed, ask me if I want to apply them using update_checkpoint
6. Summarize what was logged at the end`,
        },
      }],
    })
  )
}
