const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'src', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Function to add apikey parameter if not exists
function addApikeyParam(endpoint) {
    if (!endpoint.params) {
        endpoint.params = [];
    }
    
    // Check if apikey already exists
    const hasApikey = endpoint.params.some(p => p.name === 'apikey');
    
    if (!hasApikey) {
        // Add apikey at the end
        endpoint.params.push({
            name: 'apikey',
            required: true,
            description: 'API Key untuk autentikasi'
        });
    }
    
    return endpoint;
}

// Process all categories
let totalUpdated = 0;
Object.keys(config.tags).forEach(category => {
    if (Array.isArray(config.tags[category])) {
        config.tags[category] = config.tags[category].map(endpoint => {
            const updated = addApikeyParam(endpoint);
            totalUpdated++;
            return updated;
        });
    }
});

// Remove monitoring endpoints if exists
if (config.tags.monitoring) {
    delete config.tags.monitoring;
    console.log('✓ Monitoring endpoints removed');
}

// Save updated config
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

console.log(`\n✓ Config updated successfully!`);
console.log(`✓ Total endpoints updated: ${totalUpdated}`);
console.log(`✓ All endpoints now have 'apikey' parameter`);
