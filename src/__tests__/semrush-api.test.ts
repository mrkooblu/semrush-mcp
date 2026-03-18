/**
 * Semrush API Client — Unit Tests (Mocked)
 *
 * All HTTP calls are mocked via vi.mock('axios').
 * These tests run WITHOUT an API key.
 */
import axios, { AxiosError } from 'axios'
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SemrushApiClient, SemrushApiError } from '../semrush-api.js'
import {
  MOCK_API_UNITS_BALANCE,
  MOCK_BACKLINKS_ANCHORS_CSV,
  MOCK_BACKLINKS_CATEGORIES_CSV,
  MOCK_BACKLINKS_CSV,
  MOCK_BACKLINKS_DOMAINS_CSV,
  MOCK_BACKLINKS_OVERVIEW_CSV,
  MOCK_BACKLINKS_PAGES_CSV,
  MOCK_BACKLINKS_TLD_CSV,
  MOCK_BATCH_KEYWORD_CSV,
  MOCK_BROAD_MATCH_CSV,
  MOCK_COMPETITORS_CSV,
  MOCK_DOMAIN_ADS_HISTORY_CSV,
  MOCK_DOMAIN_ADWORDS_UNIQUE_CSV,
  MOCK_DOMAIN_ORGANIC_KEYWORDS_CSV,
  MOCK_DOMAIN_ORGANIC_UNIQUE_CSV,
  MOCK_DOMAIN_OVERVIEW_CSV,
  MOCK_DOMAIN_PAID_KEYWORDS_CSV,
  MOCK_DOMAIN_RANK_CSV,
  MOCK_DOMAIN_RANK_HISTORY_CSV,
  MOCK_DOMAIN_SHOPPING_CSV,
  MOCK_DOMAIN_SHOPPING_UNIQUE_CSV,
  MOCK_KEYWORD_ADS_HISTORY_CSV,
  MOCK_KEYWORD_DIFFICULTY_CSV,
  MOCK_KEYWORD_ORGANIC_RESULTS_CSV,
  MOCK_KEYWORD_OVERVIEW_CSV,
  MOCK_KEYWORD_PAID_RESULTS_CSV,
  MOCK_KEYWORD_SINGLE_DB_CSV,
  MOCK_PAID_COMPETITORS_CSV,
  MOCK_PHRASE_QUESTIONS_CSV,
  MOCK_PROJECTS_LIST_JSON,
  MOCK_PROJECT_JSON,
  MOCK_RANK_DIFFERENCE_CSV,
  MOCK_RELATED_KEYWORDS_CSV,
  MOCK_SITE_AUDIT_HISTORY_JSON,
  MOCK_SITE_AUDIT_INFO_JSON,
  MOCK_SITE_AUDIT_ISSUES_JSON,
  MOCK_SITE_AUDIT_LAUNCH_JSON,
  MOCK_SITE_AUDIT_PAGES_JSON,
  MOCK_SITE_AUDIT_PAGE_DETAIL_JSON,
  MOCK_SITE_AUDIT_SNAPSHOTS_JSON,
  MOCK_SITE_AUDIT_SNAPSHOT_DETAIL_JSON,
  MOCK_SUBDOMAIN_ORGANIC_CSV,
  MOCK_SUBDOMAIN_RANKS_CSV,
  MOCK_SUBDOMAIN_RANK_CSV,
  MOCK_SUBDOMAIN_RANK_HISTORY_CSV,
  MOCK_SUBFOLDER_ADWORDS_CSV,
  MOCK_SUBFOLDER_ADWORDS_UNIQUE_CSV,
  MOCK_SUBFOLDER_ORGANIC_CSV,
  MOCK_SUBFOLDER_ORGANIC_UNIQUE_CSV,
  MOCK_SUBFOLDER_RANKS_CSV,
  MOCK_SUBFOLDER_RANK_CSV,
  MOCK_SUBFOLDER_RANK_HISTORY_CSV,
  MOCK_TRAFFIC_SOURCES_JSON,
  MOCK_TRAFFIC_SUMMARY_JSON,
  MOCK_TRENDS_ACCURACY_CSV,
  MOCK_TRENDS_AUDIENCE_INSIGHTS_CSV,
  MOCK_TRENDS_AUDIENCE_INTERESTS_CSV,
  MOCK_TRENDS_DESTINATIONS_CSV,
  MOCK_TRENDS_EDUCATION_CSV,
  MOCK_TRENDS_GEO_CSV,
  MOCK_TRENDS_HOUSEHOLD_CSV,
  MOCK_TRENDS_INCOME_CSV,
  MOCK_TRENDS_OCCUPATION_CSV,
  MOCK_TRENDS_PURCHASE_CONVERSION_CSV,
  MOCK_TRENDS_RANK_CSV,
  MOCK_TRENDS_SOCIAL_MEDIA_CSV,
  MOCK_TRENDS_SUBDOMAINS_CSV,
  MOCK_TRENDS_SUBFOLDERS_CSV,
  MOCK_TRENDS_TOPPAGES_CSV,
  MOCK_URL_ADWORDS_CSV,
  MOCK_URL_ORGANIC_CSV,
  MOCK_URL_RANKS_CSV,
  MOCK_URL_RANK_CSV,
  MOCK_URL_RANK_HISTORY_CSV,
  assertHasData,
  assertValidResponse,
  createMockAxiosResponse,
} from './test-utils.js'

