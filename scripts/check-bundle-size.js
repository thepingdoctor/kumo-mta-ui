#!/usr/bin/env node

/**
 * Bundle Size Check Script
 * Validates that production bundle sizes stay within defined performance budgets
 *
 * Performance Budgets:
 * - Total JS: < 500KB (gzipped)
 * - Total CSS: < 100KB (gzipped)
 * - Single chunk: < 250KB (gzipped)
 * - HTML: < 50KB (gzipped)
 *
 * Exit codes:
 * 0 - All bundles within budget
 * 1 - One or more bundles exceed budget
 */

import { promises as fs } from 'fs';
import { resolve, dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';
import { gzipSync } from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Performance budgets (in bytes)
const BUDGETS = {
  totalJS: 500 * 1024,      // 500KB
  totalCSS: 100 * 1024,     // 100KB
  singleChunk: 250 * 1024,  // 250KB per chunk
  html: 50 * 1024,          // 50KB
};

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Get gzipped size of a file
 */
async function getGzippedSize(filePath) {
  try {
    const content = await fs.readFile(filePath);
    const gzipped = gzipSync(content, { level: 9 });
    return gzipped.length;
  } catch (error) {
    console.error(`${colors.red}Error reading file ${filePath}:${colors.reset}`, error.message);
    return 0;
  }
}

/**
 * Recursively get all files in a directory
 */
async function getAllFiles(dir, fileList = []) {
  const files = await fs.readdir(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) {
      await getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Analyze bundle sizes
 */
async function analyzeBundleSize() {
  const distPath = resolve(__dirname, '../dist');

  try {
    await fs.access(distPath);
  } catch {
    console.error(`${colors.red}${colors.bold}Error:${colors.reset} dist folder not found. Run 'npm run build' first.`);
    process.exit(1);
  }

  console.log(`\n${colors.cyan}${colors.bold}📦 Bundle Size Analysis${colors.reset}\n`);

  // Get all files
  const allFiles = await getAllFiles(distPath);

  // Categorize files
  const jsFiles = allFiles.filter(f => extname(f) === '.js');
  const cssFiles = allFiles.filter(f => extname(f) === '.css');
  const htmlFiles = allFiles.filter(f => extname(f) === '.html');

  // Calculate sizes
  const jsSizes = await Promise.all(jsFiles.map(async (file) => ({
    file: file.replace(distPath + '/', ''),
    size: await getGzippedSize(file),
  })));

  const cssSizes = await Promise.all(cssFiles.map(async (file) => ({
    file: file.replace(distPath + '/', ''),
    size: await getGzippedSize(file),
  })));

  const htmlSizes = await Promise.all(htmlFiles.map(async (file) => ({
    file: file.replace(distPath + '/', ''),
    size: await getGzippedSize(file),
  })));

  // Calculate totals
  const totalJS = jsSizes.reduce((sum, { size }) => sum + size, 0);
  const totalCSS = cssSizes.reduce((sum, { size }) => sum + size, 0);
  const totalHTML = htmlSizes.reduce((sum, { size }) => sum + size, 0);
  const totalSize = totalJS + totalCSS + totalHTML;

  // Track budget violations
  const violations = [];

  // Print JavaScript bundles
  console.log(`${colors.bold}JavaScript Bundles (gzipped):${colors.reset}`);
  jsSizes
    .sort((a, b) => b.size - a.size)
    .forEach(({ file, size }) => {
      const exceeds = size > BUDGETS.singleChunk;
      const color = exceeds ? colors.red : colors.green;
      const warning = exceeds ? ' ⚠️  EXCEEDS BUDGET' : '';
      console.log(`  ${color}${formatBytes(size).padEnd(12)}${colors.reset} ${file}${warning}`);

      if (exceeds) {
        violations.push(`${file} exceeds single chunk budget (${formatBytes(size)} > ${formatBytes(BUDGETS.singleChunk)})`);
      }
    });

  const jsColor = totalJS > BUDGETS.totalJS ? colors.red : colors.green;
  console.log(`  ${colors.bold}${jsColor}Total: ${formatBytes(totalJS)}${colors.reset} (Budget: ${formatBytes(BUDGETS.totalJS)})`);

  if (totalJS > BUDGETS.totalJS) {
    violations.push(`Total JS exceeds budget (${formatBytes(totalJS)} > ${formatBytes(BUDGETS.totalJS)})`);
  }

  // Print CSS bundles
  if (cssSizes.length > 0) {
    console.log(`\n${colors.bold}CSS Bundles (gzipped):${colors.reset}`);
    cssSizes
      .sort((a, b) => b.size - a.size)
      .forEach(({ file, size }) => {
        console.log(`  ${colors.green}${formatBytes(size).padEnd(12)}${colors.reset} ${file}`);
      });

    const cssColor = totalCSS > BUDGETS.totalCSS ? colors.red : colors.green;
    console.log(`  ${colors.bold}${cssColor}Total: ${formatBytes(totalCSS)}${colors.reset} (Budget: ${formatBytes(BUDGETS.totalCSS)})`);

    if (totalCSS > BUDGETS.totalCSS) {
      violations.push(`Total CSS exceeds budget (${formatBytes(totalCSS)} > ${formatBytes(BUDGETS.totalCSS)})`);
    }
  }

  // Print HTML files
  if (htmlSizes.length > 0) {
    console.log(`\n${colors.bold}HTML Files (gzipped):${colors.reset}`);
    htmlSizes.forEach(({ file, size }) => {
      const exceeds = size > BUDGETS.html;
      const color = exceeds ? colors.red : colors.green;
      const warning = exceeds ? ' ⚠️  EXCEEDS BUDGET' : '';
      console.log(`  ${color}${formatBytes(size).padEnd(12)}${colors.reset} ${file}${warning}`);

      if (exceeds) {
        violations.push(`${file} exceeds HTML budget (${formatBytes(size)} > ${formatBytes(BUDGETS.html)})`);
      }
    });
  }

  // Print summary
  console.log(`\n${colors.bold}${colors.cyan}Summary:${colors.reset}`);
  console.log(`  Total Size (gzipped): ${colors.bold}${formatBytes(totalSize)}${colors.reset}`);
  console.log(`  JavaScript: ${formatBytes(totalJS)}`);
  console.log(`  CSS: ${formatBytes(totalCSS)}`);
  console.log(`  HTML: ${formatBytes(totalHTML)}`);

  // Print violations
  if (violations.length > 0) {
    console.log(`\n${colors.red}${colors.bold}❌ Budget Violations (${violations.length}):${colors.reset}`);
    violations.forEach(violation => {
      console.log(`  ${colors.red}•${colors.reset} ${violation}`);
    });
    console.log(`\n${colors.yellow}💡 Recommendations:${colors.reset}`);
    console.log(`  • Enable code splitting for large components`);
    console.log(`  • Use dynamic imports for routes`);
    console.log(`  • Analyze dependencies with 'npm run build -- --mode analyze'`);
    console.log(`  • Consider lazy loading heavy libraries`);
    console.log(`  • Review and remove unused dependencies\n`);
    process.exit(1);
  }

  console.log(`\n${colors.green}${colors.bold}✅ All bundles within budget!${colors.reset}\n`);
  process.exit(0);
}

// Run analysis
analyzeBundleSize().catch((error) => {
  console.error(`${colors.red}${colors.bold}Error:${colors.reset}`, error.message);
  process.exit(1);
});
