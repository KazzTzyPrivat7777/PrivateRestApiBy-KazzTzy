const fs = require('fs');
const path = require('path');

const routerPath = path.join(__dirname, 'router');
const configPath = path.join(__dirname, 'src', 'config.json');

// Read existing config
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Categories to scan
const categories = ['ai', 'anime', 'asupan', 'canvas', 'download', 'game', 'maker', 'nsfw', 'random', 'search', 'tools'];

function generateEndpointConfig(category, filename) {
    const name = filename.charAt(0).toUpperCase() + filename.slice(1);
    
    return {
        name: name,
        endpoint: `/api/${category}/${filename}`,
        filename: filename,
        method: "GET",
        params: [
            { "name": "apikey", "required": true, "description": "API Key untuk autentikasi" }
        ]
    };
}

// Process each category
categories.forEach(category => {
    const categoryPath = path.join(routerPath, category);
    
    if (!fs.existsSync(categoryPath)) {
        console.log(`Category ${category} not found, skipping...`);
        return;
    }
    
    const files = fs.readdirSync(categoryPath);
    const endpoints = [];
    
    files.forEach(file => {
        if (file.endsWith('.ts') || file.endsWith('.js')) {
            const filename = file.replace(/\.(ts|js)$/, '');
            
            // Check if endpoint already exists in config
            const existingEndpoint = config.tags[category]?.find(e => e.filename === filename);
            
            if (!existingEndpoint) {
                endpoints.push(generateEndpointConfig(category, filename));
                console.log(`Added: /api/${category}/${filename}`);
            }
        }
    });
    
    // Add to config
    if (endpoints.length > 0) {
        if (!config.tags[category]) {
            config.tags[category] = [];
        }
        config.tags[category].push(...endpoints);
    }
});

// Save updated config
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
console.log('\nConfig updated successfully!');
console.log(`Total categories: ${Object.keys(config.tags).length}`);
