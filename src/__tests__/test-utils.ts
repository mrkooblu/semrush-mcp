/**
 * Test utilities for Semrush API tests
 *
 * Provides mock factories for axios responses/errors and assertion helpers.
 * Semrush API returns semicolon-delimited CSV text, NOT JSON — mock data reflects this.
 */
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'

import type { SemrushApiResponse } from '../semrush-api.js'

// ============================================================================
// Mock CSV Data — Semrush returns semicolon-delimited text
// ============================================================================

/** Domain overview CSV (domain_ranks) */
export const MOCK_DOMAIN_OVERVIEW_CSV =
  'Database;Domain;Rank;Organic Keywords;Organic Traffic;Organic Cost;Adwords Keywords;Adwords Traffic;Adwords Cost;PLA keywords;PLA uniques\r\n' +
  'us;example.com;1500;45000;1200000;890000;1200;50000;120000;300;150'

/** Domain organic keywords CSV (domain_organic) */
export const MOCK_DOMAIN_ORGANIC_KEYWORDS_CSV =
  'Keyword;Position;Previous Position;Position Difference;Search Volume;CPC;Url;Traffic (%);Traffic Cost (%);Competition;Number of Results;Trends\r\n' +
  'example keyword;3;5;2;12000;1.50;https://example.com/page;8.5;12000;0.65;1500000;1,1,1,0.8,0.9,1,1,0.7,0.8,1,1,1\r\n' +
  'another keyword;7;8;1;8000;2.30;https://example.com/other;3.2;7500;0.45;890000;0.8,0.9,1,1,0.7,0.8,1,1,0.9,0.8,1,1'

/** Domain paid keywords CSV (domain_adwords) */
export const MOCK_DOMAIN_PAID_KEYWORDS_CSV =
  'Keyword;Position;Previous Position;Position Difference;Ad Budget;Search Volume;CPC;Traffic (%);Traffic Cost (%);Competition;Number of Results;Trends\r\n' +
  'buy example;1;1;0;5000;9000;3.20;12.5;28000;0.85;450000;1,1,0.9,0.8,1,1,0.9,1,1,0.8,0.9,1'

/** Competitors CSV (domain_organic_organic) */
export const MOCK_COMPETITORS_CSV =
  'Domain;Competition Level;Common Keywords;Organic Keywords;Organic Traffic;Organic Cost;Adwords Keywords;Adwords Traffic;Adwords Cost\r\n' +
  'competitor1.com;0.15;5000;35000;900000;650000;800;30000;80000\r\n' +
  'competitor2.com;0.12;3500;28000;750000;500000;600;25000;65000'

/** Backlinks CSV */
export const MOCK_BACKLINKS_CSV =
  'Source Title;Source Url;Target Url;Anchor;Page Score;Domain Score;External Num;Internal Num;First Seen;Last Seen\r\n' +
  'Example Page;https://source.com/page;https://example.com;click here;45;62;150;80;20240101;20240315'

/** Backlinks domains CSV */
export const MOCK_BACKLINKS_DOMAINS_CSV =
  'Domain;Domain Score;Backlinks;IP;Country;First Seen;Last Seen\r\n' +
  'source.com;62;25;1.2.3.4;us;20230601;20240315'

/** Keyword overview CSV (phrase_all) */
export const MOCK_KEYWORD_OVERVIEW_CSV =
  'Keyword;Search Volume;CPC;Competition;Number of Results;Trends\r\n' +
  'seo;110000;4.50;0.82;2500000000;1,1,0.9,0.8,1,1,0.9,1,1,0.8,0.9,1'

/** Related keywords CSV (phrase_related) */
export const MOCK_RELATED_KEYWORDS_CSV =
  'Keyword;Search Volume;CPC;Competition;Number of Results;Trends\r\n' +
  'seo tools;22000;3.80;0.75;1200000000;0.9,1,0.8,0.7,1,1,0.8,0.9,1,0.9,1,1\r\n' +
  'seo agency;18000;5.20;0.88;890000000;1,0.9,0.8,0.9,1,1,0.9,1,0.8,0.9,1,1'

