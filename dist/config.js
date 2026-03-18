import chalk from 'chalk';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
// Redaction function with type safety
const redactSensitive = (input) => {
    if (typeof input === 'string') {
        return input
            .replace(/[0-9a-fA-F]{32,64}/g, '[REDACTED_KEY]') // Hex keys
            .replace(/[^=&\s]{32,}/g, '[REDACTED_LONG_VALUE]') // Long strings
            .replace(/(api_key|key|token|password)=([^&\s]+)/gi, '$1=[REDACTED]');
    }
    if (input && typeof input === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(input)) {
            sanitized[key] =
                key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')
                    ? '[REDACTED]'
                    : redactSensitive(value);
        }
        return sanitized;
    }
    return input;
};
// Custom logger implementation
export const logger = {
    error: (...args) => process.stderr.write(`${chalk.red('[ERROR]')} ${args.map(redactSensitive).join(' ')}\n`),
    warn: (...args) => process.stderr.write(`${chalk.yellow('[WARN]')} ${args.map(redactSensitive).join(' ')}\n`),
    info: (...args) => process.stderr.write(`${chalk.blue('[INFO]')} ${args.map(redactSensitive).join(' ')}\n`),
    debug: (...args) => {
        if (process.env.LOG_LEVEL === 'debug') {
            process.stderr.write(`${chalk.gray('[DEBUG]')} ${args.map(redactSensitive).join(' ')}\n`);
        }
    },
};
// Determine file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENV_FILE_PATH = resolve(__dirname, '..', '.env');
let secretLoaded = false;
// Load environment variables
const loadEnv = () => {
    if (secretLoaded)
        return;
    // Check external environment first
    const externalKey = process.env.SEMRUSH_API_KEY;
    if (externalKey) {
        logger.info('Using SEMRUSH_API_KEY from external environment variables.');
        secretLoaded = true;
        return;
    }
    try {
        const envContent = readFileSync(ENV_FILE_PATH, 'utf8');
        const envVars = envContent.split('\n').reduce((acc, line) => {
            const [key, value] = line.split('=');
            if (key && value)
                acc[key.trim()] = value.trim();
            return acc;
        }, {});
        // Set environment variables if not already set
        Object.entries(envVars).forEach(([key, value]) => {
            if (!process.env[key]) {
                process.env[key] = value;
            }
        });
        logger.info('Loaded environment variables from .env file');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(`No valid .env file found: ${message}. Using environment variables or defaults.`);
    }
};
// Initialize environment
loadEnv();
// Export configuration object using Config interface
export const config = {
    SEMRUSH_API_KEY: process.env.SEMRUSH_API_KEY,
    API_CACHE_TTL_SECONDS: parseInt(process.env.API_CACHE_TTL_SECONDS || '300', 10),
    API_RATE_LIMIT_PER_SECOND: parseInt(process.env.API_RATE_LIMIT_PER_SECOND || '10', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
// Validate environment
export function validateEnv() {
    if (!config.SEMRUSH_API_KEY) {
        logger.warn('Missing SEMRUSH_API_KEY. API calls will fail without it.');
    }
}
// Setup logging and status
export function logConfigStatus() {
    validateEnv();
    logger.info('Configuration loaded:');
    logger.info(`  • Environment: ${config.NODE_ENV}`);
    logger.info(`  • API Key: ${config.SEMRUSH_API_KEY ? '[PROVIDED]' : '[MISSING]'}`);
    logger.info(`  • Cache TTL: ${config.API_CACHE_TTL_SECONDS} seconds`);
    logger.info(`  • Rate Limit: ${config.API_RATE_LIMIT_PER_SECOND} requests per second`);
    logger.info(`  • Log Level: ${config.LOG_LEVEL}`);
}
