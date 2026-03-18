# Semrush MCP

MCP Server & CLI for keyword research, domain analytics, backlinks, traffic analysis, and competitive intelligence.

A community-maintained, self-hosted tool that provides Semrush API data through two entry points: an **MCP server** for AI assistants like Claude Desktop and Cursor, and a **`semrush` CLI** for direct terminal use — ideal for developers and AI coding agents like Claude Code that can run shell commands on your behalf. One install gives you both.

## Quick Start

```bash
npm install -g github:mrkooblu/semrush-mcp
export SEMRUSH_API_KEY=your_api_key_here
```

After installing, you have two commands:

- **`semrush`** — CLI for terminal and agent use
- **`semrush-mcp`** — MCP server on stdio for AI clients

**CLI:**

```bash
semrush domain semrush.com           # Domain overview
semrush kw "seo tools"               # Keyword overview
semrush backlinks semrush.com        # Backlink analysis
```

**MCP server** (add to your AI client config):

```json
{
  "mcpServers": {
    "semrush-mcp": {
      "command": "npx",
      "args": ["-y", "github:mrkooblu/semrush-mcp"],
      "env": {
        "SEMRUSH_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Features

- **Domain Analytics** — Overview, rank tracking, rank history, organic/paid keywords, competitors, ads history, shopping, unique pages
- **URL Analytics** — Organic/paid keywords, rank, rank history per URL
- **Subdomain Analytics** — Rank, rank history, organic keywords per subdomain
- **Subfolder Analytics** — Organic/paid keywords, rank, rank history, unique pages per subfolder
- **Keyword Research** — Overview, related keywords, broad match, questions, SERP organic/paid results, ads history, difficulty
- **Backlink Analysis** — Backlinks, referring domains, overview, pages, anchors, TLD distribution, categories
- **Traffic Analytics** — Summary, sources, destinations, geo, subdomains, subfolders, top pages, rank, social media (requires .Trends)
- **Audience Intelligence** — Audience insights, demographics, purchase conversion, interests (requires .Trends)
- **Projects API** — List, create, update, delete projects
- **Site Audit** — Audit info, snapshots, issues, pages, history, launch crawls
- **Keyword Gap Analysis** — Compare two domains' keyword profiles side by side (CLI only)
- **API Units Balance** — Check remaining API credits

All capabilities are available through both the MCP server (77 tools) and the CLI.

## Installation

### Install globally from GitHub

```bash
npm install -g github:mrkooblu/semrush-mcp
```

### Or clone and link locally

```bash
git clone https://github.com/mrkooblu/semrush-mcp.git
cd semrush-mcp
npm install && npm run build && npm link
```

Set your API key in the environment or a `.env` file:

```bash
export SEMRUSH_API_KEY=your_api_key_here
```

## MCP Setup

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "semrush-mcp": {
      "command": "npx",
      "args": ["-y", "github:mrkooblu/semrush-mcp"],
      "env": {
        "SEMRUSH_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Cursor

1. Go to Settings > MCP Servers > Add Server
2. Configure:
   - **Name**: `Semrush MCP`
   - **Type**: `command`
   - **Command**: `node`
   - **Arguments**: `/path/to/semrush-mcp/dist/index.js`
   - **Environment Variables**: `SEMRUSH_API_KEY=your_api_key`

### Other MCP Clients

Any MCP-compatible client can connect using stdio transport. Point it at `semrush-mcp` or `node dist/index.js` with the `SEMRUSH_API_KEY` environment variable set.

## CLI Usage

The `semrush` CLI is built for both human use and AI coding agents like Claude Code that can invoke shell commands directly. All commands support `-d, --database <db>` (country code, default: `us`), `-l, --limit <n>`, and `-f, --format <text|json>`.

### Quick Overview

Auto-detects keyword vs domain:

```bash
semrush q "seo tools"              # Keyword overview
semrush q example.com              # Domain overview
```

### Domain Analytics

```bash
semrush domain semrush.com                    # Domain overview
semrush d example.com --organic -l 30         # Organic keywords
semrush d example.com --paid -l 20            # Paid keywords
semrush d example.com --competitors -l 10     # Competitors
```

### Keyword Research

```bash
semrush kw "content marketing"                # Basic overview
semrush kw "seo" --related -l 20              # Related keywords
semrush kw "marketing" --questions -l 10      # Question-based keywords
semrush kw "email marketing" --broad -l 15    # Broad match keywords
semrush kw "seo tools" --organic -l 10        # SERP organic results
semrush kw "ppc software" --paid -l 10        # SERP paid results
```

### Keyword Difficulty

```bash
semrush kd "seo" "content marketing" "link building"
```

### Backlinks

```bash
semrush bl example.com                        # Backlink overview
semrush bl example.com --domains -l 20        # Referring domains
```

### Traffic Analytics

Requires .Trends API subscription.

```bash
semrush traffic example.com                   # Traffic summary
semrush traffic example.com --sources         # Traffic sources
```

### Keyword Gap Analysis

```bash
semrush gaps mysite.com competitor.com -l 50
```

### API Units Balance

```bash
semrush units
```

## Available MCP Tools

### Domain Analytics (13 tools)

| Tool | Description |
|------|-------------|
| `semrush_domain_overview` | Domain overview — traffic, keywords, rankings across all databases |
| `semrush_domain_rank` | Domain rank in a specific database |
| `semrush_domain_rank_history` | Historical rank data for a domain |
| `semrush_rank_difference` | Domains with biggest rank changes |
| `semrush_domain_organic_keywords` | Organic keywords for a domain |
| `semrush_domain_paid_keywords` | Paid keywords for a domain |
| `semrush_competitors` | Organic search competitors |
| `semrush_paid_competitors` | Paid search competitors |
| `semrush_domain_ads_history` | Domain's ad history over time |
| `semrush_domain_organic_unique` | Unique organic pages for a domain |
| `semrush_domain_adwords_unique` | Unique paid ad pages for a domain |
| `semrush_domain_shopping` | Shopping/PLA keywords for a domain |
| `semrush_domain_shopping_unique` | Unique shopping ad pages |

### URL Analytics (5 tools)

| Tool | Description |
|------|-------------|
| `semrush_url_organic` | Organic keywords for a specific URL |
| `semrush_url_adwords` | Paid keywords for a specific URL |
| `semrush_url_rank` | Rank data for a specific URL |
| `semrush_url_rank_history` | Historical rank data for a URL |
| `semrush_url_ranks` | Rank across all databases for a URL |

### Subdomain Analytics (4 tools)

| Tool | Description |
|------|-------------|
| `semrush_subdomain_rank` | Rank data for a subdomain |
| `semrush_subdomain_ranks` | Rank across all databases for a subdomain |
| `semrush_subdomain_rank_history` | Historical rank data for a subdomain |
| `semrush_subdomain_organic` | Organic keywords for a subdomain |

### Subfolder Analytics (7 tools)

| Tool | Description |
|------|-------------|
| `semrush_subfolder_organic` | Organic keywords for a subfolder |
| `semrush_subfolder_adwords` | Paid keywords for a subfolder |
| `semrush_subfolder_rank` | Rank data for a subfolder |
| `semrush_subfolder_ranks` | Rank across all databases for a subfolder |
| `semrush_subfolder_rank_history` | Historical rank data for a subfolder |
| `semrush_subfolder_organic_unique` | Unique organic pages in a subfolder |
| `semrush_subfolder_adwords_unique` | Unique paid ad pages in a subfolder |

### Backlinks (7 tools)

| Tool | Description |
|------|-------------|
| `semrush_backlinks` | Backlinks for a domain/URL |
| `semrush_backlinks_domains` | Referring domains |
| `semrush_backlinks_overview` | Backlinks summary stats |
| `semrush_backlinks_pages` | Pages with most backlinks |
| `semrush_backlinks_anchors` | Anchor text distribution |
| `semrush_backlinks_tld` | TLD distribution of backlinks |
| `semrush_backlinks_categories` | Category distribution of backlinks |

### Keyword Research (10 tools)

| Tool | Description |
|------|-------------|
| `semrush_keyword_overview` | Keyword overview across all databases |
| `semrush_keyword_overview_single_db` | Detailed keyword data for specific database |
| `semrush_batch_keyword_overview` | Analyze up to 100 keywords at once |
| `semrush_related_keywords` | Related keyword discovery |
| `semrush_broad_match_keywords` | Broad match / alternate queries |
| `semrush_phrase_questions` | Question-based keywords |
| `semrush_keyword_organic_results` | Domains ranking in organic results |
| `semrush_keyword_paid_results` | Domains in paid search results |
| `semrush_keyword_ads_history` | 12-month history of domains bidding on a keyword |
| `semrush_keyword_difficulty` | Difficulty index for ranking in top 10 |

### Traffic & Audience (17 tools, requires .Trends subscription)

| Tool | Description |
|------|-------------|
| `semrush_traffic_summary` | Traffic summary for domains |
| `semrush_traffic_sources` | Traffic sources breakdown |
| `semrush_traffic_destinations` | Where traffic goes after visiting |
| `semrush_traffic_geo` | Geographic distribution of traffic |
| `semrush_traffic_subdomains` | Traffic by subdomain |
| `semrush_traffic_subfolders` | Traffic by subfolder |
| `semrush_traffic_top_pages` | Highest-traffic pages |
| `semrush_traffic_rank` | Traffic rank over time |
| `semrush_traffic_social_media` | Social media traffic breakdown |
| `semrush_audience_insights` | Audience overlap between domains |
| `semrush_purchase_conversion` | Purchase conversion metrics |
| `semrush_household_distribution` | Household size demographics |
| `semrush_income_distribution` | Income demographics |
| `semrush_education_distribution` | Education level demographics |
| `semrush_occupation_distribution` | Occupation demographics |
| `semrush_audience_interests` | Audience interest categories |
| `semrush_traffic_accuracy` | Traffic data accuracy estimates |

### Projects & Site Audit (13 tools)

| Tool | Description |
|------|-------------|
| `semrush_list_projects` | List all projects |
| `semrush_get_project` | Get project details |
| `semrush_create_project` | Create a new project |
| `semrush_update_project` | Update project settings |
| `semrush_delete_project` | Delete a project |
| `semrush_site_audit_info` | Site audit configuration and status |
| `semrush_site_audit_snapshots` | List audit snapshots |
| `semrush_site_audit_snapshot_detail` | Get snapshot details |
| `semrush_site_audit_issues` | Audit issue metadata |
| `semrush_site_audit_pages` | List audited pages |
| `semrush_site_audit_page_detail` | Page-level audit details |
| `semrush_site_audit_history` | Audit history |
| `semrush_site_audit_launch` | Launch a new audit crawl |

### Utility (1 tool)

| Tool | Description |
|------|-------------|
| `semrush_api_units_balance` | Check API units balance |

### CLI-Only Commands

| CLI Command | Description |
|-------------|-------------|
| `semrush gaps <d1> <d2>` | Keyword gap analysis between two domains |

## Configuration

Requires `SEMRUSH_API_KEY` in environment or `.env` file.

| Variable | Default | Description |
|----------|---------|-------------|
| `SEMRUSH_API_KEY` | (required) | Your Semrush API key |
| `API_CACHE_TTL_SECONDS` | 300 | Cache TTL for API responses |
| `API_RATE_LIMIT_PER_SECOND` | 10 | Maximum API requests per second |
| `NODE_ENV` | development | Environment mode |
| `LOG_LEVEL` | info | Logging level |

### API Units Consumption

API requests consume units from your Semrush account. Different reports have different costs:

| Tool | API Units per Line |
|------|-------------------|
| `semrush_keyword_overview` | 10 |
| `semrush_keyword_overview_single_db` | 10 |
| `semrush_batch_keyword_overview` | 10 |
| `semrush_keyword_organic_results` | 10 |
| `semrush_keyword_paid_results` | 20 |
| `semrush_broad_match_keywords` | 20 |
| `semrush_related_keywords` | 40 |
| `semrush_phrase_questions` | 40 |
| `semrush_keyword_difficulty` | 50 |
| `semrush_keyword_ads_history` | 100 |

Check your balance anytime with `semrush units` or the `semrush_api_units_balance` MCP tool.

## Development

```bash
git clone https://github.com/mrkooblu/semrush-mcp.git
cd semrush-mcp
npm install
cp .env.example .env   # add your SEMRUSH_API_KEY
```

```bash
npm run dev              # MCP server in dev mode (tsx, hot reload)
npm run build            # Compile TypeScript to dist/
npm test                 # Run all tests
npm run test:unit        # Unit tests only (no API key needed)
npm run test:integration # Integration tests (requires SEMRUSH_API_KEY)
npm run lint             # ESLint
npm run format           # Prettier
```

### Git Hooks

This project uses [Husky](https://typicode.github.io/husky/) for git hooks:

- **Pre-commit**: lint-staged, ESLint, TypeScript type-check, unit tests, secret detection
- **Pre-push**: uncommitted changes check, full build, integration tests (requires `SEMRUSH_API_KEY`)

## Why Self-Host?

This self-hosted tool is for users who need more control:

- **Full control over API calls and caching** — configure TTL, inspect raw responses
- **Custom rate limiting** — set your own requests-per-second limits
- **Self-hosted / air-gapped** — runs entirely on your machine, no external MCP endpoint
- **CLI for agents** — AI coding agents can invoke `semrush` directly without MCP
- **Open source** — MIT licensed, fork and customize to your needs

## Security

- Never share your Semrush API key publicly
- API key provides access to your API units balance
- Exposing credentials can lead to unauthorized API usage and unexpected charges

## Hosted Alternative

Semrush also offers an [official hosted MCP connector](https://www.semrush.com/kb/1618-mcp) at `https://mcp.semrush.com/v1/mcp` — no setup required, authenticate with your Semrush account. See [Getting Started with MCP](https://www.semrush.com/kb/1619-getting-started-with-mcp) for details.

This is a personal project and not an official Semrush product.

## License

[MIT](./LICENSE)
