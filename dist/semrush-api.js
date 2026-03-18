import axios, { AxiosError } from 'axios';
import NodeCache from 'node-cache';
import { config, logger } from './config.js';
// Base API URLs
const SEMRUSH_API_BASE_URL = 'https://api.semrush.com/';
const BACKLINKS_API_BASE_URL = 'https://api.semrush.com/analytics/v1/';
const TRENDS_API_BASE_URL = 'https://api.semrush.com/analytics/ta/api/v3/';
const PROJECTS_API_BASE_URL = 'https://api.semrush.com/management/v1/projects';
const SITE_AUDIT_REPORTS_BASE_URL = 'https://api.semrush.com/reports/v1/projects';
// Create a cache with TTL from config
const apiCache = new NodeCache({ stdTTL: config.API_CACHE_TTL_SECONDS });
// Rate limiting implementation
class RateLimiter {
    requestTimestamps = [];
    rateLimit;
    constructor(rateLimit = config.API_RATE_LIMIT_PER_SECOND) {
        this.rateLimit = rateLimit;
    }
    canMakeRequest() {
        const now = Date.now();
        const oneSecondAgo = now - 1000;
        // Remove timestamps older than 1 second
        this.requestTimestamps = this.requestTimestamps.filter((timestamp) => timestamp > oneSecondAgo);
        // Check if we're under the rate limit
        return this.requestTimestamps.length < this.rateLimit;
    }
    recordRequest() {
        this.requestTimestamps.push(Date.now());
    }
    async waitForRateLimit() {
        return new Promise((resolve) => {
            const checkRateLimit = () => {
                if (this.canMakeRequest()) {
                    this.recordRequest();
                    resolve();
                }
                else {
                    // Wait 100ms and check again
                    setTimeout(checkRateLimit, 100);
                }
            };
            checkRateLimit();
        });
    }
}
const rateLimiter = new RateLimiter();
// Error handling
export class SemrushApiError extends Error {
    status;
    response;
    constructor(message, status, response) {
        super(message);
        this.name = 'SemrushApiError';
        this.status = status;
        this.response = response;
    }
}
const MAX_RETRIES = 3;
// Common export column sets
const KEYWORD_DETAIL_COLUMNS = 'Ph,Nq,Cp,Co,Nr,Td,In,Kd';
const RANK_COLUMNS = 'Rk,Or,Ot,Oc,Ad,At,Ac';
const RANK_HISTORY_COLUMNS = 'Rk,Or,Ot,Oc,Ad,At,Ac,Dt';
const RANKS_ALL_DB_COLUMNS = 'Db,Rk,Or,Ot,Oc,Ad,At,Ac,Pu,Pk';
const ORGANIC_KEYWORD_COLUMNS = 'Ph,Po,Pp,Pd,Nq,Cp,Ur,Tr,Tc,Co,Nr,Td';
// Main API client
export class SemrushApiClient {
    apiKey;
    constructor(apiKey = config.SEMRUSH_API_KEY) {
        if (!apiKey) {
            throw new Error('Semrush API key is required');
        }
        this.apiKey = apiKey;
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    // Extract a nested error message from Axios response data
    extractAxiosErrorMessage(error) {
        const responseData = error.response?.data;
        if (typeof responseData !== 'object' || responseData === null || !('error' in responseData)) {
            return error.message;
        }
        const errorField = responseData.error;
        if (typeof errorField !== 'object' || errorField === null || !('message' in errorField)) {
            return error.message;
        }
        const nestedMsg = errorField.message;
        return typeof nestedMsg === 'string' ? nestedMsg : error.message;
    }
    // Determine whether a failed request should be retried
    shouldRetry(status, retryCount) {
        const RETRYABLE = [429, 500, 502, 503, 504];
        return RETRYABLE.includes(status) && retryCount < MAX_RETRIES;
    }
    // Build query params and optional body for the HTTP method
    buildRequestParts(method, params) {
        const sendsBody = method === 'post' || method === 'put';
        const queryParams = sendsBody
            ? { key: this.apiKey }
            : { ...params, key: this.apiKey };
        const bodyData = sendsBody ? params : undefined;
        return { queryParams, bodyData };
    }
    // Make API request with caching, rate limiting, and retry with exponential backoff
    async makeRequest(url, params = {}, options = {}, retryCount = 0) {
        const method = (options.method ?? 'get').toLowerCase();
        const isGet = method === 'get';
        const { queryParams, bodyData } = this.buildRequestParts(method, params);
        // Only cache GET requests
        const cacheKey = `${url}:${JSON.stringify(queryParams)}`;
        if (isGet) {
            const cachedResponse = apiCache.get(cacheKey);
            if (cachedResponse) {
                logger.debug(`Cache hit for request: ${url}`);
                return cachedResponse;
            }
        }
        // Wait for rate limit allowance
        await rateLimiter.waitForRateLimit();
        try {
            logger.debug(`Making ${method.toUpperCase()} request to: ${url}`);
            const response = await axios({
                method,
                url,
                params: queryParams,
                ...(bodyData ? { data: bodyData } : {}),
                ...options,
            });
            const apiResponse = {
                data: response.data,
                status: response.status,
                headers: response.headers,
            };
            if (isGet) {
                apiCache.set(cacheKey, apiResponse);
            }
            return apiResponse;
        }
        catch (error) {
            if (error instanceof AxiosError) {
                const status = error.response?.status ?? 500;
                const message = this.extractAxiosErrorMessage(error);
                if (this.shouldRetry(status, retryCount)) {
                    const attempt = retryCount + 1;
                    const delay = attempt * 2000; // 2s, 4s, 6s
                    logger.warn(`API request failed (${status}), retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})...`);
                    await this.sleep(delay);
                    return this.makeRequest(url, params, options, attempt);
                }
                logger.error(`API request failed: ${message}`);
                throw new SemrushApiError(message, status, error.response?.data);
            }
            // Handle other types of errors
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Unknown error: ${errorMessage}`);
            throw new SemrushApiError(errorMessage, 500);
        }
    }
    // =========================================================================
    // Domain Analytics — Overview Reports
    // =========================================================================
    async getDomainOverview(domain, database = 'us') {
        return this.makeRequest(SEMRUSH_API_BASE_URL, {
            type: 'domain_ranks',
            domain,
            database,
            export_columns: 'Db,Dn,Rk,Or,Ot,Oc,Ad,At,Ac,Sh,Sv',
        });
    }
    async getDomainRank(domain, database = 'us', limit) {
        const params = {
            type: 'domain_rank',
            domain,
            database,
            export_columns: 'Dn,Rk,Or,Ot,Oc,Ad,At,Ac',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getDomainRankHistory(domain, database = 'us', limit) {
        const params = {
            type: 'domain_rank_history',
            domain,
            database,
            export_columns: RANK_HISTORY_COLUMNS,
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getRankDifference(database = 'us', limit) {
        const params = {
            type: 'rank_difference',
            database,
            export_columns: 'Dn,Rk,Or,Ot,Oc,Ad,At,Ac,Om,Tm,Um,Am,Bm,Cm',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    // =========================================================================
    // Domain Analytics — Keyword Reports
    // =========================================================================
    async getDomainOrganicKeywords(domain, database = 'us', limit) {
        const params = {
            type: 'domain_organic',
            domain,
            database,
            export_columns: ORGANIC_KEYWORD_COLUMNS,
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getDomainPaidKeywords(domain, database = 'us', limit) {
        const params = {
            type: 'domain_adwords',
            domain,
            database,
            export_columns: 'Ph,Po,Pp,Pd,Ab,Nq,Cp,Tr,Tc,Co,Nr,Td',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getCompetitorsInOrganic(domain, database = 'us', limit) {
        const params = {
            type: 'domain_organic_organic',
            domain,
            database,
            export_columns: 'Dn,Cr,Np,Or,Ot,Oc,Ad,At,Ac',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getPaidCompetitors(domain, database = 'us', limit) {
        const params = {
            type: 'domain_adwords_adwords',
            domain,
            database,
            export_columns: 'Dn,Cr,Np,Ad,At,Ac,Or',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getDomainAdsHistory(domain, database = 'us', limit) {
        const params = {
            type: 'domain_adwords_historical',
            domain,
            database,
            export_columns: 'Ph,Dt,Po,Cp,Nq,Tr,Ur,Tt,Ds,Vu,Cv',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getDomainOrganicUnique(domain, database = 'us', limit) {
        const params = {
            type: 'domain_organic_unique',
            domain,
            database,
            export_columns: 'Ur,Pc,Tr,Tg',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getDomainAdwordsUnique(domain, database = 'us', limit) {
        const params = {
            type: 'domain_adwords_unique',
            domain,
            database,
            export_columns: 'Tt,Ds,Vu,Ur,Pc,Ti',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getDomainShopping(domain, database = 'us', limit) {
        const params = {
            type: 'domain_shopping',
            domain,
            database,
            export_columns: 'Ph,Po,Pp,Pd,Nq,Sn,Ur,Tt,Pp2,Ts',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getDomainShoppingUnique(domain, database = 'us', limit) {
        const params = {
            type: 'domain_shopping_unique',
            domain,
            database,
            export_columns: 'Tt,Pp2,Ur,Pc,Ti',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    // =========================================================================
    // URL Reports
    // =========================================================================
    async getUrlOrganic(url, database = 'us', limit) {
        const params = {
            type: 'url_organic',
            url,
            database,
            export_columns: 'Ph,Po,Nq,Cp,Co,Tr,Tc,Nr,Td,Fk,Ts',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getUrlAdwords(url, database = 'us', limit) {
        const params = {
            type: 'url_adwords',
            url,
            database,
            export_columns: 'Ph,Po,Nq,Cp,Co,Tr,Tc,Nr,Td,Tt,Ds',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getUrlRank(url, database = 'us', limit) {
        const params = {
            type: 'url_rank',
            url,
            database,
            export_columns: RANK_COLUMNS,
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getUrlRankHistory(url, database = 'us', limit) {
        const params = {
            type: 'url_rank_history',
            url,
            database,
            export_columns: RANK_HISTORY_COLUMNS,
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getUrlRanks(url, limit) {
        const params = {
            type: 'url_ranks',
            url,
            export_columns: RANKS_ALL_DB_COLUMNS,
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    // =========================================================================
    // Subdomain Reports
    // =========================================================================
    async getSubdomainRank(subdomain, database = 'us', limit) {
        const params = {
            type: 'subdomain_rank',
            subdomain,
            database,
            export_columns: RANK_COLUMNS,
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getSubdomainRanks(subdomain, limit) {
        const params = {
            type: 'subdomain_ranks',
            subdomain,
            export_columns: RANKS_ALL_DB_COLUMNS,
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getSubdomainRankHistory(subdomain, database = 'us', limit) {
        const params = {
            type: 'subdomain_rank_history',
            subdomain,
            database,
            export_columns: RANK_HISTORY_COLUMNS,
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getSubdomainOrganic(subdomain, database = 'us', limit) {
        const params = {
            type: 'subdomain_organic',
            subdomain,
            database,
            export_columns: ORGANIC_KEYWORD_COLUMNS,
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    // =========================================================================
    // Subfolder Reports
    // =========================================================================
    async getSubfolderOrganic(subfolder, database = 'us', limit) {
        const params = {
            type: 'subfolder_organic',
            subfolder,
            database,
            export_columns: ORGANIC_KEYWORD_COLUMNS,
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getSubfolderAdwords(subfolder, database = 'us', limit) {
        const params = {
            type: 'subfolder_adwords',
            subfolder,
            database,
            export_columns: 'Ph,Po,Pp,Pd,Nq,Cp,Vu,Tr,Tc,Co,Nr,Td',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getSubfolderRank(subfolder, database = 'us', limit) {
        const params = {
            type: 'subfolder_rank',
            subfolder,
            database,
            export_columns: RANK_COLUMNS,
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getSubfolderRanks(subfolder, limit) {
        const params = {
            type: 'subfolder_ranks',
            subfolder,
            export_columns: RANKS_ALL_DB_COLUMNS,
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getSubfolderRankHistory(subfolder, database = 'us', limit) {
        const params = {
            type: 'subfolder_rank_history',
            subfolder,
            database,
            export_columns: RANK_HISTORY_COLUMNS,
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getSubfolderOrganicUnique(subfolder, database = 'us', limit) {
        const params = {
            type: 'subfolder_organic_unique',
            subfolder,
            database,
            export_columns: 'Ur,Pc,Tr,Tg',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getSubfolderAdwordsUnique(subfolder, database = 'us', limit) {
        const params = {
            type: 'subfolder_adwords_unique',
            subfolder,
            database,
            export_columns: 'Tt,Ds,Vu,Ur,Pc,Ti',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    // =========================================================================
    // Backlinks API
    // =========================================================================
    async getBacklinks(target, limit) {
        const params = {
            type: 'backlinks',
            target,
            target_type: 'root_domain',
            export_columns: 'page_ascore,source_title,source_url,target_url,anchor,external_num,internal_num,first_seen,last_seen',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(BACKLINKS_API_BASE_URL, params);
    }
    async getBacklinksDomains(target, limit) {
        const params = {
            type: 'backlinks_refdomains',
            target,
            target_type: 'root_domain',
            export_columns: 'domain_ascore,domain,backlinks_num,ip,country,first_seen,last_seen',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(BACKLINKS_API_BASE_URL, params);
    }
    async getBacklinksOverview(target, targetType = 'root_domain') {
        return this.makeRequest(BACKLINKS_API_BASE_URL, {
            type: 'backlinks_overview',
            target,
            target_type: targetType,
            export_columns: 'total,domains_num,ips_num,follows_num,nofollows_num,score,trust_score,urls_num,ipclassc_num,texts_num,forms_num,frames_num,images_num',
        });
    }
    async getBacklinksPages(target, targetType = 'root_domain', limit) {
        const params = {
            type: 'backlinks_pages',
            target,
            target_type: targetType,
            export_columns: 'source_url,source_title,response_code,backlinks_num,domains_num,external_num,internal_num,last_seen',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(BACKLINKS_API_BASE_URL, params);
    }
    async getBacklinksAnchors(target, targetType = 'root_domain', limit) {
        const params = {
            type: 'backlinks_anchors',
            target,
            target_type: targetType,
            export_columns: 'anchor,domains_num,backlinks_num,first_seen,last_seen',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(BACKLINKS_API_BASE_URL, params);
    }
    async getBacklinksTld(target, targetType = 'root_domain', limit) {
        const params = {
            type: 'backlinks_tld',
            target,
            target_type: targetType,
            export_columns: 'zone,domains_num,backlinks_num',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(BACKLINKS_API_BASE_URL, params);
    }
    async getBacklinksCategories(target, targetType = 'root_domain', limit) {
        const params = {
            type: 'backlinks_categories',
            target,
            target_type: targetType,
            export_columns: 'category_name,rating',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(BACKLINKS_API_BASE_URL, params);
    }
    // =========================================================================
    // Keyword Analytics
    // =========================================================================
    async getKeywordOverview(keyword, database = 'us') {
        return this.makeRequest(SEMRUSH_API_BASE_URL, {
            type: 'phrase_all',
            phrase: keyword,
            database,
            export_columns: 'Ph,Nq,Cp,Co,Nr,Td',
        });
    }
    async getRelatedKeywords(keyword, database = 'us', limit) {
        const params = {
            type: 'phrase_related',
            phrase: keyword,
            database,
            export_columns: 'Ph,Nq,Cp,Co,Nr,Td',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getKeywordOverviewSingleDb(keyword, database) {
        return this.makeRequest(SEMRUSH_API_BASE_URL, {
            type: 'phrase_this',
            phrase: keyword,
            database,
            export_columns: KEYWORD_DETAIL_COLUMNS,
        });
    }
    async getBatchKeywordOverview(keywords, database) {
        return this.makeRequest(SEMRUSH_API_BASE_URL, {
            type: 'phrase_these',
            phrase: keywords.join(';'),
            database,
            export_columns: KEYWORD_DETAIL_COLUMNS,
        });
    }
    async getKeywordOrganicResults(keyword, database, limit) {
        const params = {
            type: 'phrase_organic',
            phrase: keyword,
            database,
            export_columns: 'Po,Pt,Dn,Ur,Fk,Fp,Fl',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getKeywordPaidResults(keyword, database, limit) {
        const params = {
            type: 'phrase_adwords',
            phrase: keyword,
            database,
            export_columns: 'Dn,Ur,Vu',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getKeywordAdsHistory(keyword, database, limit) {
        const params = {
            type: 'phrase_adwords_historical',
            phrase: keyword,
            database,
            export_columns: 'Dn,Dt,Po,Ur,Tt,Ds,Vu',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getBroadMatchKeywords(keyword, database, limit) {
        const params = {
            type: 'phrase_fullsearch',
            phrase: keyword,
            database,
            export_columns: 'Ph,Nq,Cp,Co,Nr,Td,Fk,In,Kd',
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getPhraseQuestions(keyword, database, limit) {
        const params = {
            type: 'phrase_questions',
            phrase: keyword,
            database,
            export_columns: KEYWORD_DETAIL_COLUMNS,
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(SEMRUSH_API_BASE_URL, params);
    }
    async getKeywordDifficulty(keywords, database) {
        return this.makeRequest(SEMRUSH_API_BASE_URL, {
            type: 'phrase_kdi',
            phrase: keywords.join(';'),
            database,
            export_columns: 'Ph,Kd',
        });
    }
    // =========================================================================
    // Traffic Analytics (Trends API)
    // =========================================================================
    async getTrafficSummary(domains, country = 'us') {
        return this.makeRequest(TRENDS_API_BASE_URL + 'summary', {
            targets: domains.join(','),
            country,
            display_date: 'all',
        });
    }
    async getTrafficSources(domain, country = 'us') {
        return this.makeRequest(TRENDS_API_BASE_URL + 'sources', {
            target: domain,
            country,
            display_date: 'all',
        });
    }
    async getTrafficDestinations(target, country = 'us', deviceType, displayDate, limit) {
        const params = {
            target,
            country,
            export_columns: 'target,display_date,country,device_type,to_target,traffic_share,traffic',
        };
        if (deviceType)
            params.device_type = deviceType;
        if (displayDate)
            params.display_date = displayDate;
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(TRENDS_API_BASE_URL + 'destinations', params);
    }
    async getTrafficGeo(target, country = 'us', deviceType, displayDate, limit) {
        const params = { target, country };
        if (deviceType)
            params.device_type = deviceType;
        if (displayDate)
            params.display_date = displayDate;
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(TRENDS_API_BASE_URL + 'geo', params);
    }
    async getTrafficSubdomains(target, country = 'us', deviceType, displayDate, limit) {
        const params = { target, country };
        if (deviceType)
            params.device_type = deviceType;
        if (displayDate)
            params.display_date = displayDate;
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(TRENDS_API_BASE_URL + 'subdomains', params);
    }
    async getTrafficSubfolders(target, country = 'us', deviceType, displayDate, limit) {
        const params = { target, country };
        if (deviceType)
            params.device_type = deviceType;
        if (displayDate)
            params.display_date = displayDate;
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(TRENDS_API_BASE_URL + 'subfolders', params);
    }
    async getTrafficTopPages(target, country = 'us', deviceType, displayDate, limit) {
        const params = { target, country };
        if (deviceType)
            params.device_type = deviceType;
        if (displayDate)
            params.display_date = displayDate;
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(TRENDS_API_BASE_URL + 'toppages', params);
    }
    async getTrafficRank(target, country = 'us', deviceType, displayDate, limit) {
        const params = { target, country };
        if (deviceType)
            params.device_type = deviceType;
        if (displayDate)
            params.display_date = displayDate;
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(TRENDS_API_BASE_URL + 'rank', params);
    }
    async getTrafficSocialMedia(target, country = 'us', deviceType, displayDate, limit) {
        const params = { target, country };
        if (deviceType)
            params.device_type = deviceType;
        if (displayDate)
            params.display_date = displayDate;
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(TRENDS_API_BASE_URL + 'social_media', params);
    }
    async getAudienceInsights(targets, selectedTargets, limit) {
        const params = {
            targets: targets.join(','),
            selected_targets: selectedTargets.join(','),
        };
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(TRENDS_API_BASE_URL + 'audience_insights', params);
    }
    async getPurchaseConversion(target, country = 'us', displayDate, limit) {
        const params = {
            target,
            country,
            device_type: 'desktop',
        };
        if (displayDate)
            params.display_date = displayDate;
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(TRENDS_API_BASE_URL + 'purchase_conversion', params);
    }
    async getHouseholdDistribution(target, country = 'us', deviceType, displayDate, limit) {
        const params = { target, country };
        if (deviceType)
            params.device_type = deviceType;
        if (displayDate)
            params.display_date = displayDate;
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(TRENDS_API_BASE_URL + 'household_distribution', params);
    }
    async getIncomeDistribution(target, country = 'us', deviceType, displayDate, limit) {
        const params = { target, country };
        if (deviceType)
            params.device_type = deviceType;
        if (displayDate)
            params.display_date = displayDate;
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(TRENDS_API_BASE_URL + 'income_distribution', params);
    }
    async getEducationDistribution(target, country = 'us', deviceType, displayDate, limit) {
        const params = { target, country };
        if (deviceType)
            params.device_type = deviceType;
        if (displayDate)
            params.display_date = displayDate;
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(TRENDS_API_BASE_URL + 'education_distribution', params);
    }
    async getOccupationDistribution(target, country = 'us', deviceType, displayDate, limit) {
        const params = { target, country };
        if (deviceType)
            params.device_type = deviceType;
        if (displayDate)
            params.display_date = displayDate;
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(TRENDS_API_BASE_URL + 'occupation_distribution', params);
    }
    async getAudienceInterests(target, country = 'us', deviceType, displayDate, limit) {
        const params = { target, country };
        if (deviceType)
            params.device_type = deviceType;
        if (displayDate)
            params.display_date = displayDate;
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(TRENDS_API_BASE_URL + 'audience_interests', params);
    }
    async getTrafficAccuracy(target, displayDate, limit) {
        const params = { target };
        if (displayDate)
            params.display_date = displayDate;
        if (limit)
            params.display_limit = limit;
        return this.makeRequest(TRENDS_API_BASE_URL + 'accuracy', params);
    }
    // =========================================================================
    // Projects API
    // =========================================================================
    async listProjects() {
        return this.makeRequest(PROJECTS_API_BASE_URL, {});
    }
    async getProject(projectId) {
        return this.makeRequest(`${PROJECTS_API_BASE_URL}/${projectId}`, {});
    }
    async createProject(url, projectName) {
        const params = { url };
        if (projectName)
            params.project_name = projectName;
        return this.makeRequest(PROJECTS_API_BASE_URL, params, { method: 'post' });
    }
    async updateProject(projectId, projectName) {
        return this.makeRequest(PROJECTS_API_BASE_URL, {
            project_id: projectId,
            project_name: projectName,
        }, { method: 'put' });
    }
    async deleteProject(projectId) {
        return this.makeRequest(`${PROJECTS_API_BASE_URL}/${projectId}`, {}, { method: 'delete' });
    }
    // =========================================================================
    // Site Audit API
    // =========================================================================
    async getSiteAuditInfo(projectId) {
        return this.makeRequest(`${SITE_AUDIT_REPORTS_BASE_URL}/${projectId}/siteaudit/info`, {});
    }
    async getSiteAuditSnapshots(projectId) {
        return this.makeRequest(`${SITE_AUDIT_REPORTS_BASE_URL}/${projectId}/siteaudit/snapshots`, {});
    }
    async getSiteAuditSnapshotDetail(projectId, snapshotId) {
        return this.makeRequest(`${SITE_AUDIT_REPORTS_BASE_URL}/${projectId}/siteaudit/snapshot`, {
            snapshot_id: snapshotId,
        });
    }
    async getSiteAuditIssues(projectId) {
        return this.makeRequest(`${SITE_AUDIT_REPORTS_BASE_URL}/${projectId}/siteaudit/meta/issues`, {});
    }
    async getSiteAuditPages(projectId, url, limit, page) {
        const params = { url };
        if (limit)
            params.limit = limit;
        if (page)
            params.page = page;
        return this.makeRequest(`${SITE_AUDIT_REPORTS_BASE_URL}/${projectId}/siteaudit/page/list`, params);
    }
    async getSiteAuditPageDetail(projectId, pageId) {
        return this.makeRequest(`${SITE_AUDIT_REPORTS_BASE_URL}/${projectId}/siteaudit/page/${pageId}`, {});
    }
    async getSiteAuditHistory(projectId, limit, offset) {
        const params = {};
        if (limit)
            params.limit = limit;
        if (offset !== undefined)
            params.offset = offset;
        return this.makeRequest(`${SITE_AUDIT_REPORTS_BASE_URL}/${projectId}/siteaudit/history`, params);
    }
    async launchSiteAuditCrawl(projectId) {
        return this.makeRequest(`${SITE_AUDIT_REPORTS_BASE_URL}/${projectId}/siteaudit/launch`, {}, { method: 'post' });
    }
    // =========================================================================
    // Utility
    // =========================================================================
    async getApiUnitsBalance() {
        return this.makeRequest('https://www.semrush.com/users/countapiunits.html', {});
    }
}
// Lazy singleton — the client is only constructed when first accessed,
// so importing this module never throws even if the API key is missing.
let _instance = null;
export const semrushApi = new Proxy({}, {
    get(_target, prop) {
        if (!_instance) {
            _instance = new SemrushApiClient();
        }
        return _instance[prop];
    },
});