/** Keyword overview single db CSV (phrase_this) */
export const MOCK_KEYWORD_SINGLE_DB_CSV =
  'Keyword;Search Volume;CPC;Competition;Number of Results;Trends;Intent;Keyword Difficulty\r\n' +
  'seo;110000;4.50;0.82;2500000000;1,1,0.9,0.8,1,1,0.9,1,1,0.8,0.9,1;0;67.5'

/** Batch keyword overview CSV (phrase_these) */
export const MOCK_BATCH_KEYWORD_CSV =
  'Keyword;Search Volume;CPC;Competition;Number of Results;Trends;Intent;Keyword Difficulty\r\n' +
  'seo;110000;4.50;0.82;2500000000;1,1,0.9,0.8,1,1,0.9,1,1,0.8,0.9,1;0;67.5\r\n' +
  'marketing;90000;3.20;0.78;3100000000;0.9,1,0.8,0.9,1,0.8,0.9,1,0.9,1,0.8,1;0;72.1'

/** Keyword organic results CSV (phrase_organic) */
export const MOCK_KEYWORD_ORGANIC_RESULTS_CSV =
  'Position;Position Type;Domain;Url;Features Keyword;Features Snippet;Features Link\r\n' +
  '1;organic;moz.com;https://moz.com/seo;1;0;1\r\n' +
  '2;organic;searchengineland.com;https://searchengineland.com/guide/seo;0;1;1'

/** Keyword paid results CSV (phrase_adwords) */
export const MOCK_KEYWORD_PAID_RESULTS_CSV =
  'Domain;Url;Visible Url\r\n' + 'semrush.com;https://semrush.com/lp;semrush.com/seo-tools'

/** Keyword ads history CSV (phrase_adwords_historical) */
export const MOCK_KEYWORD_ADS_HISTORY_CSV =
  'Domain;Date;Position;Url;Title;Description;Visible Url\r\n' +
  'semrush.com;202401;1;https://semrush.com/lp;SEMrush SEO Tools;Best SEO tools suite;semrush.com'

/** Broad match keywords CSV (phrase_fullsearch) */
export const MOCK_BROAD_MATCH_CSV =
  'Keyword;Search Volume;CPC;Competition;Number of Results;Trends;Features Keyword;Intent;Keyword Difficulty\r\n' +
  'seo tips;14000;2.10;0.55;900000000;0.8,0.9,1,0.7,0.8,1,0.9,1,0.8,0.9,1,1;1;45.2\r\n' +
  'seo guide;12000;1.80;0.48;750000000;0.9,1,0.8,0.9,1,0.7,0.8,1,0.9,1,0.8,1;0;42.8'

/** Phrase questions CSV (phrase_questions) */
export const MOCK_PHRASE_QUESTIONS_CSV =
  'Keyword;Search Volume;CPC;Competition;Number of Results;Trends;Intent;Keyword Difficulty\r\n' +
  'what is seo;33000;2.80;0.62;1800000000;1,0.9,0.8,1,1,0.9,1,0.8,0.9,1,1,0.9;0;52.3\r\n' +
  'how to do seo;22000;3.10;0.58;1200000000;0.9,1,0.8,0.9,1,1,0.8,0.9,1,0.9,1,1;0;48.7'

/** Keyword difficulty CSV (phrase_kdi) */
export const MOCK_KEYWORD_DIFFICULTY_CSV =
  'Keyword;Keyword Difficulty\r\n' + 'seo;67.5\r\n' + 'marketing;72.1'

/** Traffic summary JSON (Trends API returns JSON, not CSV) */
export const MOCK_TRAFFIC_SUMMARY_JSON = JSON.stringify({
  'google.com': {
    visits: 89000000000,
    desktop_visits: 45000000000,
    mobile_visits: 44000000000,
  },
})

/** Traffic sources JSON */
export const MOCK_TRAFFIC_SOURCES_JSON = JSON.stringify({
  direct: 0.65,
  referral: 0.12,
  search: 0.18,
  social: 0.03,
  paid: 0.02,
})