// Mock axios — the API client calls `axios({...})` as a function (default export)
vi.mock('axios', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  const mockFn = vi.fn()
  // Preserve AxiosError class so `instanceof AxiosError` works
  return {
    ...actual,
    default: Object.assign(mockFn, {
      ...actual.default,
    }),
  }
})

// Mock node-cache to avoid module-level cache interference between tests
vi.mock('node-cache', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      const store = new Map<string, { value: unknown; ttl: number }>()
      return {
        get: vi.fn((key: string) => store.get(key)?.value),
        set: vi.fn((key: string, value: unknown) => {
          store.set(key, { value, ttl: 300 })
          return true
        }),
        del: vi.fn((key: string) => store.delete(key)),
        flushAll: vi.fn(() => store.clear()),
        keys: vi.fn(() => [...store.keys()]),
      }
    }),
  }
})

// Helper: cast mocked axios default as a callable Mock
const mockedAxios = axios as unknown as Mock

/**
 * Create a proper AxiosError instance so `instanceof AxiosError` works
 * inside the API client's catch block.
 */
function createAxiosError(status: number, message: string): AxiosError {
  const error = new AxiosError(
    `Request failed with status code ${status}`,
    String(status),
    undefined,
    undefined,
    {
      status,
      data: { error: { message } },
      statusText: 'Error',
      headers: {},
      config: { headers: {} },
    } as any
  )
  return error
}

