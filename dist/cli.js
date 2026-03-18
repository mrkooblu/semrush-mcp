#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import { SemrushApiError, semrushApi } from './semrush-api.js';
// ============================================================================
// CSV Parsing — SEMrush API returns semicolon-delimited CSV
// ============================================================================
const HEADER_TO_CODE = {
    Keyword: 'Ph',
    'Search Volume': 'Nq',
    CPC: 'Cp',
    Competition: 'Co',
    'Number of Results': 'Nr',
    Trends: 'Td',
    'Keyword Difficulty Index': 'Kd',
    'Keyword Intend': 'In',
    Intent: 'In',
    Relevance: 'Rr',
    Domain: 'Dn',
    Rank: 'Rk',
    'Organic Keywords': 'Or',
    'Organic Traffic': 'Ot',
    'Organic Cost': 'Oc',
    'Adwords Keywords': 'Ad',
    'Adwords Traffic': 'At',
    'Adwords Cost': 'Ac',
    Position: 'Po',
    'Previous Position': 'Pp',
    'Position Difference': 'Pd',
    Url: 'Ur',
    URL: 'Ur',
    Traffic: 'Tr',
    'Traffic (%)': 'Tr',
    'Traffic Cost': 'Tc',
    'Traffic Cost (%)': 'Tc',
    'Competition Level': 'Cr',
    'Common Keywords': 'Np',
    'SERP Features': 'Fl',
    'Featured Snippet Keyword': 'Fk',
    'Featured Snippet Position': 'Fp',
    Keywords: 'Pc',
    Database: 'Db',
    'Visible Url': 'Vu',
    'Search Volume (All Databases)': 'Sv',
    'Search Rank': 'Sh',
    'Position Type': 'Pt',
    // Backlink columns (already lowercase)
    source_title: 'source_title',
    source_url: 'source_url',
    target_url: 'target_url',
    anchor: 'anchor',
    page_score: 'page_score',
    page_ascore: 'page_ascore',
    domain_score: 'domain_score',
    domain_ascore: 'domain_ascore',
    external_num: 'external_num',
    internal_num: 'internal_num',
    first_seen: 'first_seen',
    last_seen: 'last_seen',
    domain: 'domain',
    backlinks_num: 'backlinks_num',
    ip: 'ip',
    country: 'country',
    // Traffic columns
    visits: 'visits',
    users: 'users',
    pages_per_visit: 'pages_per_visit',
    bounce_rate: 'bounce_rate',
    avg_visit_duration: 'avg_visit_duration',
    source_type: 'source_type',
    traffic_share: 'traffic_share',
};
function parseCSV(csv) {
    if (typeof csv !== 'string')
        return [];
    const lines = csv.trim().split('\n');
    if (lines.length < 2)
        return [];
    const rawHeaders = lines[0].split(';').map((h) => h.trim());
    const headers = rawHeaders.map((h) => HEADER_TO_CODE[h] || h);
    const results = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line)
            continue;
        const values = line.split(';');
        const row = {};
        headers.forEach((header, idx) => {
            row[header] = values[idx]?.trim() || '';
        });
        results.push(row);
    }
    return results;
}
// ============================================================================
// Error Handling
// ============================================================================
function handleError(error) {
    if (error instanceof SemrushApiError) {
        console.error(chalk.red(`API Error (${error.status}): ${error.message}`));
    }
    else if (error instanceof Error) {
        console.error(chalk.red(`Error: ${error.message}`));
    }
    else {
        console.error(chalk.red('Unknown error'));
    }
    process.exit(1);
}
// ============================================================================
// Output Helpers
// ============================================================================
function outputResult(data, format) {
    if (format === 'json') {
        console.log(JSON.stringify(data, null, 2));
    }
}
function getCompetitionBar(value, length = 10) {
    const filled = Math.round(value * length);
    const empty = length - filled;
    const color = value < 0.3 ? chalk.green : value < 0.7 ? chalk.yellow : chalk.red;
    return color('\u2588'.repeat(filled) + '\u2591'.repeat(empty)) + ` ${Math.round(value * 100)}%`;
}
function formatTrend(trend) {
    const values = trend.split(',').map((v) => parseFloat(v) || 0);
    if (values.length < 2)
        return trend;
    const recent = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const older = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    if (recent > older * 1.2)
        return chalk.green('^ Rising');
    if (recent < older * 0.8)
        return chalk.red('v Declining');
    return chalk.dim('- Stable');
}
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
}
function cleanDomain(domain) {
    return domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}