/** API units balance */
export const MOCK_API_UNITS_BALANCE = '45230'

// ============================================================================
// Mock CSV Data — New Endpoints
// ============================================================================

/** Domain rank CSV (domain_rank) */
export const MOCK_DOMAIN_RANK_CSV =
  'Domain;Rank;Organic Keywords;Organic Traffic;Organic Cost;Adwords Keywords;Adwords Traffic;Adwords Cost\r\n' +
  'example.com;1500;45000;1200000;890000;1200;50000;120000'

/** Domain rank history CSV (domain_rank_history) */
export const MOCK_DOMAIN_RANK_HISTORY_CSV =
  'Rank;Organic Keywords;Organic Traffic;Organic Cost;Adwords Keywords;Adwords Traffic;Adwords Cost;Date\r\n' +
  '1500;45000;1200000;890000;1200;50000;120000;20240101'

/** Rank difference CSV (rank_difference) */
export const MOCK_RANK_DIFFERENCE_CSV =
  'Domain;Rank;Organic Keywords;Organic Traffic;Organic Cost;Adwords Keywords;Adwords Traffic;Adwords Cost;Organic Keywords Difference;Organic Traffic Difference;Organic Cost Difference;Adwords Keywords Difference;Adwords Traffic Difference;Adwords Cost Difference\r\n' +
  'rising.com;500;80000;2000000;1500000;2000;80000;200000;5000;150000;100000;200;10000;25000'

/** Paid competitors CSV (domain_adwords_adwords) */
export const MOCK_PAID_COMPETITORS_CSV =
  'Domain;Competitor Relevance;Common Keywords;Adwords Keywords;Adwords Traffic;Adwords Cost;Organic Keywords\r\n' +
  'competitor1.com;0.25;3000;5000;80000;200000;35000'

/** Domain ads history CSV (domain_adwords_historical) */
export const MOCK_DOMAIN_ADS_HISTORY_CSV =
  'Keyword;Date;Position;CPC;Search Volume;Traffic (%);Url;Title;Description;Visible Url;Coverage\r\n' +
  'buy seo tools;202401;1;3.50;8000;12.5;https://example.com/buy;Buy SEO Tools;Best tools;example.com;0.85'

/** Domain organic unique CSV (domain_organic_unique) */
export const MOCK_DOMAIN_ORGANIC_UNIQUE_CSV =
  'Url;Number of Keywords;Traffic;Traffic (%)\r\n' + 'https://example.com/page1;150;25000;8.5'

/** Domain adwords unique CSV (domain_adwords_unique) */
export const MOCK_DOMAIN_ADWORDS_UNIQUE_CSV =
  'Title;Description;Visible Url;Url;Number of Keywords;Ad id\r\n' +
  'Best SEO Tools;Top rated;example.com;https://example.com/lp;25;12345'

/** Domain shopping CSV (domain_shopping) */
export const MOCK_DOMAIN_SHOPPING_CSV =
  'Keyword;Position;Previous Position;Position Difference;Search Volume;Shop Name;Url;Title;Product Price;Timestamp\r\n' +
  'seo tool;1;2;1;5000;ExampleShop;https://example.com/product;SEO Tool Pro;49.99;20240101'

/** Domain shopping unique CSV (domain_shopping_unique) */
export const MOCK_DOMAIN_SHOPPING_UNIQUE_CSV =
  'Title;Product Price;Url;Number of Keywords;Ad id\r\n' +
  'SEO Tool Pro;49.99;https://example.com/product;15;67890'

/** URL organic CSV */
export const MOCK_URL_ORGANIC_CSV =
  'Keyword;Position;Search Volume;CPC;Competition;Traffic (%);Traffic Cost (%);Number of Results;Trends;SERP Features;Timestamp\r\n' +
  'what is seo;5;33000;2.80;0.62;4.5;12600;1800000000;1,0.9,0.8,1,1,0.9;Featured;20240301'

