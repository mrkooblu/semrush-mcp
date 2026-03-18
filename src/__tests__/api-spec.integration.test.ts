/**
 * API Spec Regression Tests
 *
 * Loads the OpenAPI spec from src/api-spec.json and validates each endpoint
 * against the live Semrush API. For CSV endpoints, verifies that response
 * column headers match the spec. For JSON endpoints, verifies top-level keys.
 *
 * If a column is missing or unexpected columns appear, the test FAILS —
 * this means the upstream API changed and the spec needs updating.
 */
import axios from 'axios'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'

// ---------------------------------------------------------------------------
// Types for the spec structure
// ---------------------------------------------------------------------------

interface EndpointBase {
  operationId: string
  description: string
  baseUrl: string
  category: string
  testParams: Record<string, string | number>
  testPath?: string
  requiresTrends?: boolean
  verified: boolean
}

interface CsvEndpoint extends EndpointBase {
  responseFormat: 'csv' | 'text'
  responseColumns: string[]
  columnCodes: string[]
}

interface JsonEndpoint extends EndpointBase {
  responseFormat: 'json'
  responseSchema: {
    type: string
    properties?: Record<string, { type: string }>
    items?: { type: string; properties?: Record<string, { type: string }> }
  }
}

type Endpoint = CsvEndpoint | JsonEndpoint

interface ApiSpec {
  'x-endpoints': Endpoint[]
}

// ---------------------------------------------------------------------------
// Load spec from disk
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url))
const specPath = resolve(__dirname, '..', 'api-spec.json')
const spec: ApiSpec = JSON.parse(readFileSync(specPath, 'utf-8')) as ApiSpec
const endpoints = spec['x-endpoints']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const API_KEY = process.env.SEMRUSH_API_KEY ?? ''

function getTrendsPath(operationId: string): string {
  return operationId.replace(/^trends_/, '')
}

/**
 * Build the full URL for an endpoint based on its spec definition.
 */
function buildUrl(endpoint: Endpoint): string {
  if (endpoint.testPath) {
    return `${endpoint.baseUrl}${endpoint.testPath}`
  }

  if (endpoint.category === 'trends') {
    return `${endpoint.baseUrl}${getTrendsPath(endpoint.operationId)}`
  }

  return endpoint.baseUrl
}

/**
 * Make a raw API call based on the endpoint spec definition.
 * Uses axios directly (not SemrushApiClient) to test the raw API shape.
 */
async function callEndpoint(endpoint: Endpoint): Promise<string> {
  const url = buildUrl(endpoint)
  const params: Record<string, string | number> = {
    ...endpoint.testParams,
    key: API_KEY,
  }

  const response = await axios.get<string>(url, {
    params,
    transformResponse: [(data: string) => data],
    timeout: 25000,
  })

  return response.data
}

/**
 * Parse the first line (header) of a semicolon-delimited CSV response.
 */
function parseCsvHeaders(responseText: string): string[] {
  const firstLine = responseText.trim().split(/\r?\n/)[0]
  if (!firstLine) return []
  return firstLine.split(';')
}

/**
 * Parse JSON response and return top-level keys.
 * Handles both array responses (returns keys of first element) and objects.
 */
function parseJsonKeys(responseText: string): string[] {
  const parsed = JSON.parse(responseText) as unknown
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return []
    return Object.keys(parsed[0] as Record<string, unknown>).sort()
  }
  return Object.keys(parsed as Record<string, unknown>).sort()
}

// ---------------------------------------------------------------------------
// Group endpoints by category
// ---------------------------------------------------------------------------

const seoEndpoints = endpoints.filter(
  (e) =>
    e.category.startsWith('seo-') && e.responseFormat === 'csv' && e.operationId !== 'api_units'
)
const trendsEndpoints = endpoints.filter((e) => e.category === 'trends')
const projectEndpoints = endpoints.filter((e) => e.category === 'projects')
const siteAuditEndpoints = endpoints.filter((e) => e.category === 'site-audit')
const utilityEndpoints = endpoints.filter((e) => e.category === 'utility')

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

beforeAll(() => {
  if (!API_KEY) {
    throw new Error(
      'SEMRUSH_API_KEY is required for spec regression tests. Set it in your environment.'
    )
  }
})

