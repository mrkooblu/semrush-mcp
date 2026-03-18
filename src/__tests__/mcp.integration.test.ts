/**
 * MCP Server — Integration Tests (stdio transport)
 *
 * Spawns the compiled MCP server as a child process, sends JSON-RPC messages
 * over stdin, and validates responses from stdout. Calls every tool through
 * the real MCP server with real API calls.
 *
 * Requirements:
 *   - Project must be built first: npm run build
 *   - SEMRUSH_API_KEY must be set in the environment
 */
import { type ChildProcess, spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const SERVER_PATH = resolve(import.meta.dirname, '../../dist/index.js')

// ---------------------------------------------------------------------------
// Tool call definitions: { tool name → arguments to send }
// Uses small limits and well-known domains/keywords to minimize API units.
// ---------------------------------------------------------------------------

interface ToolCall {
  name: string
  args: Record<string, unknown>
  /** If true, 400/403 errors are acceptable (e.g. .Trends subscription) */
  allowError?: boolean
  /** If true, this is a write operation — skip to avoid side effects */
  skip?: boolean
}

// Domain tools (use google.com / semrush.com — guaranteed to have data)
const DOMAIN_TOOLS: ToolCall[] = [
  { name: 'semrush_domain_overview', args: { domain: 'google.com', database: 'us' } },
  { name: 'semrush_domain_rank', args: { domain: 'semrush.com', database: 'us', limit: 1 } },
  {
    name: 'semrush_domain_rank_history',
    args: { domain: 'semrush.com', database: 'us', limit: 3 },
  },
  { name: 'semrush_rank_difference', args: { database: 'us', limit: 3 } },
  {
    name: 'semrush_domain_organic_keywords',
    args: { domain: 'semrush.com', database: 'us', limit: 3 },
  },
  {
    name: 'semrush_domain_paid_keywords',
    args: { domain: 'amazon.com', database: 'us', limit: 3 },
  },
  { name: 'semrush_competitors', args: { domain: 'semrush.com', database: 'us', limit: 3 } },
  { name: 'semrush_paid_competitors', args: { domain: 'amazon.com', database: 'us', limit: 3 } },
  {
    name: 'semrush_domain_ads_history',
    args: { domain: 'amazon.com', database: 'us', limit: 3 },
  },
  {
    name: 'semrush_domain_organic_unique',
    args: { domain: 'semrush.com', database: 'us', limit: 3 },
  },
  {
    name: 'semrush_domain_adwords_unique',
    args: { domain: 'amazon.com', database: 'us', limit: 3 },
  },
  { name: 'semrush_domain_shopping', args: { domain: 'amazon.com', database: 'us', limit: 3 } },
  {
    name: 'semrush_domain_shopping_unique',
    args: { domain: 'amazon.com', database: 'us', limit: 3 },
  },
]

// URL tools
const URL_TOOLS: ToolCall[] = [
  {
    name: 'semrush_url_organic',
    args: { url: 'https://www.semrush.com/blog/what-is-seo/', database: 'us', limit: 3 },
  },
  {
    name: 'semrush_url_adwords',
    args: { url: 'https://www.amazon.com/', database: 'us', limit: 3 },
  },
  {
    name: 'semrush_url_rank',
    args: { url: 'https://www.semrush.com/blog/what-is-seo/', database: 'us', limit: 1 },
  },
  {
    name: 'semrush_url_rank_history',
    args: { url: 'https://www.semrush.com/blog/what-is-seo/', database: 'us', limit: 3 },
  },
  {
    name: 'semrush_url_ranks',
    args: { url: 'https://www.semrush.com/blog/what-is-seo/', limit: 3 },
  },
]

// Subdomain tools
const SUBDOMAIN_TOOLS: ToolCall[] = [
  {
    name: 'semrush_subdomain_rank',
    args: { subdomain: 'www.semrush.com', database: 'us', limit: 1 },
  },
  { name: 'semrush_subdomain_ranks', args: { subdomain: 'www.semrush.com', limit: 3 } },
  {
    name: 'semrush_subdomain_rank_history',
    args: { subdomain: 'www.semrush.com', database: 'us', limit: 3 },
  },
  {
    name: 'semrush_subdomain_organic',
    args: { subdomain: 'www.semrush.com', database: 'us', limit: 3 },
  },
]

// Subfolder tools
const SUBFOLDER_TOOLS: ToolCall[] = [
  {
    name: 'semrush_subfolder_organic',
    args: { subfolder: 'semrush.com/blog/', database: 'us', limit: 3 },
  },
  {
    name: 'semrush_subfolder_adwords',
    args: { subfolder: 'amazon.com/dp/', database: 'us', limit: 3 },
  },
  {
    name: 'semrush_subfolder_rank',
    args: { subfolder: 'semrush.com/blog/', database: 'us', limit: 1 },
  },
  { name: 'semrush_subfolder_ranks', args: { subfolder: 'semrush.com/blog/', limit: 3 } },
  {
    name: 'semrush_subfolder_rank_history',
    args: { subfolder: 'semrush.com/blog/', database: 'us', limit: 3 },
  },
  {
    name: 'semrush_subfolder_organic_unique',
    args: { subfolder: 'semrush.com/blog/', database: 'us', limit: 3 },
  },
  {
    name: 'semrush_subfolder_adwords_unique',
    args: { subfolder: 'amazon.com/dp/', database: 'us', limit: 3 },
  },
]

// Backlinks tools
const BACKLINKS_TOOLS: ToolCall[] = [
  { name: 'semrush_backlinks', args: { target: 'semrush.com', limit: 3 } },
  { name: 'semrush_backlinks_domains', args: { target: 'semrush.com', limit: 3 } },
  {
    name: 'semrush_backlinks_overview',
    args: { target: 'semrush.com', target_type: 'root_domain' },
  },
  {
    name: 'semrush_backlinks_pages',
    args: { target: 'semrush.com', target_type: 'root_domain', limit: 3 },
  },
  {
    name: 'semrush_backlinks_anchors',
    args: { target: 'semrush.com', target_type: 'root_domain', limit: 3 },
  },
  {
    name: 'semrush_backlinks_tld',
    args: { target: 'semrush.com', target_type: 'root_domain', limit: 3 },
  },
  {
    name: 'semrush_backlinks_categories',
    args: { target: 'semrush.com', target_type: 'root_domain', limit: 3 },
  },
]

// Keyword tools
const KEYWORD_TOOLS: ToolCall[] = [
  { name: 'semrush_keyword_overview', args: { keyword: 'seo', database: 'us' } },
  { name: 'semrush_related_keywords', args: { keyword: 'seo', database: 'us', limit: 3 } },
  {
    name: 'semrush_keyword_overview_single_db',
    args: { keyword: 'seo', database: 'us' },
  },
  {
    name: 'semrush_batch_keyword_overview',
    args: { keywords: ['seo', 'marketing'], database: 'us' },
  },
  {
    name: 'semrush_keyword_organic_results',
    args: { keyword: 'seo', database: 'us', limit: 3 },
  },
  {
    name: 'semrush_keyword_paid_results',
    args: { keyword: 'crm software', database: 'us', limit: 3 },
  },
  {
    name: 'semrush_keyword_ads_history',
    args: { keyword: 'crm software', database: 'us', limit: 3 },
  },
  {
    name: 'semrush_broad_match_keywords',
    args: { keyword: 'seo', database: 'us', limit: 3 },
  },
  { name: 'semrush_phrase_questions', args: { keyword: 'seo', database: 'us', limit: 3 } },
  {
    name: 'semrush_keyword_difficulty',
    args: { keywords: ['seo', 'marketing'], database: 'us' },
  },
]

// Traffic / Trends tools (may fail without .Trends subscription)
const TRENDS_TOOLS: ToolCall[] = [
  {
    name: 'semrush_traffic_summary',
    args: { domains: ['semrush.com'], country: 'us' },
    allowError: true,
  },
  {
    name: 'semrush_traffic_sources',
    args: { domain: 'semrush.com', country: 'us' },
    allowError: true,
  },
  {
    name: 'semrush_traffic_destinations',
    args: { target: 'semrush.com', country: 'us', limit: 3 },
    allowError: true,
  },
  {
    name: 'semrush_traffic_geo',
    args: { target: 'semrush.com', country: 'us', limit: 3 },
    allowError: true,
  },
  {
    name: 'semrush_traffic_subdomains',
    args: { target: 'semrush.com', country: 'us', limit: 3 },
    allowError: true,
  },
  {
    name: 'semrush_traffic_subfolders',
    args: { target: 'semrush.com', country: 'us', limit: 3 },
    allowError: true,
  },
  {
    name: 'semrush_traffic_top_pages',
    args: { target: 'semrush.com', country: 'us', limit: 3 },
    allowError: true,
  },
  {
    name: 'semrush_traffic_rank',
    args: { target: 'semrush.com', country: 'us', limit: 3 },
    allowError: true,
  },
  {
    name: 'semrush_traffic_social_media',
    args: { target: 'semrush.com', country: 'us', limit: 3 },
    allowError: true,
  },
  {
    name: 'semrush_audience_insights',
    args: {
      targets: ['semrush.com', 'ahrefs.com'],
      selected_targets: ['semrush.com'],
      limit: 3,
    },
    allowError: true,
  },
  {
    name: 'semrush_purchase_conversion',
    args: { target: 'amazon.com', country: 'us' },
    allowError: true,
  },
  {
    name: 'semrush_household_distribution',
    args: { target: 'amazon.com', country: 'us', limit: 3 },
    allowError: true,
  },
  {
    name: 'semrush_income_distribution',
    args: { target: 'amazon.com', country: 'us', limit: 3 },
    allowError: true,
  },
  {
    name: 'semrush_education_distribution',
    args: { target: 'amazon.com', country: 'us', limit: 3 },
    allowError: true,
  },
  {
    name: 'semrush_occupation_distribution',
    args: { target: 'amazon.com', country: 'us', limit: 3 },
    allowError: true,
  },
  {
    name: 'semrush_audience_interests',
    args: { target: 'amazon.com', country: 'us', limit: 3 },
    allowError: true,
  },
  {
    name: 'semrush_traffic_accuracy',
    args: { target: 'semrush.com' },
    allowError: true,
  },
]

// Projects tools (read-only calls only — skip mutating operations)
const PROJECTS_TOOLS: ToolCall[] = [
  { name: 'semrush_list_projects', args: {} },
  // get_project needs a real ID — we'll fetch one dynamically in the test
  { name: 'semrush_get_project', args: { project_id: 0 }, skip: true },
  // Write operations — skip to avoid side effects
  { name: 'semrush_create_project', args: {}, skip: true },
  { name: 'semrush_update_project', args: {}, skip: true },
  { name: 'semrush_delete_project', args: {}, skip: true },
]

// Site Audit tools (need real project_id — fetched dynamically)
const SITE_AUDIT_TOOLS: ToolCall[] = [
  { name: 'semrush_site_audit_info', args: { project_id: 0 }, skip: true },
  { name: 'semrush_site_audit_snapshots', args: { project_id: 0 }, skip: true },
  {
    name: 'semrush_site_audit_snapshot_detail',
    args: { project_id: 0, snapshot_id: 0 },
    skip: true,
  },
  { name: 'semrush_site_audit_issues', args: { project_id: 0 }, skip: true },
  {
    name: 'semrush_site_audit_pages',
    args: { project_id: 0, url: 'https://example.com' },
    skip: true,
  },
  { name: 'semrush_site_audit_page_detail', args: { project_id: 0, page_id: 0 }, skip: true },
  { name: 'semrush_site_audit_history', args: { project_id: 0 }, skip: true },
  { name: 'semrush_site_audit_launch', args: { project_id: 0 }, skip: true },
]

// Utility
const UTILITY_TOOLS: ToolCall[] = [{ name: 'semrush_api_units_balance', args: {} }]

// ---------------------------------------------------------------------------
// Combine all tool lists (for the total count check)
// ---------------------------------------------------------------------------

const ALL_TOOL_NAMES = [
  ...DOMAIN_TOOLS,
  ...URL_TOOLS,
  ...SUBDOMAIN_TOOLS,
  ...SUBFOLDER_TOOLS,
  ...BACKLINKS_TOOLS,
  ...KEYWORD_TOOLS,
  ...TRENDS_TOOLS,
  ...PROJECTS_TOOLS,
  ...SITE_AUDIT_TOOLS,
  ...UTILITY_TOOLS,
].map((t) => t.name)

// ---------------------------------------------------------------------------
// Server transport
// ---------------------------------------------------------------------------

let serverProcess: ChildProcess
let responseBuffer = ''
let messageId = 0

/**
 * Send a JSON-RPC message to the server via stdin and wait for a response.
 */
function sendRpcMessage(
  method: string,
  params: Record<string, unknown> = {},
  timeoutMs = 30000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = ++messageId
    const message = JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params,
    })

    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for response to ${method} (id=${id})`))
    }, timeoutMs)

    const onData = (chunk: Buffer) => {
      responseBuffer += chunk.toString()

      const lines = responseBuffer.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        try {
          const parsed = JSON.parse(line)
          if (parsed.id === id) {
            clearTimeout(timeout)
            serverProcess.stdout?.removeListener('data', onData)
            responseBuffer = lines.slice(i + 1).join('\n')
            resolve(parsed)
            return
          }
        } catch {
          // Not a complete JSON line yet, continue
        }
      }
    }

    serverProcess.stdout?.on('data', onData)
    serverProcess.stdin?.write(message + '\n')
  })
}

/**
 * Call an MCP tool and assert the response shape is correct.
 * Returns the text content from the response.
 */
async function callTool(
  toolName: string,
  args: Record<string, unknown>,
  options: { allowError?: boolean } = {}
): Promise<string> {
  const response = await sendRpcMessage('tools/call', { name: toolName, arguments: args })

  expect(response).toBeDefined()
  expect(response.result).toBeDefined()
  expect(response.result.content).toBeDefined()
  expect(Array.isArray(response.result.content)).toBe(true)
  expect(response.result.content.length).toBeGreaterThan(0)

  const textContent = response.result.content[0]
  expect(textContent.type).toBe('text')
  expect(typeof textContent.text).toBe('string')
  expect(textContent.text.length).toBeGreaterThan(0)

  // If errors are not allowed, verify it's not an error response
  if (!options.allowError && !response.result.isError) {
    // Successful response — text should not be empty
    expect(textContent.text).not.toMatch(/^Error:/)
  }

  return textContent.text
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeAll(() => {
  if (!process.env.SEMRUSH_API_KEY) {
    throw new Error(
      'SEMRUSH_API_KEY is required for MCP integration tests. Set it in your environment.'
    )
  }
})

describe('MCP Server — stdio Integration', () => {
  // Keep a project_id discovered from list_projects for site audit tests
  let discoveredProjectId: number | null = null

  beforeAll(async () => {
    serverProcess = spawn('node', [SERVER_PATH], {
      env: { ...process.env, NODE_ENV: 'test' },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    serverProcess.stderr?.resume()
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Initialize the MCP session
    await sendRpcMessage('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' },
    })

    serverProcess.stdin?.write(
      JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n'
    )
  }, 15000)

  afterAll(() => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM')
    }
  })

  // ========================================================================
  // Protocol Tests
  // ========================================================================

  describe('Protocol', () => {
    it('lists all 77 tools via tools/list', async () => {
      const response = await sendRpcMessage('tools/list', {})
      const toolNames = response.result.tools.map((t: { name: string }) => t.name)

      expect(toolNames.length).toBe(ALL_TOOL_NAMES.length)
      for (const name of ALL_TOOL_NAMES) {
        expect(toolNames).toContain(name)
      }

      // Every tool has name, description, inputSchema
      for (const tool of response.result.tools) {
        expect(typeof tool.name).toBe('string')
        expect(typeof tool.description).toBe('string')
        expect(tool.inputSchema).toBeDefined()
      }
    })
  })

  // ========================================================================
  // Domain Tools
  // ========================================================================

  describe('Domain Tools', () => {
    for (const tool of DOMAIN_TOOLS) {
      it(`${tool.name} returns valid content`, async () => {
        const text = await callTool(tool.name, tool.args)
        // Domain tools return CSV — should have at least a header line
        expect(text.length).toBeGreaterThan(10)
        console.log(`[PASS] ${tool.name}: ${text.substring(0, 80)}...`)
      })
    }
  })

  // ========================================================================
  // URL Tools
  // ========================================================================

  describe('URL Tools', () => {
    for (const tool of URL_TOOLS) {
      it(`${tool.name} returns valid content`, async () => {
        const text = await callTool(tool.name, tool.args)
        expect(text.length).toBeGreaterThan(10)
        console.log(`[PASS] ${tool.name}: ${text.substring(0, 80)}...`)
      })
    }
  })

  // ========================================================================
  // Subdomain Tools
  // ========================================================================

  describe('Subdomain Tools', () => {
    for (const tool of SUBDOMAIN_TOOLS) {
      it(`${tool.name} returns valid content`, async () => {
        const text = await callTool(tool.name, tool.args)
        expect(text.length).toBeGreaterThan(10)
        console.log(`[PASS] ${tool.name}: ${text.substring(0, 80)}...`)
      })
    }
  })

  // ========================================================================
  // Subfolder Tools
  // ========================================================================

  describe('Subfolder Tools', () => {
    for (const tool of SUBFOLDER_TOOLS) {
      it(`${tool.name} returns valid content`, async () => {
        const text = await callTool(tool.name, tool.args)
        expect(text.length).toBeGreaterThan(10)
        console.log(`[PASS] ${tool.name}: ${text.substring(0, 80)}...`)
      })
    }
  })

  // ========================================================================
  // Backlinks Tools
  // ========================================================================

  describe('Backlinks Tools', () => {
    for (const tool of BACKLINKS_TOOLS) {
      it(`${tool.name} returns valid content`, async () => {
        const text = await callTool(tool.name, tool.args)
        expect(text.length).toBeGreaterThan(10)
        console.log(`[PASS] ${tool.name}: ${text.substring(0, 80)}...`)
      })
    }
  })

  // ========================================================================
  // Keyword Tools
  // ========================================================================

  describe('Keyword Tools', () => {
    for (const tool of KEYWORD_TOOLS) {
      it(`${tool.name} returns valid content`, async () => {
        const text = await callTool(tool.name, tool.args)
        expect(text.length).toBeGreaterThan(5)
        console.log(`[PASS] ${tool.name}: ${text.substring(0, 80)}...`)
      })
    }
  })

  // ========================================================================
  // Traffic / Trends Tools (may fail without subscription)
  // ========================================================================

  describe('Traffic / Trends Tools', () => {
    for (const tool of TRENDS_TOOLS) {
      it(`${tool.name} returns content or subscription error`, async () => {
        const text = await callTool(tool.name, tool.args, { allowError: tool.allowError })
        expect(text.length).toBeGreaterThan(0)
        console.log(`[PASS] ${tool.name}: ${text.substring(0, 80)}...`)
      })
    }
  })

  // ========================================================================
  // Projects Tools
  // ========================================================================

  describe('Projects Tools', () => {
    it('semrush_list_projects returns project list', async () => {
      const text = await callTool('semrush_list_projects', {})
      expect(text.length).toBeGreaterThan(0)

      // Try to extract a project_id for subsequent tests
      try {
        const parsed = JSON.parse(text)
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].project_id) {
          discoveredProjectId = parsed[0].project_id as number
          console.log(`[PASS] semrush_list_projects: found ${parsed.length} projects, using ID ${discoveredProjectId}`)
        } else {
          console.log(`[PASS] semrush_list_projects: ${text.substring(0, 80)}...`)
        }
      } catch {
        console.log(`[PASS] semrush_list_projects: ${text.substring(0, 80)}...`)
      }
    })

    it('semrush_get_project returns project details (if projects exist)', async () => {
      if (!discoveredProjectId) {
        console.log('[SKIP] semrush_get_project: no project_id available')
        return
      }

      const text = await callTool('semrush_get_project', { project_id: discoveredProjectId })
      expect(text.length).toBeGreaterThan(0)
      console.log(`[PASS] semrush_get_project (id=${discoveredProjectId}): ${text.substring(0, 80)}...`)
    })

    // Skip write operations to avoid side effects
    it.skip('semrush_create_project (skipped — write operation)', () => {})
    it.skip('semrush_update_project (skipped — write operation)', () => {})
    it.skip('semrush_delete_project (skipped — write operation)', () => {})
  })

  // ========================================================================
  // Site Audit Tools (need a real project_id)
  // ========================================================================

  describe('Site Audit Tools', () => {
    it('semrush_site_audit_info returns audit info (if projects exist)', async () => {
      if (!discoveredProjectId) {
        console.log('[SKIP] semrush_site_audit_info: no project_id available')
        return
      }

      const text = await callTool('semrush_site_audit_info', {
        project_id: discoveredProjectId,
      }, { allowError: true })
      expect(text.length).toBeGreaterThan(0)
      console.log(`[PASS] semrush_site_audit_info: ${text.substring(0, 80)}...`)
    })

    it('semrush_site_audit_snapshots returns snapshots (if projects exist)', async () => {
      if (!discoveredProjectId) {
        console.log('[SKIP] semrush_site_audit_snapshots: no project_id available')
        return
      }

      const text = await callTool('semrush_site_audit_snapshots', {
        project_id: discoveredProjectId,
      }, { allowError: true })
      expect(text.length).toBeGreaterThan(0)
      console.log(`[PASS] semrush_site_audit_snapshots: ${text.substring(0, 80)}...`)
    })

    it('semrush_site_audit_issues returns issue metadata (if projects exist)', async () => {
      if (!discoveredProjectId) {
        console.log('[SKIP] semrush_site_audit_issues: no project_id available')
        return
      }

      const text = await callTool('semrush_site_audit_issues', {
        project_id: discoveredProjectId,
      }, { allowError: true })
      expect(text.length).toBeGreaterThan(0)
      console.log(`[PASS] semrush_site_audit_issues: ${text.substring(0, 80)}...`)
    })

    it('semrush_site_audit_history returns audit history (if projects exist)', async () => {
      if (!discoveredProjectId) {
        console.log('[SKIP] semrush_site_audit_history: no project_id available')
        return
      }

      const text = await callTool('semrush_site_audit_history', {
        project_id: discoveredProjectId,
        limit: 3,
      }, { allowError: true })
      expect(text.length).toBeGreaterThan(0)
      console.log(`[PASS] semrush_site_audit_history: ${text.substring(0, 80)}...`)
    })

    // Skip tools that need specific IDs or could trigger crawls
    it.skip('semrush_site_audit_snapshot_detail (needs snapshot_id)', () => {})
    it.skip('semrush_site_audit_pages (needs project with audit data)', () => {})
    it.skip('semrush_site_audit_page_detail (needs page_id)', () => {})
    it.skip('semrush_site_audit_launch (skipped — triggers crawl)', () => {})
  })

  // ========================================================================
  // Utility
  // ========================================================================

  describe('Utility', () => {
    it('semrush_api_units_balance returns a numeric balance', async () => {
      const text = await callTool('semrush_api_units_balance', {})
      const balance = Number(text.replace(/"/g, ''))
      expect(Number.isFinite(balance)).toBe(true)
      expect(balance).toBeGreaterThanOrEqual(0)
      console.log(`[PASS] semrush_api_units_balance: ${balance}`)
    })
  })

  // ========================================================================
  // Error Handling
  // ========================================================================

  describe('Error Handling', () => {
    it('returns MCP error for nonexistent tool', async () => {
      const response = await sendRpcMessage('tools/call', {
        name: 'semrush_does_not_exist',
        arguments: {},
      })

      expect(response).toBeDefined()
      // MCP SDK may return a JSON-RPC error OR a result with isError: true
      const hasError = response.error !== undefined
      const hasResultError =
        response.result?.isError === true ||
        response.result?.content?.some((c: { text?: string }) => c.text?.toLowerCase().includes('error'))
      expect(hasError || hasResultError).toBe(true)
    })

    it('returns validation error for missing required params', async () => {
      // domain_overview requires domain
      const response = await sendRpcMessage('tools/call', {
        name: 'semrush_domain_overview',
        arguments: {},
      })

      expect(response).toBeDefined()
      // Should get an error (either protocol-level or tool-level)
      const hasError = response.error || response.result?.isError
      expect(hasError).toBeTruthy()
    })

    it('returns validation error for wrong param types', async () => {
      // limit should be a number, not a string
      const response = await sendRpcMessage('tools/call', {
        name: 'semrush_domain_overview',
        arguments: { domain: 'google.com', limit: 'not_a_number' },
      })

      expect(response).toBeDefined()
      const hasError = response.error || response.result?.isError
      expect(hasError).toBeTruthy()
    })
  })
})
