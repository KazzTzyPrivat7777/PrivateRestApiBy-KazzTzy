/**
 * Endpoint Health Checker
 * Script untuk mengecek semua endpoint dan mendeteksi error
 */

import fs from 'fs';
import path from 'path';

interface EndpointCheck {
    file: string;
    endpoint: string;
    status: 'ok' | 'error' | 'warning';
    issues: string[];
}

const results: EndpointCheck[] = [];

// Common error patterns to check
const errorPatterns = [
    { pattern: /require\(['"]([^'"]+)['"]\)/, message: 'Using require instead of import' },
    { pattern: /console\.log\(/g, message: 'Contains console.log (should be removed in production)' },
    { pattern: /TODO|FIXME|XXX/g, message: 'Contains TODO/FIXME comments' },
    { pattern: /fetch\([^)]*\)\.then\(/g, message: 'Using .then() instead of async/await' },
    { pattern: /var\s+/g, message: 'Using var instead of const/let' },
];

// Dependencies yang umum digunakan
const commonDependencies = [
    'axios',
    'cheerio',
    'form-data',
    'node-fetch',
    'canvas',
    'jimp',
    '@napi-rs/canvas',
];

function checkFile(filePath: string): EndpointCheck {
    const content = fs.readFileSync(filePath, 'utf-8');
    const issues: string[] = [];
    
    // Check for syntax errors
    try {
        // Basic TypeScript/JavaScript validation
        if (!content.includes('export default') && !content.includes('module.exports')) {
            issues.push('No export found - file might not be loaded');
        }
        
        // Check for common error patterns
        errorPatterns.forEach(({ pattern, message }) => {
            if (pattern.test(content)) {
                const matches = content.match(pattern);
                if (matches && matches.length > 0) {
                    issues.push(`${message} (${matches.length} occurrences)`);
                }
            }
        });
        
        // Check for missing dependencies
        const imports = content.match(/(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g) || [];
        imports.forEach(imp => {
            const match = imp.match(/['"]([^'"]+)['"]/);
            if (match) {
                const dep = match[1];
                // Check if it's a package (not a local file)
                if (!dep.startsWith('.') && !dep.startsWith('/')) {
                    // Check if it's in node_modules (basic check)
                    const nodeModulesPath = path.join(process.cwd(), 'node_modules', dep);
                    if (!fs.existsSync(nodeModulesPath)) {
                        issues.push(`Missing dependency: ${dep}`);
                    }
                }
            }
        });
        
        // Check for endpoint definition
        if (!content.includes('app.get') && !content.includes('app.post') && 
            !content.includes('router.get') && !content.includes('router.post')) {
            issues.push('No route handler found');
        }
        
        // Check for error handling
        if (!content.includes('try') && !content.includes('catch')) {
            issues.push('No error handling (try-catch) found');
        }
        
        // Check for response handling
        if (!content.includes('res.json') && !content.includes('res.send')) {
            issues.push('No response method found');
        }
        
    } catch (error) {
        issues.push(`Parse error: ${error}`);
    }
    
    const status = issues.length === 0 ? 'ok' : 
                   issues.some(i => i.includes('error') || i.includes('Missing')) ? 'error' : 'warning';
    
    return {
        file: filePath.replace(process.cwd(), ''),
        endpoint: path.basename(filePath, path.extname(filePath)),
        status,
        issues
    };
}

function scanDirectory(dir: string) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            scanDirectory(filePath);
        } else if (file.endsWith('.ts') && !file.includes('.test.') && !file.includes('.spec.')) {
            const result = checkFile(filePath);
            results.push(result);
        }
    });
}

console.log('🔍 Checking all endpoints...\n');

// Scan router directory
const routerPath = path.join(process.cwd(), 'router');
if (fs.existsSync(routerPath)) {
    scanDirectory(routerPath);
}

// Group by status
const ok = results.filter(r => r.status === 'ok');
const warnings = results.filter(r => r.status === 'warning');
const errors = results.filter(r => r.status === 'error');

console.log(`\n📊 Summary:`);
console.log(`✅ OK: ${ok.length}`);
console.log(`⚠️  Warnings: ${warnings.length}`);
console.log(`❌ Errors: ${errors.length}`);
console.log(`📝 Total: ${results.length}`);

// Show errors
if (errors.length > 0) {
    console.log(`\n❌ ERRORS:\n`);
    errors.forEach(e => {
        console.log(`\n📄 ${e.file}`);
        e.issues.forEach(issue => {
            console.log(`   ❌ ${issue}`);
        });
    });
}

// Show warnings
if (warnings.length > 0 && process.argv.includes('--verbose')) {
    console.log(`\n⚠️  WARNINGS:\n`);
    warnings.forEach(w => {
        console.log(`\n📄 ${w.file}`);
        w.issues.forEach(issue => {
            console.log(`   ⚠️  ${issue}`);
        });
    });
}

// Save results to JSON
const reportPath = path.join(process.cwd(), 'endpoint-check-report.json');
fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
        total: results.length,
        ok: ok.length,
        warnings: warnings.length,
        errors: errors.length
    },
    results: results
}, null, 2));

console.log(`\n💾 Report saved to: ${reportPath}`);

// Exit with error code if there are errors
if (errors.length > 0) {
    console.log('\n⚠️  Please fix the errors above before deploying!');
    process.exit(1);
} else {
    console.log('\n✅ All endpoints passed basic checks!');
    process.exit(0);
}