// ============================================================================
// Keyword Display Functions
// ============================================================================
function printKeywordOverview(keyword, data, db) {
    if (data.length === 0) {
        console.log(chalk.yellow('No data found for this keyword'));
        return;
    }
    const row = data[0];
    const volume = parseInt(row.Nq || '0');
    const cpc = parseFloat(row.Cp || '0');
    const competition = parseFloat(row.Co || '0');
    const results = parseInt(row.Nr || '0');
    console.log(chalk.bold(`"${keyword}"`) + chalk.dim(` (${db.toUpperCase()})`));
    console.log(chalk.dim('\u2501'.repeat(50)));
    console.log(`\n${chalk.bold('Volume:')}      ${chalk.cyan(volume.toLocaleString())} /month`);
    console.log(`${chalk.bold('CPC:')}         $${cpc.toFixed(2)}`);
    console.log(`${chalk.bold('Competition:')} ${getCompetitionBar(competition)}`);
    console.log(`${chalk.bold('Results:')}     ${results.toLocaleString()}`);
    if (row.Kd) {
        const kd = parseInt(row.Kd);
        const kdColor = kd < 30 ? chalk.green : kd < 60 ? chalk.yellow : chalk.red;
        console.log(`${chalk.bold('Difficulty:')}  ${kdColor(kd + '%')}`);
    }
    if (row.Td) {
        console.log(`${chalk.bold('Trend:')}       ${formatTrend(row.Td)}`);
    }
    console.log('');
}
function printKeywordTable(title, data) {
    if (data.length === 0) {
        console.log(chalk.yellow('No data found'));
        return;
    }
    console.log(chalk.bold(title) + chalk.dim(` (${data.length} results)`));
    console.log(chalk.dim('\u2501'.repeat(70)));
    console.log(`\n${'Keyword'.padEnd(35)} ${'Volume'.padStart(10)} ${'CPC'.padStart(8)} ${'KD'.padStart(6)}`);
    console.log(chalk.dim('-'.repeat(65)));
    data.forEach((row) => {
        const kw = (row.Ph || '').slice(0, 33);
        const volume = parseInt(row.Nq || '0').toLocaleString();
        const cpc = '$' + parseFloat(row.Cp || '0').toFixed(2);
        const comp = row.Kd ? row.Kd + '%' : Math.round(parseFloat(row.Co || '0') * 100) + '%';
        console.log(`${kw.padEnd(35)} ${volume.padStart(10)} ${cpc.padStart(8)} ${comp.padStart(6)}`);
    });
    console.log('');
}
function printOrganicResults(keyword, data) {
    console.log(chalk.bold(`Organic Results for "${keyword}"`));
    console.log(chalk.dim('\u2501'.repeat(60)));
    data.forEach((row, i) => {
        const pos = row.Po || String(i + 1);
        console.log(`\n${chalk.cyan(`#${pos}`)} ${chalk.bold(row.Dn || 'Unknown')}`);
        if (row.Ur)
            console.log(`   ${chalk.dim(row.Ur.slice(0, 60))}`);
        if (row.Fl)
            console.log(`   SERP Features: ${chalk.yellow(row.Fl)}`);
    });
    console.log('');
}
function printPaidResults(keyword, data) {
    console.log(chalk.bold(`Paid Results for "${keyword}"`));
    console.log(chalk.dim('\u2501'.repeat(60)));
    data.forEach((row, i) => {
        console.log(`\n${chalk.magenta(`Ad #${i + 1}`)} ${chalk.bold(row.Dn || 'Unknown')}`);
        if (row.Vu)
            console.log(`   ${chalk.dim(row.Vu)}`);
    });
    console.log('');
}
function printDifficulty(data) {
    console.log(chalk.bold('Keyword Difficulty'));
    console.log(chalk.dim('\u2501'.repeat(50)));
    data.forEach((row) => {
        const kd = parseInt(row.Kd || '0');
        const color = kd < 30 ? chalk.green : kd < 60 ? chalk.yellow : chalk.red;
        const bar = '\u2588'.repeat(Math.ceil(kd / 5)) + '\u2591'.repeat(20 - Math.ceil(kd / 5));
        console.log(`${(row.Ph || '').padEnd(30)} ${color(bar)} ${color(kd + '%')}`);
    });
    console.log('');
}
// ============================================================================
// Domain Display Functions
// ============================================================================
function printDomainOverview(domain, data, db) {
    if (data.length === 0) {
        console.log(chalk.yellow('No data found for this domain'));
        return;
    }
    const row = data[0];
    console.log(chalk.bold(domain) + chalk.dim(` (${db.toUpperCase()})`));
    console.log(chalk.dim('\u2501'.repeat(55)));
    const rank = parseInt(row.Rk || '0');
    const organicKw = parseInt(row.Or || '0');
    const organicTraffic = parseInt(row.Ot || '0');
    const organicCost = parseFloat(row.Oc || '0');
    const paidKw = parseInt(row.Ad || '0');
    const paidTraffic = parseInt(row.At || '0');
    const paidCost = parseFloat(row.Ac || '0');
    console.log(`\n${chalk.bold('SEMrush Rank:')} ${rank > 0 ? chalk.cyan('#' + rank.toLocaleString()) : chalk.dim('N/A')}`);
    console.log(chalk.bold('\nOrganic Search'));
    console.log(`  Keywords:      ${chalk.green(organicKw.toLocaleString())}`);
    console.log(`  Traffic:       ${chalk.green(organicTraffic.toLocaleString())} /month`);
    console.log(`  Traffic Cost:  ${chalk.green('$' + organicCost.toLocaleString())}`);
    console.log(chalk.bold('\nPaid Search'));
    console.log(`  Keywords:      ${chalk.magenta(paidKw.toLocaleString())}`);
    console.log(`  Traffic:       ${chalk.magenta(paidTraffic.toLocaleString())} /month`);
    console.log(`  Ad Spend:      ${chalk.magenta('$' + paidCost.toLocaleString())}`);
    console.log('');
}
function printOrganicKeywords(domain, data) {
    console.log(chalk.bold(`Organic Keywords for ${domain}`) + chalk.dim(` (${data.length} results)`));
    console.log(chalk.dim('\u2501'.repeat(80)));
    console.log(`\n${'Keyword'.padEnd(35)} ${'Pos'.padStart(5)} ${'Volume'.padStart(10)} ${'Traffic'.padStart(10)} ${'URL'.padStart(15)}`);
    console.log(chalk.dim('-'.repeat(80)));
    data.forEach((row) => {
        const kw = (row.Ph || '').slice(0, 33).padEnd(35);
        const pos = (row.Po || '-').padStart(5);
        const posColor = parseInt(row.Po || '100') <= 3
            ? chalk.green
            : parseInt(row.Po || '100') <= 10
                ? chalk.yellow
                : chalk.white;
        const volume = parseInt(row.Nq || '0')
            .toLocaleString()
            .padStart(10);
        const traffic = parseInt(row.Tr || '0')
            .toLocaleString()
            .padStart(10);
        const url = (row.Ur || '').slice(-15).padStart(15);
        console.log(`${kw} ${posColor(pos)} ${volume} ${traffic} ${chalk.dim(url)}`);
    });
    console.log('');
}
function printPaidKeywords(domain, data) {
    console.log(chalk.bold(`Paid Keywords for ${domain}`) + chalk.dim(` (${data.length} results)`));
    console.log(chalk.dim('\u2501'.repeat(70)));
    console.log(`\n${'Keyword'.padEnd(35)} ${'Pos'.padStart(5)} ${'Volume'.padStart(10)} ${'CPC'.padStart(10)}`);
    console.log(chalk.dim('-'.repeat(65)));
    data.forEach((row) => {
        const kw = (row.Ph || '').slice(0, 33).padEnd(35);
        const pos = (row.Po || '-').padStart(5);
        const volume = parseInt(row.Nq || '0')
            .toLocaleString()
            .padStart(10);
        const cpc = ('$' + parseFloat(row.Cp || '0').toFixed(2)).padStart(10);
        console.log(`${kw} ${pos} ${volume} ${cpc}`);
    });
    console.log('');
}
function printCompetitors(domain, data) {
    console.log(chalk.bold(`Competitors of ${domain}`) + chalk.dim(` (${data.length} found)`));
    console.log(chalk.dim('\u2501'.repeat(70)));
    console.log(`\n${'Domain'.padEnd(30)} ${'Common KWs'.padStart(12)} ${'Org KWs'.padStart(12)} ${'Org Traffic'.padStart(14)}`);
    console.log(chalk.dim('-'.repeat(70)));
    data.forEach((row) => {
        const dn = (row.Dn || '').slice(0, 28).padEnd(30);
        const common = parseInt(row.Np || '0')
            .toLocaleString()
            .padStart(12);
        const orgKw = parseInt(row.Or || '0')
            .toLocaleString()
            .padStart(12);
        const orgTr = parseInt(row.Ot || '0')
            .toLocaleString()
            .padStart(14);
        console.log(`${chalk.cyan(dn)} ${common} ${orgKw} ${orgTr}`);
    });
    console.log('');
}
// ============================================================================
// Backlinks Display Functions
// ============================================================================
function printBacklinksOverview(target, data) {
    if (data.length === 0) {
        console.log(chalk.yellow('No backlink data found'));
        return;
    }
    console.log(chalk.bold(`Backlinks for ${target}`) + chalk.dim(` (${data.length} results)`));
    console.log(chalk.dim('\u2501'.repeat(70)));
    data.forEach((row, i) => {
        const sourceUrl = row.source_url || '';
        const targetUrl = row.target_url || '';
        const anchor = row.anchor || '[no anchor]';
        const pageScore = row.page_ascore || row.page_score || '-';
        const domainScore = row.domain_ascore || row.domain_score || '-';
        console.log(`\n${chalk.cyan(`#${i + 1}`)} ${chalk.bold(sourceUrl.slice(0, 65))}`);
        console.log(`   -> ${chalk.dim(targetUrl.slice(0, 60))}`);
        console.log(`   Anchor: "${anchor.slice(0, 50)}" | Page: ${pageScore} | Domain: ${domainScore}`);
    });
    console.log('');
}
function printReferringDomains(target, data) {
    console.log(chalk.bold(`Referring Domains for ${target}`) + chalk.dim(` (${data.length} results)`));
    console.log(chalk.dim('\u2501'.repeat(75)));
    console.log(`\n${'Domain'.padEnd(35)} ${'Score'.padStart(8)} ${'Backlinks'.padStart(12)} ${'Country'.padStart(10)}`);
    console.log(chalk.dim('-'.repeat(70)));
    data.forEach((row) => {
        const domain = (row.domain || '').slice(0, 33).padEnd(35);
        const score = (row.domain_ascore || row.domain_score || '-').padStart(8);
        const scoreVal = parseInt(row.domain_ascore || row.domain_score || '0');
        const scoreColor = scoreVal >= 50 ? chalk.green : scoreVal >= 25 ? chalk.yellow : chalk.white;
        const backlinksNum = parseInt(row.backlinks_num || '0')
            .toLocaleString()
            .padStart(12);
        const country = (row.country || '-').toUpperCase().padStart(10);
        console.log(`${chalk.cyan(domain)} ${scoreColor(score)} ${backlinksNum} ${country}`);
    });
    console.log('');
}
// ============================================================================
// Traffic Display Functions
// ============================================================================
function printTrafficSummary(domain, data) {
    const parsed = parseCSV(data);
    if (parsed.length === 0) {
        console.log(chalk.yellow('No traffic data available'));
        console.log('');
        return;
    }
    const row = parsed[0];
    displayTrafficRow(domain, row);
    console.log('');
}
function displayTrafficRow(domain, row) {
    console.log(chalk.bold(`Traffic Analytics: ${domain}`));
    console.log(chalk.dim('\u2501'.repeat(50)));
    const visits = parseInt(row.visits || '0');
    const users = parseInt(row.users || '0');
    const pagesPerVisit = parseFloat(row.pages_per_visit || '0');
    const bounceRate = parseFloat(row.bounce_rate || '0');
    const avgDuration = parseFloat(row.avg_visit_duration || '0');
    console.log(`\n${chalk.bold('Monthly Traffic')}`);
    console.log(`  Total Visits:      ${chalk.cyan(visits.toLocaleString())}`);
    console.log(`  Unique Visitors:   ${chalk.cyan(users.toLocaleString())}`);
    console.log(`\n${chalk.bold('Engagement')}`);
    console.log(`  Pages per Visit:   ${pagesPerVisit.toFixed(2)}`);
    const bounceColor = bounceRate < 0.4 ? chalk.green : bounceRate < 0.6 ? chalk.yellow : chalk.red;
    console.log(`  Bounce Rate:       ${bounceColor((bounceRate * 100).toFixed(1) + '%')}`);
    console.log(`  Avg Duration:      ${formatDuration(avgDuration)}`);
}
function printTrafficSources(domain, data) {
    console.log(chalk.bold(`Traffic Sources for ${domain}`));
    console.log(chalk.dim('\u2501'.repeat(50)));
    const sourceColors = {
        direct: chalk.blue,
        search: chalk.green,
        referral: chalk.yellow,
        social: chalk.magenta,
        paid: chalk.red,
        email: chalk.cyan,
    };
    const rows = parseCSV(data);
    console.log('');
    rows.forEach((row) => {
        const source = row.source_type || 'unknown';
        const share = parseFloat(row.traffic_share || '0');
        const pct = (share * 100).toFixed(1);
        const barLength = Math.round(share * 30);
        const color = sourceColors[source.toLowerCase()] || chalk.white;
        console.log(`  ${source.padEnd(12)} ${color('\u2588'.repeat(barLength))}${'\u2591'.repeat(30 - barLength)} ${pct}%`);
    });
    console.log('');
}
// ============================================================================
// Gap Analysis Display
// ============================================================================
function printKeywordGaps(domain1, domain2, data) {
    if (data.length === 0) {
        console.log(chalk.yellow('No keyword gap data found'));
        return;
    }
    console.log(chalk.bold('Keyword Gap Analysis'));
    console.log(chalk.cyan(domain1) + chalk.dim(' vs ') + chalk.magenta(domain2));
    console.log(chalk.dim('\u2501'.repeat(80)));
    // Categorize keywords
    const missing = [];
    const weak = [];
    const strong = [];
    const shared = [];
    data.forEach((row) => {
        const pos1 = parseInt(row.P0 || '0') || 999;
        const pos2 = parseInt(row.P1 || '0') || 999;
        if (pos1 === 999 && pos2 < 100) {
            missing.push(row);
        }
        else if (pos1 > pos2 + 5) {
            weak.push(row);
        }
        else if (pos1 < pos2 - 5) {
            strong.push(row);
        }
        else {
            shared.push(row);
        }
    });
    if (missing.length > 0) {
        console.log(chalk.bold.red(`\nMISSING KEYWORDS (${missing.length})`));
        console.log(chalk.dim("Keywords where competitor ranks but you don't"));
        console.log(`\n${'Keyword'.padEnd(35)} ${'Volume'.padStart(10)} ${domain2.slice(0, 8).padStart(10)}`);
        console.log(chalk.dim('-'.repeat(60)));
        missing.slice(0, 15).forEach((row) => {
            const kw = (row.Ph || '').slice(0, 33).padEnd(35);
            const volume = parseInt(row.Nq || '0')
                .toLocaleString()
                .padStart(10);
            const pos2 = ('#' + (row.P1 || '-')).padStart(10);
            console.log(`${kw} ${volume} ${chalk.magenta(pos2)}`);
        });
    }
    if (weak.length > 0) {
        console.log(chalk.bold.yellow(`\nWEAK KEYWORDS (${weak.length})`));
        console.log(chalk.dim('Keywords where competitor outranks you'));
        console.log(`\n${'Keyword'.padEnd(35)} ${'Volume'.padStart(10)} ${'You'.padStart(8)} ${'Them'.padStart(8)}`);
        console.log(chalk.dim('-'.repeat(65)));
        weak.slice(0, 15).forEach((row) => {
            const kw = (row.Ph || '').slice(0, 33).padEnd(35);
            const volume = parseInt(row.Nq || '0')
                .toLocaleString()
                .padStart(10);
            const pos1 = ('#' + (row.P0 || '-')).padStart(8);
            const pos2 = ('#' + (row.P1 || '-')).padStart(8);
            console.log(`${kw} ${volume} ${chalk.yellow(pos1)} ${chalk.magenta(pos2)}`);
        });
    }
    if (strong.length > 0) {
        console.log(chalk.bold.green(`\nSTRONG KEYWORDS (${strong.length})`));
        console.log(chalk.dim('Keywords where you outrank competitor'));
        console.log(`\n${'Keyword'.padEnd(35)} ${'Volume'.padStart(10)} ${'You'.padStart(8)} ${'Them'.padStart(8)}`);
        console.log(chalk.dim('-'.repeat(65)));
        strong.slice(0, 10).forEach((row) => {
            const kw = (row.Ph || '').slice(0, 33).padEnd(35);
            const volume = parseInt(row.Nq || '0')
                .toLocaleString()
                .padStart(10);
            const pos1 = ('#' + (row.P0 || '-')).padStart(8);
            const pos2 = ('#' + (row.P1 || '-')).padStart(8);
            console.log(`${kw} ${volume} ${chalk.green(pos1)} ${chalk.dim(pos2)}`);
        });
    }
    console.log(chalk.bold('\nSUMMARY'));
    console.log(chalk.dim('\u2501'.repeat(40)));
    console.log(`  ${chalk.red('Missing:')}  ${missing.length} keywords to target`);
    console.log(`  ${chalk.yellow('Weak:')}     ${weak.length} keywords to improve`);
    console.log(`  ${chalk.green('Strong:')}   ${strong.length} keywords to defend`);
    console.log(`  ${chalk.dim('Shared:')}   ${shared.length} keywords (similar ranking)`);
    console.log('');
}
// ============================================================================
// CLI Program
// ============================================================================
const program = new Command();
program
    .name('semrush')
    .description('SEMrush CLI - Fast keyword & domain research')
    .version('0.2.0')
    .option('-d, --database <db>', 'Database/country code', 'us')
    .option('-l, --limit <n>', 'Number of results', '10')
    .option('-f, --format <fmt>', 'Output format: json or text', 'text');
// ============ QUICK OVERVIEW ============
program
    .command('quick <target>')
    .alias('q')
    .description('Quick overview (auto-detects keyword vs domain)')
    .action(async (target) => {
    const opts = program.opts();
    const db = opts.database;
    const format = opts.format;
    try {
        const isDomain = target.includes('.') && !target.includes(' ');
        if (isDomain) {
            const domain = cleanDomain(target);
            console.error(chalk.dim(`Detected domain, running overview for ${domain}...\n`));
            const response = await semrushApi.getDomainOverview(domain, db);
            const data = parseCSV(response.data);
            if (format === 'json') {
                outputResult(data, format);
                return;
            }
            printDomainOverview(domain, data, db);
        }
        else {
            console.error(chalk.dim(`Detected keyword, running overview for "${target}"...\n`));
            const response = await semrushApi.getKeywordOverviewSingleDb(target, db);
            const data = parseCSV(response.data);
            if (format === 'json') {
                outputResult(data, format);
                return;
            }
            printKeywordOverview(target, data, db);
        }
    }
    catch (error) {
        handleError(error);
    }
});
// ============ KEYWORD COMMANDS ============
program
    .command('kw <keyword>')
    .description('Keyword research and analysis')
    .option('--related', 'Get related keywords')
    .option('--questions', 'Get question-based keywords')
    .option('--broad', 'Get broad match keywords')
    .option('--organic', 'Get organic SERP results')
    .option('--paid', 'Get paid SERP results')
    .option('--difficulty', 'Get keyword difficulty')
    .action(async (keyword, cmdOpts) => {
    const opts = program.opts();
    const db = opts.database;
    const limit = parseInt(opts.limit);
    const format = opts.format;
    console.error(chalk.dim(`Analyzing keyword: "${keyword}" (${db.toUpperCase()})...\n`));
    try {
        if (cmdOpts.related) {
            const response = await semrushApi.getRelatedKeywords(keyword, db, limit);
            const data = parseCSV(response.data);
            if (format === 'json') {
                outputResult(data, format);
                return;
            }
            printKeywordTable('Related Keywords', data);
            return;
        }
        if (cmdOpts.questions) {
            const response = await semrushApi.getPhraseQuestions(keyword, db, limit);
            const data = parseCSV(response.data);
            if (format === 'json') {
                outputResult(data, format);
                return;
            }
            printKeywordTable('Question Keywords', data);
            return;
        }
        if (cmdOpts.broad) {
            const response = await semrushApi.getBroadMatchKeywords(keyword, db, limit);
            const data = parseCSV(response.data);
            if (format === 'json') {
                outputResult(data, format);
                return;
            }
            printKeywordTable('Broad Match Keywords', data);
            return;
        }
        if (cmdOpts.organic) {
            const response = await semrushApi.getKeywordOrganicResults(keyword, db, limit);
            const data = parseCSV(response.data);
            if (format === 'json') {
                outputResult(data, format);
                return;
            }
            printOrganicResults(keyword, data);
            return;
        }
        if (cmdOpts.paid) {
            const response = await semrushApi.getKeywordPaidResults(keyword, db, limit);
            const data = parseCSV(response.data);
            if (format === 'json') {
                outputResult(data, format);
                return;
            }
            printPaidResults(keyword, data);
            return;
        }
        if (cmdOpts.difficulty) {
            const response = await semrushApi.getKeywordDifficulty([keyword], db);
            const data = parseCSV(response.data);
            if (format === 'json') {
                outputResult(data, format);
                return;
            }
            printDifficulty(data);
            return;
        }
        // Default: single database overview
        const response = await semrushApi.getKeywordOverviewSingleDb(keyword, db);
        const data = parseCSV(response.data);
        if (format === 'json') {
            outputResult(data, format);
            return;
        }
        printKeywordOverview(keyword, data, db);
    }
    catch (error) {
        handleError(error);
    }
});
// ============ BATCH KEYWORD DIFFICULTY ============
program
    .command('kd <keywords...>')
    .description('Check keyword difficulty for multiple keywords')
    .action(async (keywords) => {
    const opts = program.opts();
    const db = opts.database;
    const format = opts.format;
    console.error(chalk.dim(`Checking difficulty for ${keywords.length} keywords...\n`));
    try {
        const response = await semrushApi.getKeywordDifficulty(keywords, db);
        const data = parseCSV(response.data);
        if (format === 'json') {
            outputResult(data, format);
            return;
        }
        printDifficulty(data);
    }
    catch (error) {
        handleError(error);
    }
});
// ============ DOMAIN COMMANDS ============
program
    .command('domain <domain>')
    .alias('d')
    .description('Domain analytics and research')
    .option('--organic', 'Get organic keywords')
    .option('--paid', 'Get paid keywords')
    .option('--competitors', 'Get organic competitors')
    .action(async (domain, cmdOpts) => {
    const opts = program.opts();
    const db = opts.database;
    const limit = parseInt(opts.limit);
    const format = opts.format;
    domain = cleanDomain(domain);
    console.error(chalk.dim(`Analyzing domain: ${domain} (${db.toUpperCase()})...\n`));
    try {
        if (cmdOpts.organic) {
            const response = await semrushApi.getDomainOrganicKeywords(domain, db, limit);
            const data = parseCSV(response.data);
            if (format === 'json') {
                outputResult(data, format);
                return;
            }
            printOrganicKeywords(domain, data);
            return;
        }
        if (cmdOpts.paid) {
            const response = await semrushApi.getDomainPaidKeywords(domain, db, limit);
            const data = parseCSV(response.data);
            if (format === 'json') {
                outputResult(data, format);
                return;
            }
            printPaidKeywords(domain, data);
            return;
        }
        if (cmdOpts.competitors) {
            const response = await semrushApi.getCompetitorsInOrganic(domain, db, limit);
            const data = parseCSV(response.data);
            if (format === 'json') {
                outputResult(data, format);
                return;
            }
            printCompetitors(domain, data);
            return;
        }
        // Default: domain overview
        const response = await semrushApi.getDomainOverview(domain, db);
        const data = parseCSV(response.data);
        if (format === 'json') {
            outputResult(data, format);
            return;
        }
        printDomainOverview(domain, data, db);
    }
    catch (error) {
        handleError(error);
    }
});
// ============ BACKLINKS COMMANDS ============
program
    .command('backlinks <target>')
    .alias('bl')
    .description('Backlink analysis')
    .option('--domains', 'Get referring domains instead of individual backlinks')
    .action(async (target, cmdOpts) => {
    const opts = program.opts();
    const limit = parseInt(opts.limit);
    const format = opts.format;
    target = cleanDomain(target);
    console.error(chalk.dim(`Analyzing backlinks for: ${target}...\n`));
    try {
        if (cmdOpts.domains) {
            const response = await semrushApi.getBacklinksDomains(target, limit);
            const data = parseCSV(response.data);
            if (format === 'json') {
                outputResult(data, format);
                return;
            }
            printReferringDomains(target, data);
            return;
        }
        // Default: individual backlinks
        const response = await semrushApi.getBacklinks(target, limit);
        const data = parseCSV(response.data);
        if (format === 'json') {
            outputResult(data, format);
            return;
        }
        printBacklinksOverview(target, data);
    }
    catch (error) {
        handleError(error);
    }
});
// ============ TRAFFIC COMMANDS ============
program
    .command('traffic <domain>')
    .description('Traffic analytics (requires .Trends subscription)')
    .option('--sources', 'Get traffic sources breakdown')
    .action(async (domain, cmdOpts) => {
    const opts = program.opts();
    const format = opts.format;
    domain = cleanDomain(domain);
    console.error(chalk.dim(`Fetching traffic data for: ${domain}...\n`));
    try {
        if (cmdOpts.sources) {
            const response = await semrushApi.getTrafficSources(domain);
            if (format === 'json') {
                console.log(JSON.stringify(response.data, null, 2));
                return;
            }
            printTrafficSources(domain, response.data);
            return;
        }
        // Default: traffic summary
        const response = await semrushApi.getTrafficSummary([domain]);
        if (format === 'json') {
            console.log(JSON.stringify(response.data, null, 2));
            return;
        }
        printTrafficSummary(domain, response.data);
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        if (errMsg.includes('ACCESS DENIED') ||
            errMsg.includes('subscription') ||
            errMsg.includes('403')) {
            console.error(chalk.yellow('Traffic Analytics requires a .Trends subscription'));
            console.error(chalk.dim('This data is available with SEMrush .Trends add-on'));
            process.exit(1);
        }
        handleError(error);
    }
});
// ============ KEYWORD GAP ANALYSIS ============
program
    .command('gaps <domain1> <domain2>')
    .alias('gap')
    .description('Keyword gap analysis between two domains')
    .action(async (domain1, domain2) => {
    const opts = program.opts();
    const db = opts.database;
    const limit = parseInt(opts.limit);
    const format = opts.format;
    domain1 = cleanDomain(domain1);
    domain2 = cleanDomain(domain2);
    console.error(chalk.dim(`Finding keyword gaps: ${domain1} vs ${domain2}...\n`));
    try {
        // Keyword gap uses the domain_domains report — we use getBatchKeywordOverview
        // pattern but the actual gap endpoint needs a custom call. Since semrush-api.ts
        // doesn't have a dedicated gap method, we'll get organic keywords for both
        // domains and compare. However, for proper gap analysis we should note this
        // uses a different approach than the old CLI which had a dedicated keywordGap function.
        //
        // The old API used: type=domain_domains, domains=d1|d2, export_columns=Ph,Nq,Cp,Co,P0,Ur0,P1,Ur1
        // The shared API client doesn't expose this endpoint directly, so we fetch
        // organic keywords from both domains and build the comparison.
        const [resp1, resp2] = await Promise.all([
            semrushApi.getDomainOrganicKeywords(domain1, db, limit > 50 ? limit : 50),
            semrushApi.getDomainOrganicKeywords(domain2, db, limit > 50 ? limit : 50),
        ]);
        const data1 = parseCSV(resp1.data);
        const data2 = parseCSV(resp2.data);
        // Build keyword map
        const kwMap = new Map();
        data1.forEach((row) => {
            const kw = row.Ph || '';
            if (!kw)
                return;
            kwMap.set(kw, {
                Ph: kw,
                Nq: row.Nq || '0',
                Cp: row.Cp || '0',
                Co: row.Co || '0',
                P0: row.Po || '0',
                Ur0: row.Ur || '',
                P1: '0',
                Ur1: '',
            });
        });
        data2.forEach((row) => {
            const kw = row.Ph || '';
            if (!kw)
                return;
            const existing = kwMap.get(kw);
            if (existing) {
                existing.P1 = row.Po || '0';
                existing.Ur1 = row.Ur || '';
            }
            else {
                kwMap.set(kw, {
                    Ph: kw,
                    Nq: row.Nq || '0',
                    Cp: row.Cp || '0',
                    Co: row.Co || '0',
                    P0: '0',
                    Ur0: '',
                    P1: row.Po || '0',
                    Ur1: row.Ur || '',
                });
            }
        });
        const gapData = Array.from(kwMap.values());
        if (format === 'json') {
            outputResult(gapData, format);
            return;
        }
        printKeywordGaps(domain1, domain2, gapData);
    }
    catch (error) {
        handleError(error);
    }
});
// ============ API UNITS ============
program
    .command('units')
    .description('Check API units balance')
    .action(async () => {
    const format = program.opts().format;
    try {
        const response = await semrushApi.getApiUnitsBalance();
        const balance = typeof response.data === 'string' ? response.data.trim() : JSON.stringify(response.data);
        if (format === 'json') {
            console.log(JSON.stringify({ units: balance }, null, 2));
            return;
        }
        console.log(chalk.bold('API Units Balance'));
        console.log(chalk.dim('\u2501'.repeat(30)));
        console.log(`\n  ${chalk.cyan(balance)} units remaining\n`);
    }
    catch (error) {
        handleError(error);
    }
});
// Parse and run
program.parse();
