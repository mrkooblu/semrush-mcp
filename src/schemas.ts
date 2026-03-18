/**
 * Shared Zod validation schemas for Semrush MCP + CLI
 *
 * All parameter schemas live here so both entry points (MCP server and CLI)
 * validate inputs identically. TypeScript types are inferred from the schemas
 * via z.infer — never define a parallel interface by hand.
 */
import { z } from 'zod'

// ============================================================================
// Shared validation messages
// ============================================================================

const PROJECT_ID_MSG = 'Project ID is required'
const URL_REQUIRED_MSG = 'URL is required'
const SUBFOLDER_MSG = 'Subfolder is required (e.g. domain.com/blog/)'
const TARGET_DOMAIN_MSG = 'Target domain is required'

// Reusable project_id field
const projectIdField = z.number().positive(PROJECT_ID_MSG)

// ============================================================================
// Domain Schemas
// ============================================================================

export const DomainParamsSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
  database: z.string().optional().default('us'),
  limit: z.number().positive().optional(),
})

export type DomainParams = z.infer<typeof DomainParamsSchema>

// ============================================================================
// Rank Difference Schema (no domain param)
// ============================================================================

export const RankDifferenceParamsSchema = z.object({
  database: z.string().optional().default('us'),
  limit: z.number().positive().optional(),
})

export type RankDifferenceParams = z.infer<typeof RankDifferenceParamsSchema>

// ============================================================================
// Target (Backlinks) Schemas
// ============================================================================

export const TargetParamsSchema = z.object({
  target: z.string().min(1, 'Target domain/URL is required'),
  limit: z.number().positive().optional(),
})

export type TargetParams = z.infer<typeof TargetParamsSchema>

export const BacklinksTargetParamsSchema = z.object({
  target: z.string().min(1, 'Target domain/URL is required'),
  target_type: z.enum(['root_domain', 'domain', 'url']).optional().default('root_domain'),
  limit: z.number().positive().optional(),
})

export type BacklinksTargetParams = z.infer<typeof BacklinksTargetParamsSchema>

// ============================================================================
// URL Schemas
// ============================================================================

export const UrlParamsSchema = z.object({
  url: z.string().min(1, URL_REQUIRED_MSG),
  database: z.string().optional().default('us'),
  limit: z.number().positive().optional(),
})

export type UrlParams = z.infer<typeof UrlParamsSchema>

/** URL reports that do not take a database param (e.g. url_ranks) */
export const UrlNoDatabaseParamsSchema = z.object({
  url: z.string().min(1, URL_REQUIRED_MSG),
  limit: z.number().positive().optional(),
})

export type UrlNoDatabaseParams = z.infer<typeof UrlNoDatabaseParamsSchema>

// ============================================================================
// Subdomain Schemas
// ============================================================================

export const SubdomainParamsSchema = z.object({
  subdomain: z.string().min(1, 'Subdomain is required'),
  database: z.string().optional().default('us'),
  limit: z.number().positive().optional(),
})

export type SubdomainParams = z.infer<typeof SubdomainParamsSchema>

/** Subdomain reports with no database param (e.g. subdomain_ranks) */
export const SubdomainNoDatabaseParamsSchema = z.object({
  subdomain: z.string().min(1, 'Subdomain is required'),
  limit: z.number().positive().optional(),
})

export type SubdomainNoDatabaseParams = z.infer<typeof SubdomainNoDatabaseParamsSchema>

// ============================================================================
// Subfolder Schemas
// ============================================================================

export const SubfolderParamsSchema = z.object({
  subfolder: z.string().min(1, SUBFOLDER_MSG),
  database: z.string().optional().default('us'),
  limit: z.number().positive().optional(),
})

export type SubfolderParams = z.infer<typeof SubfolderParamsSchema>

/** Subfolder reports with no database param (e.g. subfolder_ranks) */
export const SubfolderNoDatabaseParamsSchema = z.object({
  subfolder: z.string().min(1, SUBFOLDER_MSG),
  limit: z.number().positive().optional(),
})

export type SubfolderNoDatabaseParams = z.infer<typeof SubfolderNoDatabaseParamsSchema>

// ============================================================================
// Keyword Schemas
// ============================================================================

export const KeywordParamsSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required'),
  database: z.string().optional().default('us'),
  limit: z.number().positive().optional(),
})

export type KeywordParams = z.infer<typeof KeywordParamsSchema>

/** Keyword overview requiring a specific database (phrase_this, phrase_organic, etc.) */
export const KeywordDbRequiredParamsSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required'),
  database: z.string().min(1, 'Database is required'),
  limit: z.number().positive().optional(),
})

export type KeywordDbRequiredParams = z.infer<typeof KeywordDbRequiredParamsSchema>

// ============================================================================
// Batch Keyword Schemas
// ============================================================================

export const BatchKeywordParamsSchema = z.object({
  keywords: z
    .array(z.string().min(1))
    .min(1, 'At least one keyword is required')
    .max(100, 'Maximum 100 keywords'),
  database: z.string().optional().default('us'),
})

export type BatchKeywordParams = z.infer<typeof BatchKeywordParamsSchema>

// ============================================================================
// Traffic Schemas
// ============================================================================

export const TrafficDomainsParamsSchema = z.object({
  domains: z.array(z.string().min(1)).min(1, 'At least one domain is required'),
  country: z.string().optional().default('us'),
})

export type TrafficDomainsParams = z.infer<typeof TrafficDomainsParamsSchema>

