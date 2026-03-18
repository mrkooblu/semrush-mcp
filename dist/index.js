#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import chalk from 'chalk';
import { logConfigStatus, logger } from './config.js';
import { BacklinksTargetParamsSchema, BatchKeywordParamsSchema, CheckParamsSchema, DomainParamsSchema, KeywordDbRequiredParamsSchema, KeywordParamsSchema, ProjectCreateParamsSchema, ProjectIdParamsSchema, ProjectUpdateParamsSchema, RankDifferenceParamsSchema, SiteAuditHistoryParamsSchema, SiteAuditInfoParamsSchema, SiteAuditLaunchParamsSchema, SiteAuditPageDetailParamsSchema, SiteAuditPagesParamsSchema, SiteAuditSnapshotDetailParamsSchema, SiteAuditSnapshotsParamsSchema, SubdomainNoDatabaseParamsSchema, SubdomainParamsSchema, SubfolderNoDatabaseParamsSchema, SubfolderParamsSchema, TargetParamsSchema, TrafficDomainParamsSchema, TrafficDomainsParamsSchema, TrendsAccuracyParamsSchema, TrendsAudienceInsightsParamsSchema, TrendsPurchaseConversionParamsSchema, TrendsTargetParamsSchema, UrlNoDatabaseParamsSchema, UrlParamsSchema, } from './schemas.js';
import { SemrushApiError, semrushApi } from './semrush-api.js';
// Shared tool annotations — all tools are read-only API calls
const READ_ONLY_ANNOTATIONS = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
};
// Write tool annotations — for create/update/delete operations
const WRITE_ANNOTATIONS = {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
};
const DESTRUCTIVE_ANNOTATIONS = {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
};
// Helper to wrap API errors in MCP error response format
function handleApiError(error) {
    if (error instanceof SemrushApiError) {
        return {
            isError: true,
            content: [
                {
                    type: 'text',
                    text: `Error: ${error.message}. Status: ${error.status}`,
                },
            ],
        };
    }
    return {
        isError: true,
        content: [
            {
                type: 'text',
                text: `Unexpected error: ${error.message || 'Unknown error'}`,
            },
        ],
    };
}
// Helper to build a success response
function successResponse(data) {
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
}
// Create the MCP server
const server = new McpServer({
    name: 'semrush-mcp',
    version: '0.2.0',
});
// ---------------------------------------------------------------------------
// Domain Tools — Overview
// ---------------------------------------------------------------------------
server.tool('semrush_domain_overview', 'Get domain overview data including organic/paid search traffic, keywords, and rankings', DomainParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ domain, database }) => {
    try {
        const response = await semrushApi.getDomainOverview(domain, database);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_domain_overview: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_domain_rank', 'Get domain ranking in a specific database', DomainParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ domain, database, limit }) => {
    try {
        const response = await semrushApi.getDomainRank(domain, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_domain_rank: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_domain_rank_history', 'Get historical ranking data for a domain', DomainParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ domain, database, limit }) => {
    try {
        const response = await semrushApi.getDomainRankHistory(domain, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_domain_rank_history: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_rank_difference', 'Get winners and losers — domains with biggest ranking changes', RankDifferenceParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ database, limit }) => {
    try {
        const response = await semrushApi.getRankDifference(database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_rank_difference: ${error.message}`);
        return handleApiError(error);
    }
});
// ---------------------------------------------------------------------------
// Domain Tools — Keyword Reports
// ---------------------------------------------------------------------------
server.tool('semrush_domain_organic_keywords', 'Get organic keywords for a specific domain', DomainParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ domain, database, limit }) => {
    try {
        const response = await semrushApi.getDomainOrganicKeywords(domain, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_domain_organic_keywords: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_domain_paid_keywords', 'Get paid keywords for a specific domain', DomainParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ domain, database, limit }) => {
    try {
        const response = await semrushApi.getDomainPaidKeywords(domain, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_domain_paid_keywords: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_competitors', 'Get competitors for a specific domain in organic search', DomainParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ domain, database, limit }) => {
    try {
        const response = await semrushApi.getCompetitorsInOrganic(domain, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_competitors: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_paid_competitors', 'Get paid search competitors for a domain', DomainParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ domain, database, limit }) => {
    try {
        const response = await semrushApi.getPaidCompetitors(domain, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_paid_competitors: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_domain_ads_history', 'Get ads history for a domain over last 12 months', DomainParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ domain, database, limit }) => {
    try {
        const response = await semrushApi.getDomainAdsHistory(domain, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_domain_ads_history: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_domain_organic_unique', 'Get unique organic keywords grouped by URL for a domain', DomainParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ domain, database, limit }) => {
    try {
        const response = await semrushApi.getDomainOrganicUnique(domain, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_domain_organic_unique: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_domain_adwords_unique', 'Get unique paid ads for a domain', DomainParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ domain, database, limit }) => {
    try {
        const response = await semrushApi.getDomainAdwordsUnique(domain, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_domain_adwords_unique: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_domain_shopping', 'Get PLA (Product Listing Ads) search keywords for a domain', DomainParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ domain, database, limit }) => {
    try {
        const response = await semrushApi.getDomainShopping(domain, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_domain_shopping: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_domain_shopping_unique', 'Get unique shopping ads for a domain', DomainParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ domain, database, limit }) => {
    try {
        const response = await semrushApi.getDomainShoppingUnique(domain, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_domain_shopping_unique: ${error.message}`);
        return handleApiError(error);
    }
});
// ---------------------------------------------------------------------------
// URL Tools
// ---------------------------------------------------------------------------
server.tool('semrush_url_organic', 'Get organic keywords for a specific URL', UrlParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ url, database, limit }) => {
    try {
        const response = await semrushApi.getUrlOrganic(url, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_url_organic: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_url_adwords', 'Get paid keywords for a specific URL', UrlParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ url, database, limit }) => {
    try {
        const response = await semrushApi.getUrlAdwords(url, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_url_adwords: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_url_rank', 'Get ranking data for a specific URL', UrlParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ url, database, limit }) => {
    try {
        const response = await semrushApi.getUrlRank(url, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_url_rank: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_url_rank_history', 'Get historical ranking data for a specific URL', UrlParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ url, database, limit }) => {
    try {
        const response = await semrushApi.getUrlRankHistory(url, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_url_rank_history: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_url_ranks', 'Get ranking data for a URL across all databases', UrlNoDatabaseParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ url, limit }) => {
    try {
        const response = await semrushApi.getUrlRanks(url, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_url_ranks: ${error.message}`);
        return handleApiError(error);
    }
});
// ---------------------------------------------------------------------------
// Subdomain Tools
// ---------------------------------------------------------------------------
server.tool('semrush_subdomain_rank', 'Get ranking data for a subdomain in a specific database', SubdomainParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ subdomain, database, limit }) => {
    try {
        const response = await semrushApi.getSubdomainRank(subdomain, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_subdomain_rank: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_subdomain_ranks', 'Get ranking data for a subdomain across all databases', SubdomainNoDatabaseParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ subdomain, limit }) => {
    try {
        const response = await semrushApi.getSubdomainRanks(subdomain, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_subdomain_ranks: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_subdomain_rank_history', 'Get historical ranking data for a subdomain', SubdomainParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ subdomain, database, limit }) => {
    try {
        const response = await semrushApi.getSubdomainRankHistory(subdomain, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_subdomain_rank_history: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_subdomain_organic', 'Get organic keywords for a subdomain', SubdomainParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ subdomain, database, limit }) => {
    try {
        const response = await semrushApi.getSubdomainOrganic(subdomain, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_subdomain_organic: ${error.message}`);
        return handleApiError(error);
    }
});
// ---------------------------------------------------------------------------
// Subfolder Tools
// ---------------------------------------------------------------------------
server.tool('semrush_subfolder_organic', 'Get organic keywords for a subfolder (e.g. domain.com/blog/)', SubfolderParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ subfolder, database, limit }) => {
    try {
        const response = await semrushApi.getSubfolderOrganic(subfolder, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_subfolder_organic: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_subfolder_adwords', 'Get paid keywords for a subfolder', SubfolderParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ subfolder, database, limit }) => {
    try {
        const response = await semrushApi.getSubfolderAdwords(subfolder, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_subfolder_adwords: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_subfolder_rank', 'Get ranking data for a subfolder in a specific database', SubfolderParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ subfolder, database, limit }) => {
    try {
        const response = await semrushApi.getSubfolderRank(subfolder, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_subfolder_rank: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_subfolder_ranks', 'Get ranking data for a subfolder across all databases', SubfolderNoDatabaseParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ subfolder, limit }) => {
    try {
        const response = await semrushApi.getSubfolderRanks(subfolder, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_subfolder_ranks: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_subfolder_rank_history', 'Get historical ranking data for a subfolder', SubfolderParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ subfolder, database, limit }) => {
    try {
        const response = await semrushApi.getSubfolderRankHistory(subfolder, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_subfolder_rank_history: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_subfolder_organic_unique', 'Get unique organic keywords grouped by URL for a subfolder', SubfolderParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ subfolder, database, limit }) => {
    try {
        const response = await semrushApi.getSubfolderOrganicUnique(subfolder, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_subfolder_organic_unique: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_subfolder_adwords_unique', 'Get unique paid ads for a subfolder', SubfolderParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ subfolder, database, limit }) => {
    try {
        const response = await semrushApi.getSubfolderAdwordsUnique(subfolder, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_subfolder_adwords_unique: ${error.message}`);
        return handleApiError(error);
    }
});
// ---------------------------------------------------------------------------
// Backlinks Tools
// ---------------------------------------------------------------------------
server.tool('semrush_backlinks', 'Get backlinks for a specific domain or URL', TargetParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, limit }) => {
    try {
        const response = await semrushApi.getBacklinks(target, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_backlinks: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_backlinks_domains', 'Get referring domains for a specific domain or URL', TargetParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, limit }) => {
    try {
        const response = await semrushApi.getBacklinksDomains(target, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_backlinks_domains: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_backlinks_overview', 'Get backlinks overview summary stats for a target', BacklinksTargetParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, target_type }) => {
    try {
        const response = await semrushApi.getBacklinksOverview(target, target_type);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_backlinks_overview: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_backlinks_pages', 'Get indexed pages with backlink data for a target', BacklinksTargetParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, target_type, limit }) => {
    try {
        const response = await semrushApi.getBacklinksPages(target, target_type, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_backlinks_pages: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_backlinks_anchors', 'Get anchor text distribution for a target', BacklinksTargetParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, target_type, limit }) => {
    try {
        const response = await semrushApi.getBacklinksAnchors(target, target_type, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_backlinks_anchors: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_backlinks_tld', 'Get referring domains by TLD for a target', BacklinksTargetParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, target_type, limit }) => {
    try {
        const response = await semrushApi.getBacklinksTld(target, target_type, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_backlinks_tld: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_backlinks_categories', 'Get domain categories for a target based on backlinks', BacklinksTargetParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, target_type, limit }) => {
    try {
        const response = await semrushApi.getBacklinksCategories(target, target_type, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_backlinks_categories: ${error.message}`);
        return handleApiError(error);
    }
});
// ---------------------------------------------------------------------------
// Keyword Tools (database optional)
// ---------------------------------------------------------------------------
server.tool('semrush_keyword_overview', 'Get overview data for a specific keyword', KeywordParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ keyword, database }) => {
    try {
        const response = await semrushApi.getKeywordOverview(keyword, database);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_keyword_overview: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_related_keywords', 'Get related keywords for a specific keyword', KeywordParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ keyword, database, limit }) => {
    try {
        const response = await semrushApi.getRelatedKeywords(keyword, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_related_keywords: ${error.message}`);
        return handleApiError(error);
    }
});
// ---------------------------------------------------------------------------
// Keyword Tools (database required)
// ---------------------------------------------------------------------------
server.tool('semrush_keyword_overview_single_db', 'Get detailed overview data for a keyword from a specific database (10 API units per line)', KeywordDbRequiredParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ keyword, database }) => {
    try {
        const response = await semrushApi.getKeywordOverviewSingleDb(keyword, database);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_keyword_overview_single_db: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_batch_keyword_overview', 'Analyze up to 100 keywords at once in a specific database (10 API units per line)', BatchKeywordParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ keywords, database }) => {
    try {
        const response = await semrushApi.getBatchKeywordOverview(keywords, database);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_batch_keyword_overview: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_keyword_organic_results', "Get domains ranking in Google's top 100 for a keyword (10 API units per line)", KeywordDbRequiredParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ keyword, database, limit }) => {
    try {
        const response = await semrushApi.getKeywordOrganicResults(keyword, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_keyword_organic_results: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_keyword_paid_results', "Get domains in Google's paid search results for a keyword (20 API units per line)", KeywordDbRequiredParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ keyword, database, limit }) => {
    try {
        const response = await semrushApi.getKeywordPaidResults(keyword, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_keyword_paid_results: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_keyword_ads_history', 'Get domains that bid on a keyword in the last 12 months (100 API units per line)', KeywordDbRequiredParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ keyword, database, limit }) => {
    try {
        const response = await semrushApi.getKeywordAdsHistory(keyword, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_keyword_ads_history: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_broad_match_keywords', 'Get broad matches and alternate search queries for a keyword (20 API units per line)', KeywordDbRequiredParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ keyword, database, limit }) => {
    try {
        const response = await semrushApi.getBroadMatchKeywords(keyword, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_broad_match_keywords: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_phrase_questions', 'Get question-based keywords related to a term (40 API units per line)', KeywordDbRequiredParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ keyword, database, limit }) => {
    try {
        const response = await semrushApi.getPhraseQuestions(keyword, database, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_phrase_questions: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_keyword_difficulty', "Get difficulty index for ranking in Google's top 10 (50 API units per line)", BatchKeywordParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ keywords, database }) => {
    try {
        const response = await semrushApi.getKeywordDifficulty(keywords, database);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_keyword_difficulty: ${error.message}`);
        return handleApiError(error);
    }
});
// ---------------------------------------------------------------------------
// Traffic Tools (Trends API)
// ---------------------------------------------------------------------------
server.tool('semrush_traffic_summary', 'Get traffic summary data for domains (requires .Trends API access)', TrafficDomainsParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ domains, country }) => {
    try {
        const response = await semrushApi.getTrafficSummary(domains, country);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_traffic_summary: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_traffic_sources', 'Get traffic sources data for a domain (requires .Trends API access)', TrafficDomainParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ domain, country }) => {
    try {
        const response = await semrushApi.getTrafficSources(domain, country);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_traffic_sources: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_traffic_destinations', 'Get outbound traffic destinations for a domain (requires .Trends)', TrendsTargetParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, country, device_type, display_date, limit }) => {
    try {
        const response = await semrushApi.getTrafficDestinations(target, country, device_type, display_date, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_traffic_destinations: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_traffic_geo', 'Get geographic distribution of traffic for a domain (requires .Trends)', TrendsTargetParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, country, device_type, display_date, limit }) => {
    try {
        const response = await semrushApi.getTrafficGeo(target, country, device_type, display_date, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_traffic_geo: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_traffic_subdomains', 'Get subdomain traffic distribution for a domain (requires .Trends)', TrendsTargetParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, country, device_type, display_date, limit }) => {
    try {
        const response = await semrushApi.getTrafficSubdomains(target, country, device_type, display_date, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_traffic_subdomains: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_traffic_subfolders', 'Get subfolder traffic distribution for a domain (requires .Trends)', TrendsTargetParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, country, device_type, display_date, limit }) => {
    try {
        const response = await semrushApi.getTrafficSubfolders(target, country, device_type, display_date, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_traffic_subfolders: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_traffic_top_pages', 'Get top pages by traffic for a domain (requires .Trends)', TrendsTargetParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, country, device_type, display_date, limit }) => {
    try {
        const response = await semrushApi.getTrafficTopPages(target, country, device_type, display_date, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_traffic_top_pages: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_traffic_rank', 'Get traffic rank for a domain (requires .Trends)', TrendsTargetParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, country, device_type, display_date, limit }) => {
    try {
        const response = await semrushApi.getTrafficRank(target, country, device_type, display_date, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_traffic_rank: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_traffic_social_media', 'Get social media traffic distribution for a domain (requires .Trends)', TrendsTargetParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, country, device_type, display_date, limit }) => {
    try {
        const response = await semrushApi.getTrafficSocialMedia(target, country, device_type, display_date, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_traffic_social_media: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_audience_insights', 'Get audience overlap and similarity data between domains (requires .Trends)', TrendsAudienceInsightsParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ targets, selected_targets, limit }) => {
    try {
        const response = await semrushApi.getAudienceInsights(targets, selected_targets, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_audience_insights: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_purchase_conversion', 'Get purchase conversion rate for a domain (requires .Trends, desktop only)', TrendsPurchaseConversionParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, country, display_date, limit }) => {
    try {
        const response = await semrushApi.getPurchaseConversion(target, country, display_date, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_purchase_conversion: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_household_distribution', 'Get household size distribution of audience (requires .Trends)', TrendsTargetParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, country, device_type, display_date, limit }) => {
    try {
        const response = await semrushApi.getHouseholdDistribution(target, country, device_type, display_date, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_household_distribution: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_income_distribution', 'Get income distribution of audience (requires .Trends)', TrendsTargetParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, country, device_type, display_date, limit }) => {
    try {
        const response = await semrushApi.getIncomeDistribution(target, country, device_type, display_date, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_income_distribution: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_education_distribution', 'Get education level distribution of audience (requires .Trends)', TrendsTargetParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, country, device_type, display_date, limit }) => {
    try {
        const response = await semrushApi.getEducationDistribution(target, country, device_type, display_date, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_education_distribution: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_occupation_distribution', 'Get occupation distribution of audience (requires .Trends)', TrendsTargetParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, country, device_type, display_date, limit }) => {
    try {
        const response = await semrushApi.getOccupationDistribution(target, country, device_type, display_date, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_occupation_distribution: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_audience_interests', 'Get audience interest categories for a domain (requires .Trends)', TrendsTargetParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, country, device_type, display_date, limit }) => {
    try {
        const response = await semrushApi.getAudienceInterests(target, country, device_type, display_date, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_audience_interests: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_traffic_accuracy', 'Get data accuracy score for traffic analytics (requires .Trends)', TrendsAccuracyParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ target, display_date, limit }) => {
    try {
        const response = await semrushApi.getTrafficAccuracy(target, display_date, limit);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_traffic_accuracy: ${error.message}`);
        return handleApiError(error);
    }
});
// ---------------------------------------------------------------------------
// Projects API Tools
// ---------------------------------------------------------------------------
server.tool('semrush_list_projects', 'List all Semrush projects', CheckParamsSchema.shape, READ_ONLY_ANNOTATIONS, async () => {
    try {
        const response = await semrushApi.listProjects();
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_list_projects: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_get_project', 'Get details of a specific Semrush project', ProjectIdParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ project_id }) => {
    try {
        const response = await semrushApi.getProject(project_id);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_get_project: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_create_project', 'Create a new Semrush project', ProjectCreateParamsSchema.shape, WRITE_ANNOTATIONS, async ({ url, project_name }) => {
    try {
        const response = await semrushApi.createProject(url, project_name);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_create_project: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_update_project', 'Update a Semrush project name', ProjectUpdateParamsSchema.shape, WRITE_ANNOTATIONS, async ({ project_id, project_name }) => {
    try {
        const response = await semrushApi.updateProject(project_id, project_name);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_update_project: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_delete_project', 'Delete a Semrush project', ProjectIdParamsSchema.shape, DESTRUCTIVE_ANNOTATIONS, async ({ project_id }) => {
    try {
        const response = await semrushApi.deleteProject(project_id);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_delete_project: ${error.message}`);
        return handleApiError(error);
    }
});
// ---------------------------------------------------------------------------
// Site Audit Tools
// ---------------------------------------------------------------------------
server.tool('semrush_site_audit_info', 'Get site audit information for a project', SiteAuditInfoParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ project_id }) => {
    try {
        const response = await semrushApi.getSiteAuditInfo(project_id);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_site_audit_info: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_site_audit_snapshots', 'List site audit snapshots for a project', SiteAuditSnapshotsParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ project_id }) => {
    try {
        const response = await semrushApi.getSiteAuditSnapshots(project_id);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_site_audit_snapshots: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_site_audit_snapshot_detail', 'Get detailed site audit snapshot data', SiteAuditSnapshotDetailParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ project_id, snapshot_id }) => {
    try {
        const response = await semrushApi.getSiteAuditSnapshotDetail(project_id, snapshot_id);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_site_audit_snapshot_detail: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_site_audit_issues', 'Get issue metadata for site audit', ProjectIdParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ project_id }) => {
    try {
        const response = await semrushApi.getSiteAuditIssues(project_id);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_site_audit_issues: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_site_audit_pages', 'List pages from a site audit', SiteAuditPagesParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ project_id, url, limit, page }) => {
    try {
        const response = await semrushApi.getSiteAuditPages(project_id, url, limit, page);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_site_audit_pages: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_site_audit_page_detail', 'Get detailed audit data for a specific page', SiteAuditPageDetailParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ project_id, page_id }) => {
    try {
        const response = await semrushApi.getSiteAuditPageDetail(project_id, page_id);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_site_audit_page_detail: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_site_audit_history', 'Get site audit crawl history', SiteAuditHistoryParamsSchema.shape, READ_ONLY_ANNOTATIONS, async ({ project_id, limit, offset }) => {
    try {
        const response = await semrushApi.getSiteAuditHistory(project_id, limit, offset);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_site_audit_history: ${error.message}`);
        return handleApiError(error);
    }
});
server.tool('semrush_site_audit_launch', 'Launch a new site audit crawl for a project', SiteAuditLaunchParamsSchema.shape, WRITE_ANNOTATIONS, async ({ project_id }) => {
    try {
        const response = await semrushApi.launchSiteAuditCrawl(project_id);
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_site_audit_launch: ${error.message}`);
        return handleApiError(error);
    }
});
// ---------------------------------------------------------------------------
// Utility Tools
// ---------------------------------------------------------------------------
server.tool('semrush_api_units_balance', 'Check the remaining API units balance', CheckParamsSchema.shape, READ_ONLY_ANNOTATIONS, async () => {
    try {
        const response = await semrushApi.getApiUnitsBalance();
        return successResponse(response.data);
    }
    catch (error) {
        logger.error(`Error in semrush_api_units_balance: ${error.message}`);
        return handleApiError(error);
    }
});
// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------
async function runServer() {
    try {
        logConfigStatus();
        logger.info(chalk.green('Starting Semrush MCP Server...'));
        const transport = new StdioServerTransport();
        await server.connect(transport);
        logger.info(chalk.green('Semrush MCP Server is running and ready to process requests'));
    }
    catch (error) {
        logger.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
}
runServer().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Unhandled error: ${message}`);
    process.exit(1);
});
