# Semrush MCP

MCP Server & CLI for keyword research, domain analytics, backlinks, traffic analysis, and competitive intelligence.

A community-maintained, self-hosted tool that provides Semrush API data through two entry points: an **MCP server** for AI assistants like Claude Desktop and Cursor, and a **`semrush` CLI** for direct terminal use — ideal for developers and AI coding agents like Claude Code that can run shell commands on your behalf. One install gives you both.

## Quick Start

```bash
npm install -g github:mzkrasner/semrush-mcp
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
      "args": ["-y", "github:mzkrasner/semrush-mcp"],
      "env": {
        "SEMRUSH_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Features

- **Domain Analytics** — Domain overview, organic and paid keywords, competitor analysis
- **Keyword Research** — Keyword overview, related keywords, broad match, question-based keywords, SERP organic and paid results, ads history
- **Backlink Analysis** — Backlink data, referring domains
- **Traffic Analytics** — Traffic summary, traffic sources (requires .Trends subscription)
- **Keyword Gap Analysis** — Compare two domains' keyword profiles side by side
- **Keyword Difficulty** — Batch difficulty scoring for multiple keywords
- **API Units Balance** — Check remaining API credits

All capabilities are available through both the MCP server (19 tools) and the CLI.

## Installation

### Install globally from GitHub

```bash
npm install -g github:mzkrasner/semrush-mcp
```

### Or clone and link locally

```bash
git clone https://github.com/mzkrasner/semrush-mcp.git
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
      "args": ["-y", "github:mzkrasner/semrush-mcp"],
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

## Available Tools & Commands

| MCP Tool | CLI Command | Description |
|----------|-------------|-------------|
| `semrush_domain_overview` | `semrush domain <domain>` | Domain overview (traffic, keywords, rankings) |
| `semrush_domain_organic_keywords` | `semrush d <domain> --organic` | Organic keywords for a domain |
| `semrush_domain_paid_keywords` | `semrush d <domain> --paid` | Paid keywords for a domain |
| `semrush_competitors` | `semrush d <domain> --competitors` | Organic search competitors |
| `semrush_keyword_overview` | `semrush kw <keyword>` | Keyword overview data |
| `semrush_keyword_overview_single_db` | `semrush kw <keyword> -d <db>` | Detailed keyword data for specific database |
| `semrush_batch_keyword_overview` | -- | Analyze up to 100 keywords at once |
| `semrush_related_keywords` | `semrush kw <keyword> --related` | Related keyword discovery |
| `semrush_broad_match_keywords` | `semrush kw <keyword> --broad` | Broad match / alternate queries |
| `semrush_phrase_questions` | `semrush kw <keyword> --questions` | Question-based keywords |
| `semrush_keyword_organic_results` | `semrush kw <keyword> --organic` | Domains ranking in organic results |
| `semrush_keyword_paid_results` | `semrush kw <keyword> --paid` | Domains in paid search results |
| `semrush_keyword_ads_history` | -- | 12-month history of domains bidding on a keyword |
| `semrush_keyword_difficulty` | `semrush kd <keywords...>` | Difficulty index for ranking in top 10 |
| `semrush_backlinks` | `semrush bl <target>` | Backlinks for a domain/URL |
| `semrush_backlinks_domains` | `semrush bl <target> --domains` | Referring domains |
| `semrush_traffic_summary` | `semrush traffic <domain>` | Traffic summary (requires .Trends) |
| `semrush_traffic_sources` | `semrush traffic <domain> --sources` | Traffic sources (requires .Trends) |
| `semrush_api_units_balance` | `semrush units` | Check API units balance |
| -- | `semrush gaps <d1> <d2>` | Keyword gap analysis between two domains |

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
git clone https://github.com/mzkrasner/semrush-mcp.git
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

## See Also

Semrush offers an official hosted MCP connector with no setup required -- point your AI client to `https://mcp.semrush.com/v1/mcp` and authenticate with your Semrush account:

- [What is Semrush MCP?](https://www.semrush.com/kb/1618-mcp)
- [Getting Started with MCP](https://www.semrush.com/kb/1619-getting-started-with-mcp)

This project is independent and not affiliated with or endorsed by Semrush.

## Security

- Never share your Semrush API key publicly
- API key provides access to your API units balance
- Exposing credentials can lead to unauthorized API usage and unexpected charges

## License

[MIT](./LICENSE)
