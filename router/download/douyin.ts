import { Request, Response } from 'express';

export default async function douyinHandler(req: Request, res: Response) {
    try {
        const { url } = req.query;

        if (!url || typeof url !== 'string') {
            return res.status(400).json({
                status: false,
                error: 'URL is required'
            });
        }

        const apiResponse = await fetch(
            'https://api.siputzx.my.id/api/d/douyin?url=' + encodeURIComponent(url)
        );

        if (!apiResponse.ok) {
            throw new Error('Failed to fetch Douyin data');
        }

        const json: any = await apiResponse.json();

        if (!json || json.status !== true) {
            throw new Error('API returned invalid response');
        }

        // kembalikan data mentah seperti versi axios
        res.status(200).json({
            status: true,
            result: json
        });

    } catch (error: any) {
        console.error('Error douyin:', error);
        res.status(500).json({
            status: false,
            error: error.message || 'Internal Server Error'
        });
    }
}