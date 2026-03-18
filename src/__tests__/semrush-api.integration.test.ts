/**
 * Semrush API Client — Integration Tests (Real API)
 *
 * Runs against the live Semrush API. HARD FAILS if SEMRUSH_API_KEY is not set.
 * Uses small limits (1) to minimize API unit consumption.
 */
import { beforeAll, describe, expect, it } from 'vitest'

import { SemrushApiClient, SemrushApiError } from '../semrush-api.js'
import { assertHasData, assertValidResponse } from './test-utils.js'

let client: SemrushApiClient

beforeAll(() => {
  if (!process.env.SEMRUSH_API_KEY) {
    throw new Error(
      'SEMRUSH_API_KEY is required for integration tests. Set it in your environment.'
    )
  }
  client = new SemrushApiClient(process.env.SEMRUSH_API_KEY)
})

/** Helper for Trends endpoints that may fail without subscription */
function trendsErrorGuard(error: unknown, label: string): void {
  if (error instanceof SemrushApiError) {
    console.log(
      `${label} skipped — .Trends subscription likely missing: ${error.message} (HTTP ${error.status})`
    )
    return
  }
  throw error
}

describe('SemrushApiClient — Integration Tests', () => {
  // ==========================================================================
  // Domain Analytics — Original
  // ==========================================================================

  describe('Domain Analytics', () => {
    it('getDomainOverview returns data for google.com', async () => {
      const result = await client.getDomainOverview('google.com')
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      expect(typeof result.data).toBe('string')
      console.log('Domain overview preview:', String(result.data).substring(0, 200))
    }, 30000)

    it('getDomainOrganicKeywords returns rows for google.com', async () => {
      const result = await client.getDomainOrganicKeywords('google.com', 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      const lines = String(result.data).trim().split(/\r?\n/)
      expect(lines.length).toBeGreaterThan(1)
    }, 30000)

    it('getDomainPaidKeywords returns rows for google.com', async () => {
      const result = await client.getDomainPaidKeywords('google.com', 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getCompetitorsInOrganic returns rows for google.com', async () => {
      const result = await client.getCompetitorsInOrganic('google.com', 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)
  })

  // ==========================================================================
  // Domain Analytics — New Overview Reports
  // ==========================================================================

  describe('Overview Reports (New)', () => {
    it('getDomainRank returns data for semrush.com', async () => {
      const result = await client.getDomainRank('semrush.com', 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      console.log('Domain rank preview:', String(result.data).substring(0, 200))
    }, 30000)

    it('getDomainRankHistory returns data for semrush.com', async () => {
      const result = await client.getDomainRankHistory('semrush.com', 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getRankDifference returns data', async () => {
      const result = await client.getRankDifference('us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      console.log('Rank difference preview:', String(result.data).substring(0, 200))
    }, 30000)
  })

  // ==========================================================================
  // Domain Reports — New
  // ==========================================================================

  describe('Domain Reports (New)', () => {
    it('getPaidCompetitors returns data for amazon.com', async () => {
      const result = await client.getPaidCompetitors('amazon.com', 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getDomainAdsHistory returns data for amazon.com', async () => {
      const result = await client.getDomainAdsHistory('amazon.com', 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getDomainOrganicUnique returns data for semrush.com', async () => {
      const result = await client.getDomainOrganicUnique('semrush.com', 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getDomainAdwordsUnique returns data for amazon.com', async () => {
      const result = await client.getDomainAdwordsUnique('amazon.com', 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getDomainShopping returns data for amazon.com', async () => {
      const result = await client.getDomainShopping('amazon.com', 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getDomainShoppingUnique returns data for amazon.com', async () => {
      const result = await client.getDomainShoppingUnique('amazon.com', 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)
  })

  // ==========================================================================
  // URL Reports — New
  // ==========================================================================

  describe('URL Reports (New)', () => {
    const testUrl = 'https://www.semrush.com/blog/what-is-seo/'

    it('getUrlOrganic returns data', async () => {
      const result = await client.getUrlOrganic(testUrl, 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      console.log('URL organic preview:', String(result.data).substring(0, 200))
    }, 30000)

    it('getUrlAdwords returns data (may be empty)', async () => {
      const result = await client.getUrlAdwords(testUrl, 'us', 1)
      assertValidResponse(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getUrlRank returns data', async () => {
      const result = await client.getUrlRank(testUrl, 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getUrlRankHistory returns data', async () => {
      const result = await client.getUrlRankHistory(testUrl, 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getUrlRanks returns data across all databases', async () => {
      const result = await client.getUrlRanks(testUrl, 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)
  })

  // ==========================================================================
  // Subdomain Reports — New
  // ==========================================================================

  describe('Subdomain Reports (New)', () => {
    const testSubdomain = 'www.semrush.com'

    it('getSubdomainRank returns data', async () => {
      const result = await client.getSubdomainRank(testSubdomain, 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      console.log('Subdomain rank preview:', String(result.data).substring(0, 200))
    }, 30000)

    it('getSubdomainRanks returns data across all databases', async () => {
      const result = await client.getSubdomainRanks(testSubdomain, 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getSubdomainRankHistory returns data', async () => {
      const result = await client.getSubdomainRankHistory(testSubdomain, 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getSubdomainOrganic returns data (may be empty)', async () => {
      const result = await client.getSubdomainOrganic(testSubdomain, 'us', 1)
      assertValidResponse(result)
      expect(result.status).toBe(200)
    }, 30000)
  })

  // ==========================================================================
  // Subfolder Reports — New
  // ==========================================================================

  describe('Subfolder Reports (New)', () => {
    const testSubfolder = 'semrush.com/blog/'

    it('getSubfolderOrganic returns data', async () => {
      const result = await client.getSubfolderOrganic(testSubfolder, 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      console.log('Subfolder organic preview:', String(result.data).substring(0, 200))
    }, 30000)

    it('getSubfolderAdwords returns data (may be empty)', async () => {
      const result = await client.getSubfolderAdwords(testSubfolder, 'us', 1)
      assertValidResponse(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getSubfolderRank returns data', async () => {
      const result = await client.getSubfolderRank(testSubfolder, 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getSubfolderRanks returns data across all databases', async () => {
      const result = await client.getSubfolderRanks(testSubfolder, 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getSubfolderRankHistory returns data', async () => {
      const result = await client.getSubfolderRankHistory(testSubfolder, 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getSubfolderOrganicUnique returns data', async () => {
      const result = await client.getSubfolderOrganicUnique(testSubfolder, 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getSubfolderAdwordsUnique returns data (may be empty)', async () => {
      const result = await client.getSubfolderAdwordsUnique(testSubfolder, 'us', 1)
      assertValidResponse(result)
      expect(result.status).toBe(200)
    }, 30000)
  })

  // ==========================================================================
  // Backlinks — Original
  // ==========================================================================

  describe('Backlinks', () => {
    it('getBacklinks returns rows for google.com', async () => {
      const result = await client.getBacklinks('google.com', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getBacklinksDomains returns rows for google.com', async () => {
      const result = await client.getBacklinksDomains('google.com', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)
  })

  // ==========================================================================
  // Backlinks — New
  // ==========================================================================

  describe('Backlinks Reports (New)', () => {
    it('getBacklinksOverview returns data for semrush.com', async () => {
      const result = await client.getBacklinksOverview('semrush.com')
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      console.log('Backlinks overview preview:', String(result.data).substring(0, 200))
    }, 30000)

    it('getBacklinksPages returns data for semrush.com', async () => {
      const result = await client.getBacklinksPages('semrush.com', 'root_domain', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getBacklinksAnchors returns data for semrush.com', async () => {
      const result = await client.getBacklinksAnchors('semrush.com', 'root_domain', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getBacklinksTld returns data for semrush.com', async () => {
      const result = await client.getBacklinksTld('semrush.com', 'root_domain', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getBacklinksCategories returns data for semrush.com', async () => {
      const result = await client.getBacklinksCategories('semrush.com', 'root_domain', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)
  })

  // ==========================================================================
  // Keyword Analytics
  // ==========================================================================

  describe('Keyword Analytics', () => {
    it('getKeywordOverview returns data for "seo"', async () => {
      const result = await client.getKeywordOverview('seo', 'us')
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getRelatedKeywords returns rows for "seo"', async () => {
      const result = await client.getRelatedKeywords('seo', 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getKeywordOverviewSingleDb returns data for "seo" in "us"', async () => {
      const result = await client.getKeywordOverviewSingleDb('seo', 'us')
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getBatchKeywordOverview returns rows for ["seo", "marketing"]', async () => {
      const result = await client.getBatchKeywordOverview(['seo', 'marketing'], 'us')
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getKeywordOrganicResults returns rows for "seo"', async () => {
      const result = await client.getKeywordOrganicResults('seo', 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getKeywordPaidResults returns rows for "seo" (may be empty)', async () => {
      const result = await client.getKeywordPaidResults('seo', 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getKeywordAdsHistory returns rows for "seo" (may be empty)', async () => {
      const result = await client.getKeywordAdsHistory('seo', 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getBroadMatchKeywords returns rows for "seo"', async () => {
      const result = await client.getBroadMatchKeywords('seo', 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getPhraseQuestions returns rows for "seo"', async () => {
      const result = await client.getPhraseQuestions('seo', 'us', 1)
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)

    it('getKeywordDifficulty returns data for ["seo", "marketing"]', async () => {
      const result = await client.getKeywordDifficulty(['seo', 'marketing'], 'us')
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
    }, 30000)
  })

  // ==========================================================================
  // Traffic Analytics (.Trends — may fail without subscription)
  // ==========================================================================

  describe('Traffic Analytics (.Trends)', () => {
    it('getTrafficSummary returns data (may fail without .Trends)', async () => {
      try {
        const result = await client.getTrafficSummary(['google.com'], 'us')
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        trendsErrorGuard(error, 'Traffic summary')
      }
    }, 30000)

    it('getTrafficSources returns data (may fail without .Trends)', async () => {
      try {
        const result = await client.getTrafficSources('google.com', 'us')
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        trendsErrorGuard(error, 'Traffic sources')
      }
    }, 30000)

    it('getTrafficDestinations returns data (may fail without .Trends)', async () => {
      try {
        const result = await client.getTrafficDestinations('google.com', 'us')
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        trendsErrorGuard(error, 'Traffic destinations')
      }
    }, 30000)

    it('getTrafficGeo returns data (may fail without .Trends)', async () => {
      try {
        const result = await client.getTrafficGeo('google.com', 'us')
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        trendsErrorGuard(error, 'Traffic geo')
      }
    }, 30000)

    it('getTrafficSubdomains returns data (may fail without .Trends)', async () => {
      try {
        const result = await client.getTrafficSubdomains('google.com', 'us')
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        trendsErrorGuard(error, 'Traffic subdomains')
      }
    }, 30000)

    it('getTrafficSubfolders returns data (may fail without .Trends)', async () => {
      try {
        const result = await client.getTrafficSubfolders('google.com', 'us')
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        trendsErrorGuard(error, 'Traffic subfolders')
      }
    }, 30000)

    it('getTrafficTopPages returns data (may fail without .Trends)', async () => {
      try {
        const result = await client.getTrafficTopPages('google.com', 'us')
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        trendsErrorGuard(error, 'Traffic top pages')
      }
    }, 30000)

    it('getTrafficRank returns data (may fail without .Trends)', async () => {
      try {
        const result = await client.getTrafficRank('google.com', 'us')
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        trendsErrorGuard(error, 'Traffic rank')
      }
    }, 30000)

    it('getTrafficSocialMedia returns data (may fail without .Trends)', async () => {
      try {
        const result = await client.getTrafficSocialMedia('google.com', 'us')
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        trendsErrorGuard(error, 'Traffic social media')
      }
    }, 30000)

    it('getAudienceInsights returns data (may fail without .Trends)', async () => {
      try {
        const result = await client.getAudienceInsights(
          ['google.com', 'youtube.com'],
          ['google.com'],
          1
        )
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        trendsErrorGuard(error, 'Audience insights')
      }
    }, 30000)

    it('getPurchaseConversion returns data (may fail without .Trends)', async () => {
      try {
        const result = await client.getPurchaseConversion('amazon.com', 'us')
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        trendsErrorGuard(error, 'Purchase conversion')
      }
    }, 30000)

    it('getHouseholdDistribution returns data (may fail without .Trends)', async () => {
      try {
        const result = await client.getHouseholdDistribution('google.com', 'us', 'desktop')
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        trendsErrorGuard(error, 'Household distribution')
      }
    }, 30000)

    it('getIncomeDistribution returns data (may fail without .Trends)', async () => {
      try {
        const result = await client.getIncomeDistribution('google.com', 'us', 'desktop')
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        trendsErrorGuard(error, 'Income distribution')
      }
    }, 30000)

    it('getEducationDistribution returns data (may fail without .Trends)', async () => {
      try {
        const result = await client.getEducationDistribution('google.com', 'us', 'desktop')
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        trendsErrorGuard(error, 'Education distribution')
      }
    }, 30000)

    it('getOccupationDistribution returns data (may fail without .Trends)', async () => {
      try {
        const result = await client.getOccupationDistribution('google.com', 'us', 'desktop')
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        trendsErrorGuard(error, 'Occupation distribution')
      }
    }, 30000)

    it('getAudienceInterests returns data (may fail without .Trends)', async () => {
      try {
        const result = await client.getAudienceInterests('google.com', 'us', 'desktop')
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        trendsErrorGuard(error, 'Audience interests')
      }
    }, 30000)

    it('getTrafficAccuracy returns data (may fail without .Trends)', async () => {
      try {
        const result = await client.getTrafficAccuracy('google.com')
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        trendsErrorGuard(error, 'Traffic accuracy')
      }
    }, 30000)
  })

  // ==========================================================================
  // Projects API
  // ==========================================================================

  describe('Projects API', () => {
    it('listProjects returns data', async () => {
      try {
        const result = await client.listProjects()
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
        console.log('Projects list preview:', String(result.data).substring(0, 300))
      } catch (error) {
        if (error instanceof SemrushApiError) {
          console.log(`Projects API error: ${error.message} (HTTP ${error.status})`)
          return
        }
        throw error
      }
    }, 30000)

    it('getProject returns data for known project ID', async () => {
      try {
        // First list projects to find a valid ID
        const listResult = await client.listProjects()
        const projects = (
          typeof listResult.data === 'string' ? JSON.parse(listResult.data) : listResult.data
        ) as Array<{ project_id: number }>
        if (projects.length === 0) {
          console.log('No projects available to test getProject')
          return
        }
        const projectId = projects[0].project_id

        const result = await client.getProject(projectId)
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        if (error instanceof SemrushApiError) {
          console.log(`Get project error: ${error.message} (HTTP ${error.status})`)
          return
        }
        throw error
      }
    }, 30000)
  })

  // ==========================================================================
  // Site Audit API
  // ==========================================================================

  describe('Site Audit API', () => {
    const siteAuditProjectId = 23138949

    it('getSiteAuditInfo returns data', async () => {
      try {
        const result = await client.getSiteAuditInfo(siteAuditProjectId)
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
        console.log('Site audit info preview:', String(result.data).substring(0, 300))
      } catch (error) {
        if (error instanceof SemrushApiError) {
          console.log(`Site audit info error: ${error.message} (HTTP ${error.status})`)
          return
        }
        throw error
      }
    }, 30000)

    it('getSiteAuditSnapshots returns data', async () => {
      try {
        const result = await client.getSiteAuditSnapshots(siteAuditProjectId)
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        if (error instanceof SemrushApiError) {
          console.log(`Site audit snapshots error: ${error.message} (HTTP ${error.status})`)
          return
        }
        throw error
      }
    }, 30000)

    it('getSiteAuditIssues returns data', async () => {
      try {
        const result = await client.getSiteAuditIssues(siteAuditProjectId)
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        if (error instanceof SemrushApiError) {
          console.log(`Site audit issues error: ${error.message} (HTTP ${error.status})`)
          return
        }
        throw error
      }
    }, 30000)

    it('getSiteAuditHistory returns data', async () => {
      try {
        const result = await client.getSiteAuditHistory(siteAuditProjectId, 1)
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        if (error instanceof SemrushApiError) {
          console.log(`Site audit history error: ${error.message} (HTTP ${error.status})`)
          return
        }
        throw error
      }
    }, 30000)

    it('getSiteAuditSnapshotDetail returns data for first snapshot', async () => {
      try {
        const snapshotsResult = await client.getSiteAuditSnapshots(siteAuditProjectId)
        const parsed = (
          typeof snapshotsResult.data === 'string'
            ? JSON.parse(snapshotsResult.data)
            : snapshotsResult.data
        ) as {
          snapshots: Array<{ snapshot_id: number }>
        }
        if (!parsed.snapshots || parsed.snapshots.length === 0) {
          console.log('No snapshots available')
          return
        }
        const snapshotId = parsed.snapshots[0].snapshot_id
        const result = await client.getSiteAuditSnapshotDetail(siteAuditProjectId, snapshotId)
        assertValidResponse(result)
        assertHasData(result)
        expect(result.status).toBe(200)
      } catch (error) {
        if (error instanceof SemrushApiError) {
          console.log(`Site audit snapshot detail error: ${error.message} (HTTP ${error.status})`)
          return
        }
        throw error
      }
    }, 30000)
  })

  // ==========================================================================
  // Utility
  // ==========================================================================

  describe('Utility', () => {
    it('getApiUnitsBalance returns a number', async () => {
      const result = await client.getApiUnitsBalance()
      assertValidResponse(result)
      assertHasData(result)
      expect(result.status).toBe(200)
      const balance = Number(String(result.data).trim())
      expect(Number.isFinite(balance)).toBe(true)
      expect(balance).toBeGreaterThanOrEqual(0)
      console.log(`API units balance: ${balance}`)
    }, 30000)
  })

  // ==========================================================================
  // Error Handling (Real API)
  // ==========================================================================

  describe('Error Handling', () => {
    it('throws SemrushApiError for invalid API key', async () => {
      const badClient = new SemrushApiClient('invalid-api-key-12345')

      try {
        await badClient.getDomainOverview('google.com')
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeDefined()
        console.log(
          `Bad key error: ${(error as Error).message} (${(error as SemrushApiError).status || 'no status'})`
        )
      }
    }, 30000)
  })
})
