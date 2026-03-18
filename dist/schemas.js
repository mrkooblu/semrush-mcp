/**
 * Shared Zod validation schemas for Semrush MCP + CLI
 *
 * All parameter schemas live here so both entry points (MCP server and CLI)
 * validate inputs identically. TypeScript types are inferred from the schemas
 * via z.infer — never define a parallel interface by hand.
 */
import { z } from 'zod';
// ============================================================================
// Shared validation messages
// ============================================================================
const PROJECT_ID_MSG = 'Project ID is required';
const URL_REQUIRED_MSG = 'URL is required';
const SUBFOLDER_MSG = 'Subfolder is required (e.g. domain.com/blog/)';
const TARGET_DOMAIN_MSG = 'Target domain is required';
// Reusable project_id field
const projectIdField = z.number().positive(PROJECT_ID_MSG);
// ============================================================================
// Domain Schemas
// ============================================================================
export const DomainParamsSchema = z.object({
    domain: z.string().min(1, 'Domain is required'),
    database: z.string().optional().default('us'),
    limit: z.number().positive().optional(),
});
// ============================================================================
// Rank Difference Schema (no domain param)
// ============================================================================
export const RankDifferenceParamsSchema = z.object({
    database: z.string().optional().default('us'),
    limit: z.number().positive().optional(),
});
// ============================================================================
// Target (Backlinks) Schemas
// ============================================================================
export const TargetParamsSchema = z.object({
    target: z.string().min(1, 'Target domain/URL is required'),
    limit: z.number().positive().optional(),
});
export const BacklinksTargetParamsSchema = z.object({
    target: z.string().min(1, 'Target domain/URL is required'),
    target_type: z.enum(['root_domain', 'domain', 'url']).optional().default('root_domain'),
    limit: z.number().positive().optional(),
});
// ============================================================================
// URL Schemas
// ============================================================================
export const UrlParamsSchema = z.object({
    url: z.string().min(1, URL_REQUIRED_MSG),
    database: z.string().optional().default('us'),
    limit: z.number().positive().optional(),
});
/** URL reports that do not take a database param (e.g. url_ranks) */
export const UrlNoDatabaseParamsSchema = z.object({
    url: z.string().min(1, URL_REQUIRED_MSG),
    limit: z.number().positive().optional(),
});
// ============================================================================
// Subdomain Schemas
// ============================================================================
export const SubdomainParamsSchema = z.object({
    subdomain: z.string().min(1, 'Subdomain is required'),
    database: z.string().optional().default('us'),
    limit: z.number().positive().optional(),
});
/** Subdomain reports with no database param (e.g. subdomain_ranks) */
export const SubdomainNoDatabaseParamsSchema = z.object({
    subdomain: z.string().min(1, 'Subdomain is required'),
    limit: z.number().positive().optional(),
});
// ============================================================================
// Subfolder Schemas
// ============================================================================
export const SubfolderParamsSchema = z.object({
    subfolder: z.string().min(1, SUBFOLDER_MSG),
    database: z.string().optional().default('us'),
    limit: z.number().positive().optional(),
});
/** Subfolder reports with no database param (e.g. subfolder_ranks) */
export const SubfolderNoDatabaseParamsSchema = z.object({
    subfolder: z.string().min(1, SUBFOLDER_MSG),
    limit: z.number().positive().optional(),
});
// ============================================================================
// Keyword Schemas
// ============================================================================
export const KeywordParamsSchema = z.object({
    keyword: z.string().min(1, 'Keyword is required'),
    database: z.string().optional().default('us'),
    limit: z.number().positive().optional(),
});
/** Keyword overview requiring a specific database (phrase_this, phrase_organic, etc.) */
export const KeywordDbRequiredParamsSchema = z.object({
    keyword: z.string().min(1, 'Keyword is required'),
    database: z.string().min(1, 'Database is required'),
    limit: z.number().positive().optional(),
});
// ============================================================================
// Batch Keyword Schemas
// ============================================================================
export const BatchKeywordParamsSchema = z.object({
    keywords: z
        .array(z.string().min(1))
        .min(1, 'At least one keyword is required')
        .max(100, 'Maximum 100 keywords'),
    database: z.string().optional().default('us'),
});
// ============================================================================
// Traffic Schemas
// ============================================================================
export const TrafficDomainsParamsSchema = z.object({
    domains: z.array(z.string().min(1)).min(1, 'At least one domain is required'),
    country: z.string().optional().default('us'),
});
export const TrafficDomainParamsSchema = z.object({
    domain: z.string().min(1, 'Domain is required'),
    country: z.string().optional().default('us'),
});
/** Trends endpoints that support device_type */
export const TrendsTargetParamsSchema = z.object({
    target: z.string().min(1, TARGET_DOMAIN_MSG),
    country: z.string().optional().default('us'),
    device_type: z.enum(['desktop', 'mobile']).optional(),
    display_date: z.string().optional(),
    limit: z.number().positive().optional(),
});
/** Trends audience insights (multiple targets) */
export const TrendsAudienceInsightsParamsSchema = z.object({
    targets: z.array(z.string().min(1)).min(1, 'At least one target is required'),
    selected_targets: z.array(z.string().min(1)).min(1, 'At least one selected target is required'),
    limit: z.number().positive().optional(),
});
/** Trends purchase conversion endpoint (desktop only, no device_type param) */
export const TrendsPurchaseConversionParamsSchema = z.object({
    target: z.string().min(1, TARGET_DOMAIN_MSG),
    country: z.string().optional().default('us'),
    display_date: z.string().optional(),
    limit: z.number().positive().optional(),
});
/** Trends accuracy endpoint (no country/device_type) */
export const TrendsAccuracyParamsSchema = z.object({
    target: z.string().min(1, TARGET_DOMAIN_MSG),
    display_date: z.string().optional(),
    limit: z.number().positive().optional(),
});
// ============================================================================
// Projects API Schemas
// ============================================================================
export const ProjectIdParamsSchema = z.object({
    project_id: projectIdField,
});
export const ProjectCreateParamsSchema = z.object({
    url: z.string().min(1, URL_REQUIRED_MSG),
    project_name: z.string().optional(),
});
export const ProjectUpdateParamsSchema = z.object({
    project_id: projectIdField,
    project_name: z.string().min(1, 'Project name is required'),
});
// ============================================================================
// Site Audit API Schemas
// ============================================================================
/** Reused for info, snapshots, issues, and launch — all take only project_id */
export const SiteAuditInfoParamsSchema = ProjectIdParamsSchema;
export const SiteAuditSnapshotsParamsSchema = ProjectIdParamsSchema;
export const SiteAuditSnapshotDetailParamsSchema = z.object({
    project_id: projectIdField,
    snapshot_id: z.number().positive('Snapshot ID is required'),
});
export const SiteAuditIssuesParamsSchema = ProjectIdParamsSchema;
export const SiteAuditPagesParamsSchema = z.object({
    project_id: projectIdField,
    url: z.string().min(1, 'URL pattern is required'),
    limit: z.number().positive().optional(),
    page: z.number().positive().optional(),
});
export const SiteAuditPageDetailParamsSchema = z.object({
    project_id: projectIdField,
    page_id: z.number().positive('Page ID is required'),
});
export const SiteAuditHistoryParamsSchema = z.object({
    project_id: projectIdField,
    limit: z.number().positive().optional(),
    offset: z.number().nonnegative().optional(),
});
export const SiteAuditLaunchParamsSchema = ProjectIdParamsSchema;
// ============================================================================
// Utility Schemas
// ============================================================================
/** Empty schema for tools that take no parameters */
export const EmptyParamsSchema = z.object({});
/** @deprecated Use EmptyParamsSchema instead */
export const CheckParamsSchema = EmptyParamsSchema;
// ============================================================================
// Keyword Gap Schemas (CLI only — not exposed as MCP tool yet)
// ============================================================================
export const KeywordGapParamsSchema = z.object({
    domains: z.array(z.string().min(1)).min(2, 'At least two domains are required'),
    database: z.string().optional().default('us'),
    limit: z.number().positive().optional(),
});