describe('SemrushApiClient — Unit Tests', () => {
  let client: SemrushApiClient
  const TEST_API_KEY = 'test-api-key-unit-tests'

  // Unique call counter to make cache keys unique per test
  let callId = 0

  beforeEach(() => {
    client = new SemrushApiClient(TEST_API_KEY)
    vi.clearAllMocks()
    callId++
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // Constructor
  // ==========================================================================

  describe('Constructor', () => {
    it('throws if API key is empty string', () => {
      expect(() => new SemrushApiClient('')).toThrow('Semrush API key is required')
    })

    it('accepts a valid API key', () => {
      expect(() => new SemrushApiClient('valid-key-123')).not.toThrow()
    })
  })

  // ==========================================================================
  // API Method Response Shapes — Original 19 methods
  // ==========================================================================

  describe('API Methods — Response Shapes', () => {
    function mockSuccess(data: string) {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(data))
    }

    it('getDomainOverview returns expected shape', async () => {
      mockSuccess(MOCK_DOMAIN_OVERVIEW_CSV)
      const result = await client.getDomainOverview(`shape-${callId}.com`)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      expect(typeof result.data).toBe('string')
      expect(result.data).toContain('example.com')
    })

    it('getDomainOrganicKeywords returns expected shape', async () => {
      mockSuccess(MOCK_DOMAIN_ORGANIC_KEYWORDS_CSV)
      const result = await client.getDomainOrganicKeywords(`organic-${callId}.com`, 'us', 10)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Keyword')
      expect(result.data).toContain('example keyword')
    })

    it('getDomainPaidKeywords returns expected shape', async () => {
      mockSuccess(MOCK_DOMAIN_PAID_KEYWORDS_CSV)
      const result = await client.getDomainPaidKeywords(`paid-${callId}.com`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('buy example')
    })

    it('getCompetitorsInOrganic returns expected shape', async () => {
      mockSuccess(MOCK_COMPETITORS_CSV)
      const result = await client.getCompetitorsInOrganic(`comp-${callId}.com`, 'us', 10)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('competitor1.com')
    })

    it('getBacklinks returns expected shape', async () => {
      mockSuccess(MOCK_BACKLINKS_CSV)
      const result = await client.getBacklinks(`backlinks-${callId}.com`, 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Source Title')
    })

    it('getBacklinksDomains returns expected shape', async () => {
      mockSuccess(MOCK_BACKLINKS_DOMAINS_CSV)
      const result = await client.getBacklinksDomains(`bldomains-${callId}.com`, 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('source.com')
    })

    it('getKeywordOverview returns expected shape', async () => {
      mockSuccess(MOCK_KEYWORD_OVERVIEW_CSV)
      const result = await client.getKeywordOverview(`kwov-${callId}`, 'us')
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('seo')
    })

    it('getRelatedKeywords returns expected shape', async () => {
      mockSuccess(MOCK_RELATED_KEYWORDS_CSV)
      const result = await client.getRelatedKeywords(`related-${callId}`, 'us', 10)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('seo tools')
    })

    it('getKeywordOverviewSingleDb returns expected shape', async () => {
      mockSuccess(MOCK_KEYWORD_SINGLE_DB_CSV)
      const result = await client.getKeywordOverviewSingleDb(`single-${callId}`, 'us')
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Keyword Difficulty')
    })

    it('getBatchKeywordOverview returns expected shape', async () => {
      mockSuccess(MOCK_BATCH_KEYWORD_CSV)
      const result = await client.getBatchKeywordOverview([`batch-${callId}`, 'marketing'], 'us')
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('marketing')
    })

    it('getKeywordOrganicResults returns expected shape', async () => {
      mockSuccess(MOCK_KEYWORD_ORGANIC_RESULTS_CSV)
      const result = await client.getKeywordOrganicResults(`organic-res-${callId}`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('moz.com')
    })

    it('getKeywordPaidResults returns expected shape', async () => {
      mockSuccess(MOCK_KEYWORD_PAID_RESULTS_CSV)
      const result = await client.getKeywordPaidResults(`paid-res-${callId}`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('semrush.com')
    })

    it('getKeywordAdsHistory returns expected shape', async () => {
      mockSuccess(MOCK_KEYWORD_ADS_HISTORY_CSV)
      const result = await client.getKeywordAdsHistory(`ads-hist-${callId}`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('semrush.com')
    })

    it('getBroadMatchKeywords returns expected shape', async () => {
      mockSuccess(MOCK_BROAD_MATCH_CSV)
      const result = await client.getBroadMatchKeywords(`broad-${callId}`, 'us', 10)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('seo tips')
    })

    it('getPhraseQuestions returns expected shape', async () => {
      mockSuccess(MOCK_PHRASE_QUESTIONS_CSV)
      const result = await client.getPhraseQuestions(`questions-${callId}`, 'us', 10)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('what is seo')
    })

    it('getKeywordDifficulty returns expected shape', async () => {
      mockSuccess(MOCK_KEYWORD_DIFFICULTY_CSV)
      const result = await client.getKeywordDifficulty([`kd-${callId}`, 'marketing'], 'us')
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('67.5')
    })

    it('getTrafficSummary returns expected shape', async () => {
      mockSuccess(MOCK_TRAFFIC_SUMMARY_JSON)
      const result = await client.getTrafficSummary([`traffic-${callId}.com`], 'us')
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getTrafficSources returns expected shape', async () => {
      mockSuccess(MOCK_TRAFFIC_SOURCES_JSON)
      const result = await client.getTrafficSources(`sources-${callId}.com`, 'us')
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getApiUnitsBalance returns expected shape', async () => {
      mockSuccess(MOCK_API_UNITS_BALANCE)
      const result = await client.getApiUnitsBalance()
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toBe('45230')
    })
  })

  // ==========================================================================
  // New API Methods — Overview Reports
  // ==========================================================================

  describe('New Methods — Overview Reports', () => {
    function mockSuccess(data: string) {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(data))
    }

    it('getDomainRank returns expected shape', async () => {
      mockSuccess(MOCK_DOMAIN_RANK_CSV)
      const result = await client.getDomainRank(`dr-${callId}.com`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('example.com')
    })

    it('getDomainRankHistory returns expected shape', async () => {
      mockSuccess(MOCK_DOMAIN_RANK_HISTORY_CSV)
      const result = await client.getDomainRankHistory(`drh-${callId}.com`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Date')
    })

    it('getRankDifference returns expected shape', async () => {
      mockSuccess(MOCK_RANK_DIFFERENCE_CSV)
      const result = await client.getRankDifference('us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('rising.com')
    })
  })

  // ==========================================================================
  // New API Methods — Domain Reports
  // ==========================================================================

  describe('New Methods — Domain Reports', () => {
    function mockSuccess(data: string) {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(data))
    }

    it('getPaidCompetitors returns expected shape', async () => {
      mockSuccess(MOCK_PAID_COMPETITORS_CSV)
      const result = await client.getPaidCompetitors(`pc-${callId}.com`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('competitor1.com')
    })

    it('getDomainAdsHistory returns expected shape', async () => {
      mockSuccess(MOCK_DOMAIN_ADS_HISTORY_CSV)
      const result = await client.getDomainAdsHistory(`dah-${callId}.com`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('buy seo tools')
    })

    it('getDomainOrganicUnique returns expected shape', async () => {
      mockSuccess(MOCK_DOMAIN_ORGANIC_UNIQUE_CSV)
      const result = await client.getDomainOrganicUnique(`dou-${callId}.com`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Number of Keywords')
    })

    it('getDomainAdwordsUnique returns expected shape', async () => {
      mockSuccess(MOCK_DOMAIN_ADWORDS_UNIQUE_CSV)
      const result = await client.getDomainAdwordsUnique(`dau-${callId}.com`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Ad id')
    })

    it('getDomainShopping returns expected shape', async () => {
      mockSuccess(MOCK_DOMAIN_SHOPPING_CSV)
      const result = await client.getDomainShopping(`ds-${callId}.com`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Shop Name')
    })

    it('getDomainShoppingUnique returns expected shape', async () => {
      mockSuccess(MOCK_DOMAIN_SHOPPING_UNIQUE_CSV)
      const result = await client.getDomainShoppingUnique(`dsu-${callId}.com`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Product Price')
    })
  })

  // ==========================================================================
  // New API Methods — URL Reports
  // ==========================================================================

  describe('New Methods — URL Reports', () => {
    function mockSuccess(data: string) {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(data))
    }

    it('getUrlOrganic returns expected shape', async () => {
      mockSuccess(MOCK_URL_ORGANIC_CSV)
      const result = await client.getUrlOrganic(`https://url-${callId}.com/page`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('what is seo')
    })

    it('getUrlAdwords returns expected shape', async () => {
      mockSuccess(MOCK_URL_ADWORDS_CSV)
      const result = await client.getUrlAdwords(`https://url-${callId}.com/page`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('seo tools')
    })

    it('getUrlRank returns expected shape', async () => {
      mockSuccess(MOCK_URL_RANK_CSV)
      const result = await client.getUrlRank(`https://url-${callId}.com/page`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Organic Keywords')
    })

    it('getUrlRankHistory returns expected shape', async () => {
      mockSuccess(MOCK_URL_RANK_HISTORY_CSV)
      const result = await client.getUrlRankHistory(`https://url-${callId}.com/page`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Date')
    })

    it('getUrlRanks returns expected shape', async () => {
      mockSuccess(MOCK_URL_RANKS_CSV)
      const result = await client.getUrlRanks(`https://url-${callId}.com/page`, 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Database')
    })

    it('getUrlOrganic passes url param correctly', async () => {
      mockSuccess(MOCK_URL_ORGANIC_CSV)
      await client.getUrlOrganic('https://example.com/page', 'us', 10)
      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.url).toBe('https://example.com/page')
      expect(callArgs.params.type).toBe('url_organic')
    })
  })

  // ==========================================================================
  // New API Methods — Subdomain Reports
  // ==========================================================================

  describe('New Methods — Subdomain Reports', () => {
    function mockSuccess(data: string) {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(data))
    }

    it('getSubdomainRank returns expected shape', async () => {
      mockSuccess(MOCK_SUBDOMAIN_RANK_CSV)
      const result = await client.getSubdomainRank(`sub-${callId}.example.com`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Organic Keywords')
    })

    it('getSubdomainRanks returns expected shape', async () => {
      mockSuccess(MOCK_SUBDOMAIN_RANKS_CSV)
      const result = await client.getSubdomainRanks(`sub-${callId}.example.com`, 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Database')
    })

    it('getSubdomainRankHistory returns expected shape', async () => {
      mockSuccess(MOCK_SUBDOMAIN_RANK_HISTORY_CSV)
      const result = await client.getSubdomainRankHistory(`sub-${callId}.example.com`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Date')
    })

    it('getSubdomainOrganic returns expected shape', async () => {
      mockSuccess(MOCK_SUBDOMAIN_ORGANIC_CSV)
      const result = await client.getSubdomainOrganic(`sub-${callId}.example.com`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('subdomain keyword')
    })

    it('getSubdomainRank passes subdomain param correctly', async () => {
      mockSuccess(MOCK_SUBDOMAIN_RANK_CSV)
      await client.getSubdomainRank('www.example.com', 'us', 5)
      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.subdomain).toBe('www.example.com')
      expect(callArgs.params.type).toBe('subdomain_rank')
    })
  })

  // ==========================================================================
  // New API Methods — Subfolder Reports
  // ==========================================================================

  describe('New Methods — Subfolder Reports', () => {
    function mockSuccess(data: string) {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(data))
    }

    it('getSubfolderOrganic returns expected shape', async () => {
      mockSuccess(MOCK_SUBFOLDER_ORGANIC_CSV)
      const result = await client.getSubfolderOrganic(`example-${callId}.com/blog/`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('subfolder keyword')
    })

    it('getSubfolderAdwords returns expected shape', async () => {
      mockSuccess(MOCK_SUBFOLDER_ADWORDS_CSV)
      const result = await client.getSubfolderAdwords(`example-${callId}.com/blog/`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('subfolder paid')
    })

    it('getSubfolderRank returns expected shape', async () => {
      mockSuccess(MOCK_SUBFOLDER_RANK_CSV)
      const result = await client.getSubfolderRank(`example-${callId}.com/blog/`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Organic Keywords')
    })

    it('getSubfolderRanks returns expected shape', async () => {
      mockSuccess(MOCK_SUBFOLDER_RANKS_CSV)
      const result = await client.getSubfolderRanks(`example-${callId}.com/blog/`, 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Database')
    })

    it('getSubfolderRankHistory returns expected shape', async () => {
      mockSuccess(MOCK_SUBFOLDER_RANK_HISTORY_CSV)
      const result = await client.getSubfolderRankHistory(`example-${callId}.com/blog/`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Date')
    })

    it('getSubfolderOrganicUnique returns expected shape', async () => {
      mockSuccess(MOCK_SUBFOLDER_ORGANIC_UNIQUE_CSV)
      const result = await client.getSubfolderOrganicUnique(`example-${callId}.com/blog/`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Number of Keywords')
    })

    it('getSubfolderAdwordsUnique returns expected shape', async () => {
      mockSuccess(MOCK_SUBFOLDER_ADWORDS_UNIQUE_CSV)
      const result = await client.getSubfolderAdwordsUnique(`example-${callId}.com/blog/`, 'us', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Ad id')
    })

    it('getSubfolderOrganic passes subfolder param correctly', async () => {
      mockSuccess(MOCK_SUBFOLDER_ORGANIC_CSV)
      await client.getSubfolderOrganic('example.com/blog/', 'us', 5)
      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.subfolder).toBe('example.com/blog/')
      expect(callArgs.params.type).toBe('subfolder_organic')
    })
  })

  // ==========================================================================
  // New API Methods — Backlinks Reports
  // ==========================================================================

  describe('New Methods — Backlinks Reports', () => {
    function mockSuccess(data: string) {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(data))
    }

    it('getBacklinksOverview returns expected shape', async () => {
      mockSuccess(MOCK_BACKLINKS_OVERVIEW_CSV)
      const result = await client.getBacklinksOverview(`blo-${callId}.com`)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('total')
    })

    it('getBacklinksPages returns expected shape', async () => {
      mockSuccess(MOCK_BACKLINKS_PAGES_CSV)
      const result = await client.getBacklinksPages(`blp-${callId}.com`, 'root_domain', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('source_url')
    })

    it('getBacklinksAnchors returns expected shape', async () => {
      mockSuccess(MOCK_BACKLINKS_ANCHORS_CSV)
      const result = await client.getBacklinksAnchors(`bla-${callId}.com`, 'root_domain', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('click here')
    })

    it('getBacklinksTld returns expected shape', async () => {
      mockSuccess(MOCK_BACKLINKS_TLD_CSV)
      const result = await client.getBacklinksTld(`blt-${callId}.com`, 'root_domain', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('com')
    })

    it('getBacklinksCategories returns expected shape', async () => {
      mockSuccess(MOCK_BACKLINKS_CATEGORIES_CSV)
      const result = await client.getBacklinksCategories(`blc-${callId}.com`, 'root_domain', 5)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.data).toContain('Internet and Telecom')
    })

    it('getBacklinksOverview uses correct base URL', async () => {
      mockSuccess(MOCK_BACKLINKS_OVERVIEW_CSV)
      await client.getBacklinksOverview('example.com')
      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.url).toBe('https://api.semrush.com/analytics/v1/')
      expect(callArgs.params.type).toBe('backlinks_overview')
    })
  })

  // ==========================================================================
  // New API Methods — Trends
  // ==========================================================================

  describe('New Methods — Trends API', () => {
    function mockSuccess(data: string) {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(data))
    }

    it('getTrafficDestinations returns expected shape', async () => {
      mockSuccess(MOCK_TRENDS_DESTINATIONS_CSV)
      const result = await client.getTrafficDestinations(`td-${callId}.com`)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getTrafficGeo returns expected shape', async () => {
      mockSuccess(MOCK_TRENDS_GEO_CSV)
      const result = await client.getTrafficGeo(`tg-${callId}.com`)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getTrafficSubdomains returns expected shape', async () => {
      mockSuccess(MOCK_TRENDS_SUBDOMAINS_CSV)
      const result = await client.getTrafficSubdomains(`tsub-${callId}.com`)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getTrafficSubfolders returns expected shape', async () => {
      mockSuccess(MOCK_TRENDS_SUBFOLDERS_CSV)
      const result = await client.getTrafficSubfolders(`tsfold-${callId}.com`)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getTrafficTopPages returns expected shape', async () => {
      mockSuccess(MOCK_TRENDS_TOPPAGES_CSV)
      const result = await client.getTrafficTopPages(`ttp-${callId}.com`)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getTrafficRank returns expected shape', async () => {
      mockSuccess(MOCK_TRENDS_RANK_CSV)
      const result = await client.getTrafficRank(`tr-${callId}.com`)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getTrafficSocialMedia returns expected shape', async () => {
      mockSuccess(MOCK_TRENDS_SOCIAL_MEDIA_CSV)
      const result = await client.getTrafficSocialMedia(`tsm-${callId}.com`)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getAudienceInsights returns expected shape', async () => {
      mockSuccess(MOCK_TRENDS_AUDIENCE_INSIGHTS_CSV)
      const result = await client.getAudienceInsights([`ai-${callId}.com`], [`ai-${callId}.com`])
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getPurchaseConversion returns expected shape', async () => {
      mockSuccess(MOCK_TRENDS_PURCHASE_CONVERSION_CSV)
      const result = await client.getPurchaseConversion(`pc-${callId}.com`)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getHouseholdDistribution returns expected shape', async () => {
      mockSuccess(MOCK_TRENDS_HOUSEHOLD_CSV)
      const result = await client.getHouseholdDistribution(`hh-${callId}.com`)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getIncomeDistribution returns expected shape', async () => {
      mockSuccess(MOCK_TRENDS_INCOME_CSV)
      const result = await client.getIncomeDistribution(`inc-${callId}.com`)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getEducationDistribution returns expected shape', async () => {
      mockSuccess(MOCK_TRENDS_EDUCATION_CSV)
      const result = await client.getEducationDistribution(`edu-${callId}.com`)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getOccupationDistribution returns expected shape', async () => {
      mockSuccess(MOCK_TRENDS_OCCUPATION_CSV)
      const result = await client.getOccupationDistribution(`occ-${callId}.com`)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getAudienceInterests returns expected shape', async () => {
      mockSuccess(MOCK_TRENDS_AUDIENCE_INTERESTS_CSV)
      const result = await client.getAudienceInterests(`aint-${callId}.com`)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getTrafficAccuracy returns expected shape', async () => {
      mockSuccess(MOCK_TRENDS_ACCURACY_CSV)
      const result = await client.getTrafficAccuracy(`acc-${callId}.com`)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getTrafficDestinations uses correct Trends API base URL', async () => {
      mockSuccess(MOCK_TRENDS_DESTINATIONS_CSV)
      await client.getTrafficDestinations('example.com')
      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.url).toContain('analytics/ta/api/v3/destinations')
    })

    it('getTrafficSummary uses targets param', async () => {
      mockSuccess(MOCK_TRAFFIC_SUMMARY_JSON)
      await client.getTrafficSummary(['a.com', 'b.com'], 'us')
      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.targets).toBe('a.com,b.com')
    })

    it('getAudienceInsights passes targets and selected_targets', async () => {
      mockSuccess(MOCK_TRENDS_AUDIENCE_INSIGHTS_CSV)
      await client.getAudienceInsights(['a.com', 'b.com'], ['a.com'])
      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.targets).toBe('a.com,b.com')
      expect(callArgs.params.selected_targets).toBe('a.com')
    })
  })

  // ==========================================================================
  // New API Methods — Projects
  // ==========================================================================

  describe('New Methods — Projects API', () => {
    function mockSuccess(data: string) {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(data))
    }

    it('listProjects returns expected shape and uses correct URL', async () => {
      mockSuccess(MOCK_PROJECTS_LIST_JSON)
      const result = await client.listProjects()
      assertValidResponse(result)
      assertHasData(result)
      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.url).toBe('https://api.semrush.com/management/v1/projects')
    })

    it('getProject returns expected shape', async () => {
      mockSuccess(MOCK_PROJECT_JSON)
      const result = await client.getProject(12345)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('createProject returns expected shape', async () => {
      mockSuccess(MOCK_PROJECT_JSON)
      const result = await client.createProject('https://example.com', 'Test')
      assertValidResponse(result)
      assertHasData(result)
    })

    it('updateProject returns expected shape', async () => {
      mockSuccess(MOCK_PROJECT_JSON)
      const result = await client.updateProject(12345, 'New Name')
      assertValidResponse(result)
      assertHasData(result)
    })

    it('deleteProject returns expected shape', async () => {
      mockSuccess('{"status":"ok"}')
      const result = await client.deleteProject(12345)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('createProject uses POST method', async () => {
      mockSuccess(MOCK_PROJECT_JSON)
      await client.createProject('https://example.com')
      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.method).toBe('post')
    })

    it('deleteProject uses DELETE method', async () => {
      mockSuccess('{"status":"ok"}')
      await client.deleteProject(99999)
      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.method).toBe('delete')
    })
  })

  // ==========================================================================
  // New API Methods — Site Audit
  // ==========================================================================

  describe('New Methods — Site Audit API', () => {
    function mockSuccess(data: string) {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(data))
    }

    it('getSiteAuditInfo returns expected shape', async () => {
      mockSuccess(MOCK_SITE_AUDIT_INFO_JSON)
      const result = await client.getSiteAuditInfo(12345)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getSiteAuditSnapshots returns expected shape', async () => {
      mockSuccess(MOCK_SITE_AUDIT_SNAPSHOTS_JSON)
      const result = await client.getSiteAuditSnapshots(12345)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getSiteAuditSnapshotDetail returns expected shape', async () => {
      mockSuccess(MOCK_SITE_AUDIT_SNAPSHOT_DETAIL_JSON)
      const result = await client.getSiteAuditSnapshotDetail(12345, 100)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getSiteAuditIssues returns expected shape', async () => {
      mockSuccess(MOCK_SITE_AUDIT_ISSUES_JSON)
      const result = await client.getSiteAuditIssues(12345)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getSiteAuditPages returns expected shape', async () => {
      mockSuccess(MOCK_SITE_AUDIT_PAGES_JSON)
      const result = await client.getSiteAuditPages(12345, 'https://example.com')
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getSiteAuditPageDetail returns expected shape', async () => {
      mockSuccess(MOCK_SITE_AUDIT_PAGE_DETAIL_JSON)
      const result = await client.getSiteAuditPageDetail(12345, 1)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getSiteAuditHistory returns expected shape', async () => {
      mockSuccess(MOCK_SITE_AUDIT_HISTORY_JSON)
      const result = await client.getSiteAuditHistory(12345, 10, 0)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('launchSiteAuditCrawl returns expected shape', async () => {
      mockSuccess(MOCK_SITE_AUDIT_LAUNCH_JSON)
      const result = await client.launchSiteAuditCrawl(12345)
      assertValidResponse(result)
      assertHasData(result)
    })

    it('getSiteAuditInfo uses correct URL', async () => {
      mockSuccess(MOCK_SITE_AUDIT_INFO_JSON)
      await client.getSiteAuditInfo(99901)
      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.url).toContain('/reports/v1/projects/99901/siteaudit/info')
    })

    it('launchSiteAuditCrawl uses POST method', async () => {
      mockSuccess(MOCK_SITE_AUDIT_LAUNCH_JSON)
      await client.launchSiteAuditCrawl(99902)
      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.method).toBe('post')
    })
  })

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('Error Handling', () => {
    it('throws SemrushApiError on 400 Bad Request', async () => {
      mockedAxios.mockRejectedValueOnce(createAxiosError(400, 'Bad request'))

      await expect(client.getDomainOverview(`err400-${callId}.com`)).rejects.toThrow(
        SemrushApiError
      )
    })

    it('throws SemrushApiError on 401 Unauthorized', async () => {
      mockedAxios.mockRejectedValueOnce(createAxiosError(401, 'Invalid API key'))

      await expect(client.getDomainOverview(`err401-${callId}.com`)).rejects.toThrow(
        SemrushApiError
      )
    })

    it('throws SemrushApiError on 403 Forbidden', async () => {
      mockedAxios.mockRejectedValueOnce(createAxiosError(403, 'Access denied'))

      await expect(client.getDomainOverview(`err403-${callId}.com`)).rejects.toThrow(
        SemrushApiError
      )
    })

    it('wraps non-Axios errors in SemrushApiError with status 500', async () => {
      mockedAxios.mockRejectedValueOnce(new Error('ECONNREFUSED'))

      try {
        await client.getDomainOverview(`errnet-${callId}.com`)
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(SemrushApiError)
        expect((error as SemrushApiError).status).toBe(500)
        expect((error as SemrushApiError).message).toContain('ECONNREFUSED')
      }
    })

    it('preserves HTTP status on SemrushApiError', async () => {
      mockedAxios.mockRejectedValueOnce(createAxiosError(401, 'Invalid API key'))

      try {
        await client.getDomainOverview(`errstatus-${callId}.com`)
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(SemrushApiError)
        expect((error as SemrushApiError).status).toBe(401)
      }
    })

    it('preserves error response body on SemrushApiError', async () => {
      mockedAxios.mockRejectedValueOnce(createAxiosError(422, 'Validation failed'))

      try {
        await client.getDomainOverview(`errresp-${callId}.com`)
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(SemrushApiError)
        expect((error as SemrushApiError).response).toBeDefined()
      }
    })
  })

  // ==========================================================================
  // Caching
  // ==========================================================================

  describe('Caching', () => {
    it('returns cached response on second identical call (only 1 HTTP request)', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))

      const uniqueDomain = `cache-hit-${callId}.com`
      const result1 = await client.getDomainOverview(uniqueDomain, 'us')
      const result2 = await client.getDomainOverview(uniqueDomain, 'us')

      // axios should only have been called once — second call came from cache
      expect(mockedAxios).toHaveBeenCalledTimes(1)
      expect(result1.data).toBe(result2.data)
    })

    it('makes separate requests for different parameters', async () => {
      mockedAxios
        .mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))
        .mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))

      const uniqueDomain = `cache-diff-${callId}.com`
      await client.getDomainOverview(uniqueDomain, 'us')
      await client.getDomainOverview(uniqueDomain, 'uk')

      expect(mockedAxios).toHaveBeenCalledTimes(2)
    })

    it('does not cache error responses', async () => {
      mockedAxios.mockRejectedValueOnce(createAxiosError(400, 'Bad request'))
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))

      const uniqueDomain = `cache-err-${callId}.com`

      // First call fails
      await expect(client.getDomainOverview(uniqueDomain)).rejects.toThrow(SemrushApiError)

      // Second call should make a new request (not serve cached error)
      const result = await client.getDomainOverview(uniqueDomain)
      assertValidResponse(result)
      expect(mockedAxios).toHaveBeenCalledTimes(2)
    })
  })

  // ==========================================================================
  // Rate Limiting
  // ==========================================================================

  describe('Rate Limiting', () => {
    it('makes requests within rate limit without delay', async () => {
      mockedAxios
        .mockResolvedValueOnce(createMockAxiosResponse(MOCK_KEYWORD_OVERVIEW_CSV))
        .mockResolvedValueOnce(createMockAxiosResponse(MOCK_RELATED_KEYWORDS_CSV))

      const [r1, r2] = await Promise.all([
        client.getKeywordOverview(`rl1-${callId}`),
        client.getRelatedKeywords(`rl2-${callId}`),
      ])

      assertValidResponse(r1)
      assertValidResponse(r2)
    })
  })

  // ==========================================================================
  // Retry Logic on 429 / 5xx
  // ==========================================================================

  describe('Retry Logic', () => {
    it('retries on 429 and succeeds on second attempt', async () => {
      mockedAxios
        .mockRejectedValueOnce(createAxiosError(429, 'Rate limit exceeded'))
        .mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))

      const result = await client.getDomainOverview(`retry429-${callId}.com`)
      assertValidResponse(result)
      expect(mockedAxios).toHaveBeenCalledTimes(2)
    }, 15000)

    it('retries on 500 and succeeds', async () => {
      mockedAxios
        .mockRejectedValueOnce(createAxiosError(500, 'Internal server error'))
        .mockResolvedValueOnce(createMockAxiosResponse(MOCK_KEYWORD_OVERVIEW_CSV))

      const result = await client.getKeywordOverview(`retry500-${callId}`)
      assertValidResponse(result)
      expect(mockedAxios).toHaveBeenCalledTimes(2)
    }, 15000)

    it('retries on 502/503/504', async () => {
      mockedAxios
        .mockRejectedValueOnce(createAxiosError(502, 'Bad Gateway'))
        .mockRejectedValueOnce(createAxiosError(503, 'Service Unavailable'))
        .mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))

      const result = await client.getDomainOverview(`retry5xx-${callId}.com`)
      assertValidResponse(result)
      expect(mockedAxios).toHaveBeenCalledTimes(3)
    }, 20000)

    it('fails after MAX_RETRIES on persistent 5xx', async () => {
      // First call + 3 retries = 4 total calls
      mockedAxios
        .mockRejectedValueOnce(createAxiosError(500, 'Error 1'))
        .mockRejectedValueOnce(createAxiosError(500, 'Error 2'))
        .mockRejectedValueOnce(createAxiosError(500, 'Error 3'))
        .mockRejectedValueOnce(createAxiosError(500, 'Error 4'))

      await expect(client.getDomainOverview(`retryfail-${callId}.com`)).rejects.toThrow(
        SemrushApiError
      )
      expect(mockedAxios).toHaveBeenCalledTimes(4)
    }, 30000)

    it('does NOT retry on 400 (client error)', async () => {
      mockedAxios.mockRejectedValueOnce(createAxiosError(400, 'Bad request'))

      await expect(client.getDomainOverview(`noretry400-${callId}.com`)).rejects.toThrow(
        SemrushApiError
      )
      expect(mockedAxios).toHaveBeenCalledTimes(1)
    })

    it('does NOT retry on 401 (auth error)', async () => {
      mockedAxios.mockRejectedValueOnce(createAxiosError(401, 'Invalid key'))

      await expect(client.getDomainOverview(`noretry401-${callId}.com`)).rejects.toThrow(
        SemrushApiError
      )
      expect(mockedAxios).toHaveBeenCalledTimes(1)
    })

    it('does NOT retry on 403 (forbidden)', async () => {
      mockedAxios.mockRejectedValueOnce(createAxiosError(403, 'Forbidden'))

      await expect(client.getDomainOverview(`noretry403-${callId}.com`)).rejects.toThrow(
        SemrushApiError
      )
      expect(mockedAxios).toHaveBeenCalledTimes(1)
    })
  })

  // ==========================================================================
  // Request Parameters
  // ==========================================================================

  describe('Request Parameters', () => {
    it('passes API key in request params', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))

      await client.getDomainOverview(`params-key-${callId}.com`)

      expect(mockedAxios).toHaveBeenCalledTimes(1)
      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.key).toBe(TEST_API_KEY)
    })

    it('passes domain parameter correctly', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))

      await client.getDomainOverview(`params-domain-${callId}.com`, 'uk')

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.domain).toBe(`params-domain-${callId}.com`)
      expect(callArgs.params.database).toBe('uk')
      expect(callArgs.params.type).toBe('domain_ranks')
    })

    it('passes display_limit when limit is provided', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_ORGANIC_KEYWORDS_CSV))

      await client.getDomainOrganicKeywords(`params-limit-${callId}.com`, 'us', 25)

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.display_limit).toBe(25)
    })

    it('omits display_limit when limit is not provided', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_ORGANIC_KEYWORDS_CSV))

      await client.getDomainOrganicKeywords(`params-nolimit-${callId}.com`)

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.display_limit).toBeUndefined()
    })

    it('joins keywords with semicolons for batch endpoints', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_BATCH_KEYWORD_CSV))

      await client.getBatchKeywordOverview(['seo', 'marketing', 'ppc'], 'us')

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.phrase).toBe('seo;marketing;ppc')
    })

    it('joins domains with commas for traffic summary', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_TRAFFIC_SUMMARY_JSON))

      await client.getTrafficSummary([`ts1-${callId}.com`, `ts2-${callId}.com`], 'us')

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.targets).toBe(`ts1-${callId}.com,ts2-${callId}.com`)
    })

    it('uses correct API URL for traffic endpoints', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_TRAFFIC_SUMMARY_JSON))

      await client.getTrafficSummary([`tsurl-${callId}.com`])

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.url).toContain('analytics/ta/api/v3/summary')
    })

    it('uses correct API URL for standard endpoints', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))

      await client.getDomainOverview(`stdurl-${callId}.com`)

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.url).toBe('https://api.semrush.com/')
    })

    it('sends correct export_columns for domain overview', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))

      await client.getDomainOverview(`cols-${callId}.com`)

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.export_columns).toBe('Db,Dn,Rk,Or,Ot,Oc,Ad,At,Ac,Sh,Sv')
    })
  })

  // ==========================================================================
  // Default Parameters
  // ==========================================================================

  describe('Default Parameters', () => {
    it('defaults database to "us" for getDomainOverview', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_DOMAIN_OVERVIEW_CSV))

      await client.getDomainOverview(`defdb-${callId}.com`)

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.database).toBe('us')
    })

    it('defaults database to "us" for getKeywordOverview', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_KEYWORD_OVERVIEW_CSV))

      await client.getKeywordOverview(`defkw-${callId}`)

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.database).toBe('us')
    })

    it('defaults country to "us" for getTrafficSummary', async () => {
      mockedAxios.mockResolvedValueOnce(createMockAxiosResponse(MOCK_TRAFFIC_SUMMARY_JSON))

      await client.getTrafficSummary([`defcountry-${callId}.com`])

      const callArgs = mockedAxios.mock.calls[0][0]
      expect(callArgs.params.country).toBe('us')
    })
  })
})
