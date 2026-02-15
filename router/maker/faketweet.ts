import { Request, Response } from 'express';
import axios from 'axios';

export default async function faketweetHandler(req: Request, res: Response) {
    const name = (req.query.name || req.body.name) as string;
    const username = (req.query.username || req.body.username) as string;
    const comment = (req.query.comment || req.body.comment) as string;
    const avatar = (req.query.avatar || req.body.avatar) as string;
    const verified = (req.query.verified || req.body.verified) as string;

    if (!name || !username || !comment || !avatar) {
        return res.status(400).json({
            status: false,
            message: "Parameter name, username, comment, dan avatar diperlukan."
        });
    }

    try {
        const url = `https://api.deline.web.id/maker/faketweet` +
            `?name=${encodeURIComponent(name)}` +
            `&username=${encodeURIComponent(username)}` +
            `&comment=${encodeURIComponent(comment)}` +
            `&avatar=${encodeURIComponent(avatar)}` +
            `&verified=${verified ?? 'false'}`;

        const response = await axios.get(url, {
            responseType: 'arraybuffer', // karena output image
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'image/png,image/*,*/*;q=0.8'
            }
        });

        res.set('Content-Type', 'image/png');
        res.send(response.data);
    } catch (error: any) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
}


