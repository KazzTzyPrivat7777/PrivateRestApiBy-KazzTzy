import { Request, Response } from 'express';
import axios from 'axios';
import { load } from 'cheerio';

export default async function sfileHandler(req: Request, res: Response) {
    const url = (req.query.url || req.body.url) as string;

    if (!url) {
        return res.status(400).json({
            creator: "KayzzAoshi",
            status: false,
            message: "Parameter 'url' diperlukan."
        });
    }

    try {
        const headers: any = {
            'user-agent': 'Mozilla/5.0 (Linux; Android 10; K)',
            accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'accept-language': 'id-ID,id;q=0.9,en;q=0.8'
        };

        // STEP 1: fetch halaman awal + cookie
        const r1 = await axios.get(url, { headers });

        const setCookie = r1.headers?.['set-cookie'];
        const cookie = Array.isArray(setCookie)
            ? setCookie.map((v: string) => v.split(';')[0]).join('; ')
            : '';

        if (cookie) headers.cookie = cookie;

        let $ = load(r1.data);

        const file_name = $('h1').first().text().trim() || null;
        const size_from_text = String(r1.data).match(/(\d+(?:\.\d+)?\s?(?:KB|MB|GB))/i)?.[1] || null;

        const infoText = $('meta[property="og:description"]').attr('content') || '';
        const author_name = infoText.match(/uploaded by\s([^ ]+)/i)?.[1] || null;
        const upload_date = infoText.match(/on\s(\d+\s[A-Za-z]+\s\d{4})/i)?.[1] || null;

        const download_count =
            $('span')
                .filter((_, el) => $(el).text().toLowerCase().includes('download'))
                .first()
                .text()
                .match(/\d+/)?.[0] || null;

        const pageurl = $('meta[property="og:url"]').attr('content');
        if (!pageurl) {
            return res.json({
                creator: "KayzzAoshi",
                status: true,
                result: {
                    file_name,
                    size: size_from_text,
                    author: author_name,
                    upload_date,
                    download_count,
                    download_url: null
                }
            });
        }

        // STEP 2
        headers.referer = url;
        const r2 = await axios.get(pageurl, { headers });
        $ = load(r2.data);

        const gateUrl = $('#download').attr('href');
        if (!gateUrl) {
            return res.json({
                creator: "KayzzAoshi",
                status: true,
                result: {
                    file_name,
                    size: size_from_text,
                    author: author_name,
                    upload_date,
                    download_count,
                    download_url: null
                }
            });
        }

        // STEP 3
        headers.referer = pageurl;
        const r3 = await axios.get(gateUrl, { headers });

        const $$ = load(r3.data);
        const scripts = $$('script')
            .map((_, el) => $$(el).html() || '')
            .get()
            .join('\n');

        const final = scripts.match(
            /https:\\\/\\\/download\d+\.sfile\.(?:co|mobi)\\\/downloadfile\\\/\d+\\\/\d+\\\/[a-z0-9]+\\\/[^"'\\\s]+(\?[^"']+)?/i
        );

        const download_url = final ? final[0].replace(/\\\//g, '/') : null;

        return res.json({
            creator: "KayzzAoshi",
            status: true,
            result: {
                file_name,
                size: size_from_text,
                author: author_name,
                upload_date,
                download_count,
                download_url
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            creator: "KayzzAoshi",
            status: false,
            message: error.message || 'Internal Server Error'
        });
    }
}

