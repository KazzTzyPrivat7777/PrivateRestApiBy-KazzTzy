import { Request, Response } from 'express';

export default async function aioHandler(req: Request, res: Response) {
    try {
        const { url } = req.query;

        if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
            return res.status(400).json({
                status: false,
                error: 'Invalid url'
            });
        }

        // 1️⃣ Ambil cookie dari analytics
        const analyticsRes = await fetch(
            'https://downr.org/.netlify/functions/analytics',
            {
                headers: {
                    referer: 'https://downr.org/',
                    'user-agent':
                        'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Mobile Safari/537.36'
                }
            }
        );

        if (!analyticsRes.ok) {
            throw new Error('Failed to init session');
        }

        // Node fetch (undici) support getSetCookie()
        const cookies =
            (analyticsRes.headers as any).getSetCookie?.().join('; ') || '';

        // 2️⃣ Request download
        const downloadRes = await fetch(
            'https://downr.org/.netlify/functions/download',
            {
                method: 'POST',
                headers: {
                    accept: '*/*',
                    'content-type': 'application/json',
                    cookie: cookies,
                    origin: 'https://downr.org',
                    referer: 'https://downr.org/',
                    'user-agent':
                        'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Mobile Safari/537.36'
                },
                body: JSON.stringify({ url })
            }
        );

        if (!downloadRes.ok) {
            throw new Error('Failed to fetch data');
        }

        const result: any = await downloadRes.json();

        res.status(200).json({
            status: true,
            result
        });

    } catch (error: any) {
        console.error('Error aio:', error);
        res.status(500).json({
            status: false,
            error: error.message || 'Internal Server Error'
        });
    }
}