describe('API Spec Regression Tests', () => {
  // ========================================================================
  // SEO Analytics (CSV endpoints)
  // ========================================================================

  describe('SEO Analytics', () => {
    for (const endpoint of seoEndpoints) {
      const ep = endpoint as CsvEndpoint

      it(`${ep.operationId} — response columns match spec`, async () => {
        const response = await callEndpoint(ep)
        const actualHeaders = parseCsvHeaders(response)

        console.log(
          `[PASS] ${ep.operationId}: ${actualHeaders.length} columns — ${actualHeaders.join(', ')}`
        )

        expect(actualHeaders).toEqual(ep.responseColumns)
      }, 30000)
    }
  })

  // ========================================================================
  // Trends API (CSV endpoints — may fail without .Trends subscription)
  // ========================================================================

  describe('Trends API', () => {
    for (const endpoint of trendsEndpoints) {
      const ep = endpoint as CsvEndpoint

      it(`${ep.operationId} — response columns match spec`, async () => {
        try {
          const response = await callEndpoint(ep)
          const actualHeaders = parseCsvHeaders(response)

          console.log(
            `[PASS] ${ep.operationId}: ${actualHeaders.length} columns — ${actualHeaders.join(', ')}`
          )

          expect(actualHeaders).toEqual(ep.responseColumns)
        } catch (error: any) {
          // Only skip on auth/subscription errors (401/403).
          // 400 errors may indicate a spec regression (wrong params) and should fail.
          const status = error?.response?.status ?? 0
          if (status === 403 || status === 401) {
            console.log(`[SKIP] ${ep.operationId}: Trends subscription required (HTTP ${status})`)
            return
          }
          throw error
        }
      }, 30000)
    }
  })

  // ========================================================================
  // Projects API (JSON endpoints)
  // ========================================================================

  describe('Projects API', () => {
    for (const endpoint of projectEndpoints) {
      const ep = endpoint as JsonEndpoint

      it(`${ep.operationId} — response keys match spec`, async () => {
        try {
          const response = await callEndpoint(ep)
          const actualKeys = parseJsonKeys(response)
          const expectedSchema = ep.responseSchema

          // Empty array responses are valid -- skip key assertions
          if (actualKeys.length === 0) {
            console.log(`[SKIP] ${ep.operationId}: empty response (no items to check keys)`)
            return
          }

          if (expectedSchema.type === 'array' && expectedSchema.items?.properties) {
            const expectedKeys = Object.keys(expectedSchema.items.properties).sort()
            expect(actualKeys).toEqual(expectedKeys)
            console.log(`[PASS] ${ep.operationId}: keys match ${expectedKeys.join(', ')}`)
          } else if (expectedSchema.properties) {
            const expectedKeys = Object.keys(expectedSchema.properties).sort()
            expect(actualKeys).toEqual(expectedKeys)
            console.log(`[PASS] ${ep.operationId}: keys match ${expectedKeys.join(', ')}`)
          }
        } catch (error: any) {
          const status = error?.response?.status ?? 0
          if (status === 404 || status === 403) {
            console.log(`[SKIP] ${ep.operationId}: endpoint not accessible (HTTP ${status})`)
            return
          }
          throw error
        }
      }, 30000)
    }
  })

  // ========================================================================
  // Site Audit API (JSON endpoints)
  // ========================================================================

  describe('Site Audit API', () => {
    for (const endpoint of siteAuditEndpoints) {
      const ep = endpoint as JsonEndpoint

      it(`${ep.operationId} — response keys match spec`, async () => {
        try {
          const response = await callEndpoint(ep)
          const actualKeys = parseJsonKeys(response)
          const expectedSchema = ep.responseSchema

          if (expectedSchema.properties) {
            const expectedKeys = Object.keys(expectedSchema.properties).sort()
            expect(actualKeys).toEqual(expectedKeys)
            console.log(`[PASS] ${ep.operationId}: keys match ${expectedKeys.join(', ')}`)
          }
        } catch (error: any) {
          const status = error?.response?.status ?? 0
          if (status === 404 || status === 403) {
            console.log(`[SKIP] ${ep.operationId}: endpoint not accessible (HTTP ${status})`)
            return
          }
          throw error
        }
      }, 30000)
    }
  })

  // ========================================================================
  // Utility
  // ========================================================================

  describe('Utility', () => {
    for (const endpoint of utilityEndpoints) {
      it(`${endpoint.operationId} — returns valid response`, async () => {
        const response = await callEndpoint(endpoint)
        const trimmed = response.trim()

        if (endpoint.operationId === 'api_units') {
          const balance = Number(trimmed)
          expect(Number.isFinite(balance)).toBe(true)
          expect(balance).toBeGreaterThanOrEqual(0)
          console.log(`[PASS] ${endpoint.operationId}: balance = ${balance}`)
        } else {
          expect(trimmed.length).toBeGreaterThan(0)
          console.log(`[PASS] ${endpoint.operationId}: non-empty response`)
        }
      }, 30000)
    }
  })
})
