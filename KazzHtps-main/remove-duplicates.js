const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'src', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Track duplicates
const duplicates = {
    byEndpoint: {},
    byFilename: {},
    total: 0
};

// Function to find duplicates
function findDuplicates() {
    Object.keys(config.tags).forEach(category => {
        if (!Array.isArray(config.tags[category])) return;
        
        config.tags[category].forEach(endpoint => {
            const ep = endpoint.endpoint;
            const fn = endpoint.filename;
            
            // Track by endpoint
            if (!duplicates.byEndpoint[ep]) {
                duplicates.byEndpoint[ep] = [];
            }
            duplicates.byEndpoint[ep].push({ category, endpoint });
            
            // Track by filename in same category
            const key = `${category}:${fn}`;
            if (!duplicates.byFilename[key]) {
                duplicates.byFilename[key] = [];
            }
            duplicates.byFilename[key].push(endpoint);
        });
    });
}

// Function to remove duplicates
function removeDuplicates() {
    let removed = 0;
    
    Object.keys(config.tags).forEach(category => {
        if (!Array.isArray(config.tags[category])) return;
        
        const seen = new Set();
        const unique = [];
        
        config.tags[category].forEach(endpoint => {
            const key = endpoint.endpoint;
            
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(endpoint);
            } else {
                removed++;
                console.log(`  ✗ Removed duplicate: ${endpoint.name} (${endpoint.endpoint})`);
            }
        });
        
        config.tags[category] = unique;
    });
    
    return removed;
}

// Find duplicates first
findDuplicates();

// Show duplicates
console.log('\n=== Scanning for Duplicates ===\n');

let hasDuplicates = false;
Object.keys(duplicates.byEndpoint).forEach(ep => {
    if (duplicates.byEndpoint[ep].length > 1) {
        hasDuplicates = true;
        console.log(`Duplicate endpoint found: ${ep}`);
        duplicates.byEndpoint[ep].forEach((item, idx) => {
            console.log(`  ${idx + 1}. ${item.endpoint.name} in ${item.category}`);
        });
        console.log('');
    }
});

if (!hasDuplicates) {
    console.log('✓ No duplicate endpoints found!\n');
} else {
    console.log('\n=== Removing Duplicates ===\n');
    const removed = removeDuplicates();
    
    // Save updated config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    
    console.log(`\n✓ Removed ${removed} duplicate endpoint(s)`);
    console.log('✓ Config updated successfully!');
}

// Count final endpoints
let totalEndpoints = 0;
Object.keys(config.tags).forEach(category => {
    if (Array.isArray(config.tags[category])) {
        totalEndpoints += config.tags[category].length;
    }
});

console.log(`\n✓ Total unique endpoints: ${totalEndpoints}`);