/** URL adwords CSV */
export const MOCK_URL_ADWORDS_CSV =
  'Keyword;Position;Search Volume;CPC;Competition;Traffic (%);Traffic Cost (%);Number of Results;Trends;Title;Description\r\n' +
  'seo tools;1;22000;3.80;0.75;15.2;57000;1200000000;0.9,1,0.8;Best SEO;Top rated tools'

/** URL rank CSV */
export const MOCK_URL_RANK_CSV =
  'Rank;Organic Keywords;Organic Traffic;Organic Cost;Adwords Keywords;Adwords Traffic;Adwords Cost\r\n' +
  '250;500;15000;12000;50;2000;5000'

/** URL rank history CSV */
export const MOCK_URL_RANK_HISTORY_CSV =
  'Rank;Organic Keywords;Organic Traffic;Organic Cost;Adwords Keywords;Adwords Traffic;Adwords Cost;Date\r\n' +
  '250;500;15000;12000;50;2000;5000;20240101'

/** URL ranks CSV (all databases) */
export const MOCK_URL_RANKS_CSV =
  'Database;Rank;Organic Keywords;Organic Traffic;Organic Cost;Adwords Keywords;Adwords Traffic;Adwords Cost;PLA uniques;PLA keywords\r\n' +
  'us;250;500;15000;12000;50;2000;5000;10;25'

/** Subdomain rank CSV */
export const MOCK_SUBDOMAIN_RANK_CSV =
  'Rank;Organic Keywords;Organic Traffic;Organic Cost;Adwords Keywords;Adwords Traffic;Adwords Cost\r\n' +
  '300;8000;250000;180000;200;15000;35000'

/** Subdomain ranks CSV (all databases) */
export const MOCK_SUBDOMAIN_RANKS_CSV =
  'Database;Rank;Organic Keywords;Organic Traffic;Organic Cost;Adwords Keywords;Adwords Traffic;Adwords Cost;PLA uniques;PLA keywords\r\n' +
  'us;300;8000;250000;180000;200;15000;35000;20;40'

/** Subdomain rank history CSV */
export const MOCK_SUBDOMAIN_RANK_HISTORY_CSV =
  'Rank;Organic Keywords;Organic Traffic;Organic Cost;Adwords Keywords;Adwords Traffic;Adwords Cost;Date\r\n' +
  '300;8000;250000;180000;200;15000;35000;20240101'

/** Subdomain organic CSV */
export const MOCK_SUBDOMAIN_ORGANIC_CSV =
  'Keyword;Position;Previous Position;Position Difference;Search Volume;CPC;Url;Traffic (%);Traffic Cost (%);Competition;Number of Results;Trends\r\n' +
  'subdomain keyword;4;6;2;9000;1.80;https://sub.example.com/page;5.2;9360;0.55;1100000;0.9,1,0.8,0.9,1,1'

/** Subfolder organic CSV */
export const MOCK_SUBFOLDER_ORGANIC_CSV =
  'Keyword;Position;Previous Position;Position Difference;Search Volume;CPC;Url;Traffic (%);Traffic Cost (%);Competition;Number of Results;Trends\r\n' +
  'subfolder keyword;3;5;2;11000;2.10;https://example.com/blog/post;7.5;23100;0.60;950000;0.8,0.9,1,0.7,0.8,1'

/** Subfolder adwords CSV */
export const MOCK_SUBFOLDER_ADWORDS_CSV =
  'Keyword;Position;Previous Position;Position Difference;Search Volume;CPC;Visible Url;Traffic (%);Traffic Cost (%);Competition;Number of Results;Trends\r\n' +
  'subfolder paid;2;3;1;7000;3.40;example.com/blog;10.5;23800;0.72;600000;1,0.9,0.8,0.9,1,1'

/** Subfolder rank CSV */
export const MOCK_SUBFOLDER_RANK_CSV =
  'Rank;Organic Keywords;Organic Traffic;Organic Cost;Adwords Keywords;Adwords Traffic;Adwords Cost\r\n' +
  '450;3000;80000;60000;100;8000;20000'

