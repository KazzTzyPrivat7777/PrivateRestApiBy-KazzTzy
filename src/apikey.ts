import { Application, Request, Response, NextFunction } from 'express';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface ApiKey {
    apikey: string;
    limit: number;
    usage: number;
    createdAt: string;
    lastUsed: string | null;
}

interface KeyData {
    keys: ApiKey[];
}

const KEY_FILE = join(process.cwd(), 'src', 'key.json');
const REQUEST_DB = join('/tmp', 'requests.json');

// Request counter functions
function getTotalRequests(): number {
    try {
        if (existsSync(REQUEST_DB)) {
            const data = readFileSync(REQUEST_DB, 'utf-8');
            return JSON.parse(data).total || 0;
        }
        return 0;
    } catch (error) {
        return 0;
    }
}

function incrementTotalRequests(): void {
    try {
        let total = getTotalRequests();
        total++;
        writeFileSync(REQUEST_DB, JSON.stringify({ 
            total, 
            lastUpdate: new Date().toISOString() 
        }));
    } catch (error) {
        console.error('Failed to increment request count:', error);
    }
}

function loadKeys(): KeyData {
    try {
        if (existsSync(KEY_FILE)) {
            const data = readFileSync(KEY_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Failed to load keys:', error);
    }
    
    return { keys: [] };
}

function saveKeys(keyData: KeyData): void {
    try {
        writeFileSync(KEY_FILE, JSON.stringify(keyData, null, 2), 'utf-8');
    } catch (error) {
        console.error('Failed to save keys:', error);
    }
}

let keysCache = loadKeys();

export function apikeyMiddleware(req: Request, res: Response, next: NextFunction): void {
    const endpoint = req.path;
    
    // Skip apikey check for certain endpoints
    if (endpoint === '/config' || endpoint === '/' || endpoint === '/docs' || endpoint === '/donasi' || endpoint.startsWith('/src/')) {
        return next();
    }
    
    // Check for apikey in query params or headers
    const apikey = req.query.apikey as string || req.headers['x-api-key'] as string;
    
    if (!apikey) {
        return res.status(401).json({
            success: false,
            message: 'API key is required. Please provide an apikey parameter or X-API-Key header.',
            example: `${endpoint}?apikey=YOUR_API_KEY`
        });
    }
    
    // Find the key
    const keyIndex = keysCache.keys.findIndex(k => k.apikey === apikey);
    
    if (keyIndex === -1) {
        return res.status(403).json({
            success: false,
            message: 'Invalid API key. Please check your API key and try again.'
        });
    }
    
    const key = keysCache.keys[keyIndex];
    
    // Check if limit exceeded
    if (key.usage >= key.limit) {
        return res.status(429).json({
            success: false,
            message: 'API key limit exceeded. Please contact the administrator for a higher limit.',
            usage: key.usage,
            limit: key.limit
        });
    }
    
    // Update usage
    keysCache.keys[keyIndex].usage++;
    keysCache.keys[keyIndex].lastUsed = new Date().toISOString();
    saveKeys(keysCache);
    
    // Increment total request counter
    incrementTotalRequests();
    
    // Store key info in request for later use
    (req as any).apiKeyInfo = {
        apikey: key.apikey,
        usage: keysCache.keys[keyIndex].usage,
        limit: key.limit
    };
    
    next();
}

export function initApiKey(app: Application): void {
    // Reload keys periodically (every 5 minutes)
    setInterval(() => {
        keysCache = loadKeys();
    }, 300000);
    
    // Endpoint to get key stats (requires admin)
    app.get('/api/apikey/stats', (req: Request, res: Response) => {
        const adminKey = req.query.admin as string;
        
        if (adminKey !== process.env.ADMIN_SECRET && adminKey !== 'admin123') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        
        res.json({
            success: true,
            totalRequests: getTotalRequests(),
            data: keysCache.keys.map(k => ({
                apikey: k.apikey.substring(0, 4) + '***',
                usage: k.usage,
                limit: k.limit,
                lastUsed: k.lastUsed
            }))
        });
    });
    
    // Endpoint to reset usage (requires admin)
    app.post('/api/apikey/reset', (req: Request, res: Response) => {
        const { admin, apikey } = req.body;
        
        if (admin !== process.env.ADMIN_SECRET && admin !== 'admin123') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        
        if (apikey) {
            // Reset specific key
            const keyIndex = keysCache.keys.findIndex(k => k.apikey === apikey);
            if (keyIndex !== -1) {
                keysCache.keys[keyIndex].usage = 0;
                saveKeys(keysCache);
                return res.json({
                    success: true,
                    message: `Usage reset for key: ${apikey}`
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'API key not found'
                });
            }
        } else {
            // Reset all keys
            keysCache.keys.forEach(k => k.usage = 0);
            saveKeys(keysCache);
            return res.json({
                success: true,
                message: 'All keys usage reset'
            });
        }
    });
    
    // Endpoint to add new key (requires admin)
    app.post('/api/apikey/add', (req: Request, res: Response) => {
        const { admin, apikey, limit } = req.body;
        
        if (admin !== process.env.ADMIN_SECRET && admin !== 'admin123') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        
        if (!apikey || !limit) {
            return res.status(400).json({
                success: false,
                message: 'Both apikey and limit are required'
            });
        }
        
        // Check if key already exists
        if (keysCache.keys.some(k => k.apikey === apikey)) {
            return res.status(400).json({
                success: false,
                message: 'API key already exists'
            });
        }
        
        keysCache.keys.push({
            apikey,
            limit: parseInt(limit),
            usage: 0,
            createdAt: new Date().toISOString().split('T')[0],
            lastUsed: null
        });
        
        saveKeys(keysCache);
        
        res.json({
            success: true,
            message: 'API key added successfully',
            apikey
        });
    });
    
    console.log('API Key system initialized');
    console.log(`Total API keys: ${keysCache.keys.length}`);
}

export function getKeyUsage(apikey: string): { usage: number; limit: number } | null {
    const key = keysCache.keys.find(k => k.apikey === apikey);
    if (key) {
        return { usage: key.usage, limit: key.limit };
    }
    return null;
}

export function getTotalRequestCount(): number {
    return getTotalRequests();
}
