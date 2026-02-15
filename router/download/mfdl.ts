import { Request, Response } from 'express';
import fetch from 'node-fetch'; // Ensure node-fetch is installed

export default async function mfdlHandler(req: Request, res: Response) {
    try {
        const { mfUrl } = req.query;

        if (!mfUrl || typeof mfUrl !== 'string') {
            return res.status(400).json({
                status: false,
                error: 'mfUrl query parameter is required'
            });
        }

        // Fetch the MF URL page
        const r = await fetch(mfUrl, {
            headers: {
                'accept-encoding': 'gzip, deflate, br, zstd'
            }
        });

        if (!r.ok) {
            throw new Error(`${r.status} ${r.statusText}`);
        }

        const html = await r.text();

        // Extract download URL
        const url = html.match(/href="(.+?)"\s+id="downloadButton"/)?.[1];
        if (!url) {
            throw new Error('Failed to find download link.');
        }

        // Extract file type
        const ft = html.match(/class="filetype"><span>(.+?)<(?:.+?) \((.+?)\)/);
        const fileType = `${ft?.[1] || 'Unknown'} ${ft?.[2] || ''}`.trim();

        // Extract file name, size, and upload date
        const fileName = html.match(/class="filename">(.+?)<\/div>/)?.[1] || 'Unknown';
        const fileSize = html.match(/File size:\s*<span>(.+?)<\/span>/)?.[1] || 'Unknown';
        const uploaded = html.match(/Uploaded:\s*<span>(.+?)<\/span>/)?.[1] || 'Unknown';

        // Send response with extracted data
        res.status(200).json({
            status: true,
            result: {
                fileName,
                fileSize,
                url,
                uploaded,
                fileType
            }
        });

    } catch (error: any) {
        console.error('Error in mfdl:', error);
        res.status(500).json({
            status: false,
            error: error.message || 'Internal Server Error'
        });
    }
}