/** Subfolder ranks CSV (all databases) */
export const MOCK_SUBFOLDER_RANKS_CSV =
  'Database;Rank;Organic Keywords;Organic Traffic;Organic Cost;Adwords Keywords;Adwords Traffic;Adwords Cost;PLA uniques;PLA keywords\r\n' +
  'us;450;3000;80000;60000;100;8000;20000;5;12'

/** Subfolder rank history CSV */
export const MOCK_SUBFOLDER_RANK_HISTORY_CSV =
  'Rank;Organic Keywords;Organic Traffic;Organic Cost;Adwords Keywords;Adwords Traffic;Adwords Cost;Date\r\n' +
  '450;3000;80000;60000;100;8000;20000;20240101'

/** Subfolder organic unique CSV */
export const MOCK_SUBFOLDER_ORGANIC_UNIQUE_CSV =
  'Url;Number of Keywords;Traffic;Traffic (%)\r\n' + 'https://example.com/blog/post1;75;12000;4.2'

/** Subfolder adwords unique CSV */
export const MOCK_SUBFOLDER_ADWORDS_UNIQUE_CSV =
  'Title;Description;Visible Url;Url;Number of Keywords;Ad id\r\n' +
  'Blog Ad;Read more;example.com/blog;https://example.com/blog/lp;10;54321'

/** Backlinks overview CSV */
export const MOCK_BACKLINKS_OVERVIEW_CSV =
  'total;domains_num;ips_num;follows_num;nofollows_num;score;trust_score;urls_num;ipclassc_num;texts_num;forms_num;frames_num;images_num\r\n' +
  '150000;5000;3500;120000;30000;72;65;8000;2500;100000;500;200;25000'

/** Backlinks pages CSV */
export const MOCK_BACKLINKS_PAGES_CSV =
  'source_url;source_title;response_code;backlinks_num;domains_num;external_num;internal_num;last_seen\r\n' +
  'https://example.com/page1;Example Page;200;50;25;30;20;20240315'

/** Backlinks anchors CSV */
export const MOCK_BACKLINKS_ANCHORS_CSV =
  'anchor;domains_num;backlinks_num;first_seen;last_seen\r\n' +
  'click here;150;500;20230101;20240315'

/** Backlinks TLD CSV */
export const MOCK_BACKLINKS_TLD_CSV =
  'zone;domains_num;backlinks_num\r\n' + 'com;3500;85000\r\n' + 'org;800;12000'

/** Backlinks categories CSV */
export const MOCK_BACKLINKS_CATEGORIES_CSV =
  'category_name;rating\r\n' + 'Internet and Telecom;0.85\r\n' + 'Business and Industry;0.65'

/** Trends destinations CSV */
export const MOCK_TRENDS_DESTINATIONS_CSV =
  'target;display_date;country;device_type;to_target;traffic_share;traffic\r\n' +
  'google.com;2024-01-01;us;desktop;youtube.com;0.15;1500000'

/** Trends geo CSV */
export const MOCK_TRENDS_GEO_CSV =
  'target;display_date;device_type;geo;traffic;global_traffic;traffic_share\r\n' +
  'google.com;2024-01-01;desktop;US;45000000;89000000;0.51'

/** Trends subdomains CSV */
export const MOCK_TRENDS_SUBDOMAINS_CSV =
  'domain;display_date;country;device_type;subdomain;traffic_share\r\n' +
  'google.com;2024-01-01;us;desktop;mail.google.com;0.25'

/** Trends subfolders CSV */
export const MOCK_TRENDS_SUBFOLDERS_CSV =
  'display_date;subfolder;subdomain;traffic_share;users\r\n' +
  '2024-01-01;/search;www.google.com;0.65;30000000'

/** Trends toppages CSV */
export const MOCK_TRENDS_TOPPAGES_CSV =
  'device_type;display_date;country;target;page;traffic_share\r\n' +
  'desktop;2024-01-01;us;google.com;google.com/;0.35'

