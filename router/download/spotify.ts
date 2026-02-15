import { Request, Response } from 'express';

export default async function spotifyHandler(req: Request, res: Response) {
    try {
        const { url } = req.query;

        if (!url || typeof url !== 'string') {
            return res.status(400).json({
                status: false,
                error: 'URL is required'
            });
        }

        const apiResponse = await fetch(
            'https://api.siputzx.my.id/api/d/spotifyv2?url=' + encodeURIComponent(url)
        );

        if (!apiResponse.ok) {
            throw new Error('Failed to fetch Spotify data');
        }

        const json: any = await apiResponse.json();

        if (!json || json.status !== true || !json.data) {
            throw new Error('API returned invalid response');
        }

        const d = json.data;

        const result = {
            url: d.url,
            title: d.title,
            songTitle: d.songTitle,
            artist: d.artist,
            thumbnail: d.coverImage,
            download: d.mp3DownloadLink,
            cover: d.coverDownloadLink
        };

        res.status(200).json({
            status: true,
            result
        });

    } catch (error: any) {
        console.error('Error spotify:', error);
        res.status(500).json({
            status: false,
            error: error.message || 'Internal Server Error'
        });
    }
}