export const TrafficDomainParamsSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
  country: z.string().optional().default('us'),
})

export type TrafficDomainParams = z.infer<typeof TrafficDomainParamsSchema>

/** Trends endpoints that support device_type */
export const TrendsTargetParamsSchema = z.object({
  target: z.string().min(1, TARGET_DOMAIN_MSG),
  country: z.string().optional().default('us'),
  device_type: z.enum(['desktop', 'mobile']).optional(),
  display_date: z.string().optional(),
  limit: z.number().positive().optional(),
})

export type TrendsTargetParams = z.infer<typeof TrendsTargetParamsSchema>

/** Trends audience insights (multiple targets) */
export const TrendsAudienceInsightsParamsSchema = z.object({
  targets: z.array(z.string().min(1)).min(1, 'At least one target is required'),
  selected_targets: z.array(z.string().min(1)).min(1, 'At least one selected target is required'),
  limit: z.number().positive().optional(),
})

export type TrendsAudienceInsightsParams = z.infer<typeof TrendsAudienceInsightsParamsSchema>

/** Trends purchase conversion endpoint (desktop only, no device_type param) */
export const TrendsPurchaseConversionParamsSchema = z.object({
  target: z.string().min(1, TARGET_DOMAIN_MSG),
  country: z.string().optional().default('us'),
  display_date: z.string().optional(),
  limit: z.number().positive().optional(),
})

export type TrendsPurchaseConversionParams = z.infer<typeof TrendsPurchaseConversionParamsSchema>

/** Trends accuracy endpoint (no country/device_type) */
export const TrendsAccuracyParamsSchema = z.object({
  target: z.string().min(1, TARGET_DOMAIN_MSG),
  display_date: z.string().optional(),
  limit: z.number().positive().optional(),
})

export type TrendsAccuracyParams = z.infer<typeof TrendsAccuracyParamsSchema>

// ============================================================================
// Projects API Schemas
// ============================================================================

export const ProjectIdParamsSchema = z.object({
  project_id: projectIdField,
})

export type ProjectIdParams = z.infer<typeof ProjectIdParamsSchema>

export const ProjectCreateParamsSchema = z.object({
  url: z.string().min(1, URL_REQUIRED_MSG),
  project_name: z.string().optional(),
})

export type ProjectCreateParams = z.infer<typeof ProjectCreateParamsSchema>

export const ProjectUpdateParamsSchema = z.object({
  project_id: projectIdField,
  project_name: z.string().min(1, 'Project name is required'),
})

export type ProjectUpdateParams = z.infer<typeof ProjectUpdateParamsSchema>

// ============================================================================
// Site Audit API Schemas
// ============================================================================

/** Reused for info, snapshots, issues, and launch — all take only project_id */
export const SiteAuditInfoParamsSchema = ProjectIdParamsSchema

export type SiteAuditInfoParams = z.infer<typeof SiteAuditInfoParamsSchema>

export const SiteAuditSnapshotsParamsSchema = ProjectIdParamsSchema

export type SiteAuditSnapshotsParams = z.infer<typeof SiteAuditSnapshotsParamsSchema>

export const SiteAuditSnapshotDetailParamsSchema = z.object({
  project_id: projectIdField,
  snapshot_id: z.number().positive('Snapshot ID is required'),
})

export type SiteAuditSnapshotDetailParams = z.infer<typeof SiteAuditSnapshotDetailParamsSchema>

export const SiteAuditIssuesParamsSchema = ProjectIdParamsSchema

export type SiteAuditIssuesParams = z.infer<typeof SiteAuditIssuesParamsSchema>

export const SiteAuditPagesParamsSchema = z.object({
  project_id: projectIdField,
  url: z.string().min(1, 'URL pattern is required'),
  limit: z.number().positive().optional(),
  page: z.number().positive().optional(),
})

export type SiteAuditPagesParams = z.infer<typeof SiteAuditPagesParamsSchema>

export const SiteAuditPageDetailParamsSchema = z.object({
  project_id: projectIdField,
  page_id: z.number().positive('Page ID is required'),
})

export type SiteAuditPageDetailParams = z.infer<typeof SiteAuditPageDetailParamsSchema>

export const SiteAuditHistoryParamsSchema = z.object({
  project_id: projectIdField,
  limit: z.number().positive().optional(),
  offset: z.number().nonnegative().optional(),
})

export type SiteAuditHistoryParams = z.infer<typeof SiteAuditHistoryParamsSchema>

export const SiteAuditLaunchParamsSchema = ProjectIdParamsSchema

export type SiteAuditLaunchParams = z.infer<typeof SiteAuditLaunchParamsSchema>

// ============================================================================
// Utility Schemas
// ============================================================================

/** Empty schema for tools that take no parameters */
export const EmptyParamsSchema = z.object({})

export type EmptyParams = z.infer<typeof EmptyParamsSchema>

/** @deprecated Use EmptyParamsSchema instead */
export const CheckParamsSchema = EmptyParamsSchema

export type CheckParams = z.infer<typeof CheckParamsSchema>

// ============================================================================
// Keyword Gap Schemas (CLI only — not exposed as MCP tool yet)
// ============================================================================

export const KeywordGapParamsSchema = z.object({
  domains: z.array(z.string().min(1)).min(2, 'At least two domains are required'),
  database: z.string().optional().default('us'),
  limit: z.number().positive().optional(),
})

export type KeywordGapParams = z.infer<typeof KeywordGapParamsSchema>
