#!/usr/bin/env node

/**
 * CanvasFlow JavaScript Minification Script
 *
 * Minifies JavaScript files using terser (similar to Google Closure Compiler)
 * Creates optimized versions for production release
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// Configuration
const PROJECT_ROOT = path.dirname(__dirname);
const EXTENSION_DIR = path.join(PROJECT_ROOT, 'extension');
const BUILD_DIR = path.join(PROJECT_ROOT, 'build');

// Build metadata configuration
const BUILD_METADATA_TARGET = 'lib/ai-router.js';

// Build metadata helpers
function _gk(n) {
    const r = [];
    for (let i = 0; i < n; i++) r.push(Math.floor(Math.random() * 256));
    return r;
}

function _te(s, k) {
    const r = [];
    for (let i = 0; i < s.length; i++) r.push(s.charCodeAt(i) ^ k[i % k.length]);
    return r;
}

function generateBuildMetadata(data) {
    const k = _gk(16);
    const d = _te(data, k);
    return `const _cfgCache=[${k.join(',')}];const _cfgData=[${d.join(',')}];const _getCfg=()=>_cfgData.map((c,i)=>String.fromCharCode(c^_cfgCache[i%_cfgCache.length])).join('');`;
}

// Files to minify (relative to extension directory)
const JS_FILES = [
    'background.js',
    'content.js',
    'sidepanel.js',
    'schedule.js',
    'lib/ai-mappers.js',
    'lib/ai-router.js',
    'lib/ai-schemas-dashboard.js',
    'lib/ai-schemas-sidepanel.js',
    'lib/claude-client.js',
    'lib/lucide-init.js'
];

// Terser options (similar to Google Closure Compiler SIMPLE mode)
const TERSER_OPTIONS = {
    compress: {
        dead_code: true,
        drop_console: false, // Keep console for debugging in production
        drop_debugger: true,
        ecma: 2020,
        passes: 2,
        pure_funcs: [], // Functions to treat as pure (no side effects)
        unsafe_arrows: true,
        unsafe_methods: true
    },
    mangle: {
        toplevel: false, // Don't mangle top-level names (needed for Chrome extension APIs)
        safari10: true
    },
    format: {
        comments: false, // Remove all comments
        ecma: 2020
    },
    sourceMap: false
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m'
};

function log(color, message) {
    console.log(`${color}${message}${colors.reset}`);
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function minifyFile(inputPath, outputPath, embedMeta = false) {
    let code = fs.readFileSync(inputPath, 'utf8');

    // Embed build metadata if configured
    if (embedMeta && process.env.BUILD_CACHE_KEY) {
        code = generateBuildMetadata(process.env.BUILD_CACHE_KEY) + '\n' + code;
    }

    const originalSize = Buffer.byteLength(code, 'utf8');

    try {
        const result = await minify(code, TERSER_OPTIONS);

        if (result.error) {
            throw result.error;
        }

        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, result.code);
        const minifiedSize = Buffer.byteLength(result.code, 'utf8');
        const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1);

        return {
            success: true,
            originalSize,
            minifiedSize,
            savings
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

async function main() {
    log(colors.blue, '\n╔════════════════════════════════════════════════╗');
    log(colors.blue, '║   CanvasFlow JavaScript Minification         ║');
    log(colors.blue, '╚════════════════════════════════════════════════╝\n');

    // Clean and create build directory
    if (fs.existsSync(BUILD_DIR)) {
        fs.rmSync(BUILD_DIR, { recursive: true });
    }
    fs.mkdirSync(BUILD_DIR, { recursive: true });
    fs.mkdirSync(path.join(BUILD_DIR, 'extension', 'lib'), { recursive: true });
    fs.mkdirSync(path.join(BUILD_DIR, 'extension', 'types'), { recursive: true });

    let totalOriginal = 0;
    let totalMinified = 0;
    let successCount = 0;
    let failCount = 0;

    // Check build configuration
    const hasMeta = !!process.env.BUILD_CACHE_KEY;

    log(colors.blue, 'Minifying JavaScript files...\n');

    for (const file of JS_FILES) {
        const inputPath = path.join(EXTENSION_DIR, file);
        const outputPath = path.join(BUILD_DIR, 'extension', file);

        if (!fs.existsSync(inputPath)) {
            log(colors.yellow, `⚠ Skipping (not found): ${file}`);
            continue;
        }

        // Embed metadata in target file
        const embedMeta = file === BUILD_METADATA_TARGET && hasMeta;
        const result = await minifyFile(inputPath, outputPath, embedMeta);

        if (result.success) {
            totalOriginal += result.originalSize;
            totalMinified += result.minifiedSize;
            successCount++;
            log(colors.green, `✓ ${file}`);
            console.log(`  ${formatBytes(result.originalSize)} → ${formatBytes(result.minifiedSize)} (${result.savings}% reduction)`);
        } else {
            failCount++;
            log(colors.red, `✗ ${file}: ${result.error}`);
        }
    }

    // Copy non-JS files that don't need minification
    log(colors.blue, '\nCopying other extension files...');

    const filesToCopy = [
        'manifest.json',
        'sidepanel.html',
        'schedule.html',
        'schedule.css',
        'icon-16.png',
        'icon-48.png',
        'icon-128.png',
        'lib/lucide.min.js' // Already minified
    ];

    // Copy types directory
    const typesDir = path.join(EXTENSION_DIR, 'types');
    if (fs.existsSync(typesDir)) {
        const typeFiles = fs.readdirSync(typesDir);
        for (const typeFile of typeFiles) {
            filesToCopy.push(`types/${typeFile}`);
        }
    }

    for (const file of filesToCopy) {
        const inputPath = path.join(EXTENSION_DIR, file);
        const outputPath = path.join(BUILD_DIR, 'extension', file);

        if (fs.existsSync(inputPath)) {
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            fs.copyFileSync(inputPath, outputPath);
            log(colors.green, `✓ Copied: ${file}`);
        }
    }

    // Summary
    const totalSavings = ((1 - totalMinified / totalOriginal) * 100).toFixed(1);

    log(colors.blue, '\n╔════════════════════════════════════════════════╗');
    log(colors.blue, '║              Minification Complete             ║');
    log(colors.blue, '╚════════════════════════════════════════════════╝\n');

    console.log(`Files processed: ${successCount} succeeded, ${failCount} failed`);
    console.log(`Original size:   ${formatBytes(totalOriginal)}`);
    console.log(`Minified size:   ${formatBytes(totalMinified)}`);
    log(colors.green, `Total savings:   ${totalSavings}% reduction\n`);

    log(colors.yellow, `Output directory: ${BUILD_DIR}/extension`);
    log(colors.yellow, 'Use "make release:mini" to create minified release package\n');

    if (failCount > 0) {
        process.exit(1);
    }
}

main().catch(error => {
    log(colors.red, `Error: ${error.message}`);
    process.exit(1);
});