/** Trends rank CSV */
export const MOCK_TRENDS_RANK_CSV =
  'display_date;country;device_type;rank;domain;visits\r\n' +
  '2024-01-01;us;desktop;1;google.com;89000000000'

/** Trends social media CSV */
export const MOCK_TRENDS_SOCIAL_MEDIA_CSV =
  'target;display_date;country;device_type;social_name;social_domain;users_score;users\r\n' +
  'google.com;2024-01-01;us;desktop;YouTube;youtube.com;0.85;50000000'

/** Trends audience insights CSV */
export const MOCK_TRENDS_AUDIENCE_INSIGHTS_CSV =
  'target;overlap_score;similarity_score;target_users;overlap_users\r\n' +
  'youtube.com;0.75;0.82;500000000;375000000'

/** Trends purchase conversion CSV */
export const MOCK_TRENDS_PURCHASE_CONVERSION_CSV =
  'target;display_date;device_type;country;conversion\r\n' + 'amazon.com;2024-01-01;desktop;us;0.12'

/** Trends household distribution CSV */
export const MOCK_TRENDS_HOUSEHOLD_CSV =
  'target;display_date;country;device_type;size;users_share;users\r\n' +
  'google.com;2024-01-01;us;desktop;2;0.35;15000000'

/** Trends income distribution CSV */
export const MOCK_TRENDS_INCOME_CSV =
  'target;display_date;country;device_type;income_type;users_share;users\r\n' +
  'google.com;2024-01-01;us;desktop;middle;0.55;25000000'

/** Trends education distribution CSV */
export const MOCK_TRENDS_EDUCATION_CSV =
  'target;display_date;country;device_type;education;users_share;users\r\n' +
  'google.com;2024-01-01;us;desktop;university;0.45;20000000'

/** Trends occupation distribution CSV */
export const MOCK_TRENDS_OCCUPATION_CSV =
  'target;display_date;country;device_type;occupation;users_share;users\r\n' +
  'google.com;2024-01-01;us;desktop;full_time_work;0.60;27000000'

/** Trends audience interests CSV */
export const MOCK_TRENDS_AUDIENCE_INTERESTS_CSV =
  'target;display_date;country;device_type;category;users;users_score\r\n' +
  'google.com;2024-01-01;us;desktop;Technology;35000000;0.78'

/** Trends accuracy CSV */
export const MOCK_TRENDS_ACCURACY_CSV =
  'display_date;device_type;country;target;accuracy\r\n' + '2024-01-01;desktop;us;google.com;high'

/** Projects API - list projects JSON */
export const MOCK_PROJECTS_LIST_JSON = JSON.stringify([
  {
    project_id: 12345,
    project_name: 'Test Project',
    url: 'https://example.com',
    domain_unicode: 'example.com',
    tools: [{ tool: 'siteaudit' }],
    owner_id: 1,
    permission: ['admin'],
  },
])

/** Projects API - single project JSON */
export const MOCK_PROJECT_JSON = JSON.stringify({
  project_id: 12345,
  project_name: 'Test Project',
  url: 'https://example.com',
  domain_unicode: 'example.com',
  tools: [{ tool: 'siteaudit' }],
  owner_id: 1,
  permission: ['admin'],
})

/** Site Audit info JSON */
export const MOCK_SITE_AUDIT_INFO_JSON = JSON.stringify({
  id: 12345,
  name: 'Test Project',
  url: 'https://example.com',
  status: 'finished',
  errors: 10,
  warnings: 25,
  notices: 50,
})

/** Site Audit snapshots JSON */
export const MOCK_SITE_AUDIT_SNAPSHOTS_JSON = JSON.stringify({
  snapshots: [
    { snapshot_id: 100, finish_date: 1710000000000 },
    { snapshot_id: 99, finish_date: 1709000000000 },
  ],
})

/** Site Audit snapshot detail JSON */
export const MOCK_SITE_AUDIT_SNAPSHOT_DETAIL_JSON = JSON.stringify({
  pages_crawled: 500,
  pages_limit: 1000,
  errors: [{ id: 'broken_links', count: 5 }],
  warnings: [{ id: 'missing_meta', count: 10 }],
  quality: { value: 85, delta: 2 },
})

