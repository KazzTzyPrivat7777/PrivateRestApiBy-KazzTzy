import { Application, Request, Response, NextFunction } from 'express';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface MonitoringStats {
    totalRequests: number;
    todayRequests: number;
    hourRequests: number;
    activeUsers: number;
    lastUpdate: string;
    endpointStats: { [key: string]: number };
    dailyStats: { [key: string]: number };
    hourlyStats: { [key: string]: number };
    lastDate: string;
    lastHour: number;
    visitors: number;
}

interface VisitorData {
    ip: string;
    userAgent: string;
    timestamp: string;
    endpoints: string[];
}

const STATS_FILE = join(process.cwd(), 'monitoring_stats.json');
const VISITORS_FILE = join(process.cwd(), 'visitors_data.json');

function loadStats(): MonitoringStats {
    try {
        if (existsSync(STATS_FILE)) {
            const data = readFileSync(STATS_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.log('Creating new stats file');
    }
    
    const now = new Date();
    return {
        totalRequests: 0,
        todayRequests: 0,
        hourRequests: 0,
        activeUsers: 0,
        lastUpdate: now.toISOString(),
        endpointStats: {},
        dailyStats: {},
        hourlyStats: {},
        lastDate: getCurrentDate(),
        lastHour: now.getHours(),
        visitors: 0
    };
}

function saveStats(stats: MonitoringStats): void {
    try {
        writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
    } catch (error) {
        console.error('Failed to save stats:', error);
    }
}

function loadVisitors(): VisitorData[] {
    try {
        if (existsSync(VISITORS_FILE)) {
            const data = readFileSync(VISITORS_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.log('Creating new visitors file');
    }
    
    return [];
}

function saveVisitors(visitors: VisitorData[]): void {
    try {
        writeFileSync(VISITORS_FILE, JSON.stringify(visitors, null, 2), 'utf-8');
    } catch (error) {
        console.error('Failed to save visitors:', error);
    }
}

function getCurrentDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

let statsCache = loadStats();
let visitorsCache = loadVisitors();
let activeUserIPs = new Set<string>();
let visitorIPs = new Set<string>();

function updateDailyReset(): void {
    const currentDate = getCurrentDate();
    const currentHour = new Date().getHours();
    
    if (statsCache.lastDate !== currentDate) {
        statsCache.todayRequests = 0;
        statsCache.dailyStats = {};
        statsCache.lastDate = currentDate;
        console.log('Daily stats reset');
    }
    
    if (statsCache.lastHour !== currentHour) {
        statsCache.hourRequests = 0;
        statsCache.hourlyStats = {};
        statsCache.lastHour = currentHour;
        console.log('Hourly stats reset');
    }
}

function trackVisitor(ip: string, userAgent: string, endpoint: string): void {
    const now = new Date().toISOString();
    
    if (!visitorIPs.has(ip)) {
        visitorIPs.add(ip);
        statsCache.visitors++;
        
        const newVisitor: VisitorData = {
            ip,
            userAgent,
            timestamp: now,
            endpoints: [endpoint]
        };
        
        visitorsCache.push(newVisitor);
        visitorsCache = visitorsCache.slice(-1000);
    } else {
        const visitor = visitorsCache.find(v => v.ip === ip);
        if (visitor) {
            if (!visitor.endpoints.includes(endpoint)) {
                visitor.endpoints.push(endpoint);
            }
            visitor.timestamp = now;
        }
    }
    
    saveVisitors(visitorsCache);
}

export function trackingMiddleware(req: Request, res: Response, next: NextFunction): void {
    const endpoint = req.path;
    const userIP = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    if (endpoint.startsWith('/api/monitoring') || endpoint === '/config' || endpoint === '/' || endpoint === '/docs' || endpoint === '/donasi') {
        return next();
    }
    
    updateDailyReset();
    
    statsCache.totalRequests++;
    statsCache.todayRequests++;
    statsCache.hourRequests++;
    
    if (!statsCache.endpointStats[endpoint]) {
        statsCache.endpointStats[endpoint] = 0;
    }
    statsCache.endpointStats[endpoint]++;
    
    if (!statsCache.dailyStats[endpoint]) {
        statsCache.dailyStats[endpoint] = 0;
    }
    statsCache.dailyStats[endpoint]++;
    
    if (!statsCache.hourlyStats[endpoint]) {
        statsCache.hourlyStats[endpoint] = 0;
    }
    statsCache.hourlyStats[endpoint]++;
    
    activeUserIPs.add(userIP);
    statsCache.activeUsers = activeUserIPs.size;
    statsCache.lastUpdate = new Date().toISOString();
    
    trackVisitor(userIP, userAgent, endpoint);
    
    saveStats(statsCache);
    
    next();
}

export function initMonitoring(app: Application): void {
    updateDailyReset();
    
    visitorsCache.forEach(visitor => {
        visitorIPs.add(visitor.ip);
    });
    
    setInterval(() => {
        activeUserIPs.clear();
        statsCache.activeUsers = 0;
        saveStats(statsCache);
    }, 300000);
    
    setInterval(() => {
        updateDailyReset();
        saveStats(statsCache);
    }, 60000);
    
    app.get('/api/monitoring/stats', (req: Request, res: Response) => {
        const sortedEndpoints = Object.entries(statsCache.endpointStats)
            .sort((a, b) => b[1] - a[1]);
        
        res.json({
            success: true,
            data: {
                totalRequests: statsCache.totalRequests,
                todayRequests: statsCache.todayRequests,
                hourRequests: statsCache.hourRequests,
                activeUsers: statsCache.activeUsers,
                lastUpdate: statsCache.lastUpdate,
                endpointStats: Object.fromEntries(sortedEndpoints.slice(0, 10)),
                visitors: statsCache.visitors
            }
        });
    });
    
    app.get('/api/monitoring/visitors', (req: Request, res: Response) => {
        const recentVisitors = visitorsCache.slice(-50).reverse();
        res.json({
            success: true,
            data: {
                totalVisitors: statsCache.visitors,
                activeVisitors: statsCache.activeUsers,
                recentVisitors
            }
        });
    });
    
    app.post('/api/monitoring/reset', (req: Request, res: Response) => {
        const { secret } = req.body;
        
        const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123';
        
        if (secret === ADMIN_SECRET) {
            const now = new Date();
            statsCache = {
                totalRequests: 0,
                todayRequests: 0,
                hourRequests: 0,
                activeUsers: 0,
                lastUpdate: now.toISOString(),
                endpointStats: {},
                dailyStats: {},
                hourlyStats: {},
                lastDate: getCurrentDate(),
                lastHour: now.getHours(),
                visitors: 0
            };
            
            visitorsCache = [];
            visitorIPs.clear();
            activeUserIPs.clear();
            
            saveStats(statsCache);
            saveVisitors(visitorsCache);
            
            res.json({ success: true, message: 'Stats reset successfully' });
        } else {
            res.status(403).json({ success: false, message: 'Unauthorized' });
        }
    });
    
    app.post('/api/monitoring/update-visitors', (req: Request, res: Response) => {
        const { count } = req.body;
        
        if (typeof count === 'number' && count >= 0) {
            statsCache.visitors = count;
            saveStats(statsCache);
            
            res.json({ 
                success: true, 
                message: 'Visitor count updated',
                newCount: statsCache.visitors
            });
        } else {
            res.status(400).json({ 
                success: false, 
                message: 'Invalid count value' 
            });
        }
    });
    
    console.log('Permanent monitoring system initialized');
    console.log(`Current stats: ${statsCache.totalRequests} total requests, ${statsCache.visitors} visitors`);
}

export function getCurrentStats(): MonitoringStats {
    return { ...statsCache };
}

export function incrementVisitorCount(): void {
    statsCache.visitors++;
    saveStats(statsCache);
}

export function getVisitorCount(): number {
    return statsCache.visitors;
}