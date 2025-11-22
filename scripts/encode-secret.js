#!/usr/bin/env node

/**
 * Build-time secret encoder using XOR cipher
 * Generates obfuscated code to be injected during minification
 */

// Generate random XOR key
function generateKey(length) {
    const key = [];
    for (let i = 0; i < length; i++) {
        key.push(Math.floor(Math.random() * 256));
    }
    return key;
}

// XOR encode a string
function xorEncode(str, key) {
    const encoded = [];
    for (let i = 0; i < str.length; i++) {
        encoded.push(str.charCodeAt(i) ^ key[i % key.length]);
    }
    return encoded;
}

// Generate obfuscated code snippet
function generateObfuscatedCode(secret) {
    const key = generateKey(16);
    const encoded = xorEncode(secret, key);

    // Use innocuous variable names
    return `
// Configuration cache
const _cfgCache = [${key.join(',')}];
const _cfgData = [${encoded.join(',')}];
const _getCfg = () => _cfgData.map((c, i) => String.fromCharCode(c ^ _cfgCache[i % _cfgCache.length])).join('');
`;
}

// Main
const secret = process.env.GITHUB_TOKEN;

if (!secret) {
    console.error('Error: GITHUB_TOKEN environment variable not set');
    console.error('Usage: GITHUB_TOKEN=ghp_xxx node scripts/encode-secret.js');
    process.exit(1);
}

console.log(generateObfuscatedCode(secret));
console.log('// Usage: const apiKey = _getCfg();');