/** Site Audit issues JSON */
export const MOCK_SITE_AUDIT_ISSUES_JSON = JSON.stringify({
  issues: [
    { id: 'broken_links', title: 'Broken Links' },
    { id: 'missing_meta', title: 'Missing Meta Description' },
  ],
})

/** Site Audit pages JSON */
export const MOCK_SITE_AUDIT_PAGES_JSON = JSON.stringify({
  data: [
    { url: 'https://example.com/', page_id: 1 },
    { url: 'https://example.com/about', page_id: 2 },
  ],
  total: 2,
})

/** Site Audit page detail JSON */
export const MOCK_SITE_AUDIT_PAGE_DETAIL_JSON = JSON.stringify({
  title: 'Home Page',
  url: 'https://example.com/',
  errors: [],
  warnings: [{ total: 1, id: 'missing_h1' }],
  notices: [],
})

/** Site Audit history JSON */
export const MOCK_SITE_AUDIT_HISTORY_JSON = JSON.stringify({
  offset: 0,
  limit: 10,
  data: [
    {
      snapshot_id: 100,
      pages_crawled: 500,
      quality: { value: 85, delta: 2 },
    },
  ],
  total: 1,
})

/** Site Audit launch JSON */
export const MOCK_SITE_AUDIT_LAUNCH_JSON = JSON.stringify({
  status: 'crawl_started',
})

// ============================================================================
// Mock Response Builders
// ============================================================================

/**
 * Create a mock successful API response wrapping CSV/text data
 */
export function createMockApiResponse(data: string, status = 200): SemrushApiResponse {
  return {
    data,
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
    },
  }
}

/**
 * Create a mock Axios response (for use with vi.mocked(axios))
 */
export function createMockAxiosResponse<T = string>(data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {
      'content-type': 'text/plain; charset=utf-8',
    },
    config: {
      headers: {},
    } as InternalAxiosRequestConfig,
  }
}

/**
 * Create a mock Axios error with response
 */
export function createMockApiError(status: number, message: string) {
  const error = new Error(`Request failed with status code ${status}`) as Error & {
    isAxiosError: boolean
    response: {
      status: number
      data: { error: { message: string } }
      statusText: string
      headers: Record<string, unknown>
      config: { headers: Record<string, unknown> }
    }
  }

  error.isAxiosError = true
  error.response = {
    status,
    data: { error: { message } },
    statusText: 'Error',
    headers: {},
    config: { headers: {} },
  }

  return error
}

/**
 * Create a network-level error (no response object)
 */
export function createNetworkError(message: string): Error {
  return new Error(message)
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that a response has the expected SemrushApiResponse shape
 */
export function assertValidResponse(result: unknown): asserts result is SemrushApiResponse {
  if (!result || typeof result !== 'object') {
    throw new Error('Response must be an object')
  }

  const r = result as Record<string, unknown>

  if (!('data' in r)) {
    throw new Error('Response must have a "data" property')
  }

  if (typeof r.status !== 'number') {
    throw new Error('Response must have a numeric "status" property')
  }

  if (!r.headers || typeof r.headers !== 'object') {
    throw new Error('Response must have a "headers" object')
  }
}

/**
 * Assert that a response contains non-empty data
 */
export function assertHasData(result: SemrushApiResponse): void {
  if (result.data === null || result.data === undefined) {
    throw new Error('Response data must not be null or undefined')
  }

  if (typeof result.data === 'string' && result.data.trim().length === 0) {
    throw new Error('Response data must not be an empty string')
  }
}

/**
 * Assert that CSV response has at least N data rows (excluding header)
 */
export function assertCsvRowCount(data: string, minRows: number): void {
  const lines = data.trim().split(/\r?\n/)
  const dataRows = lines.length - 1 // first line is header
  if (dataRows < minRows) {
    throw new Error(`Expected at least ${minRows} data rows, got ${dataRows}`)
  }
}
