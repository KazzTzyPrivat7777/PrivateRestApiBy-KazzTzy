import { Request, Response } from 'express';
import axios from 'axios';

export default async function faketweet2Handler(req: Request, res: Response) {
    const profile = (req.query.profile || req.body.profile) as string;
    const name = (req.query.name || req.body.name) as string;
    const username = (req.query.username || req.body.username) as string;
    const tweet = (req.query.tweet || req.body.tweet) as string;

    const image = (req.query.image || req.body.image) as string; // bisa "null"
    const theme = (req.query.theme || req.body.theme) as string; // light/dark
    const retweets = (req.query.retweets || req.body.retweets) as string;
    const quotes = (req.query.quotes || req.body.quotes) as string;
    const likes = (req.query.likes || req.body.likes) as string;
    const client = (req.query.client || req.body.client) as string;

    if (!profile || !name || !username || !tweet) {
        return res.status(400).json({
            status: false,
            message: "Parameter profile, name, username, dan tweet diperlukan."
        });
    }

    try {
        const url =
            `https://api.deline.web.id/maker/faketweet2` +
            `?profile=${encodeURIComponent(profile)}` +
            `&name=${encodeURIComponent(name)}` +
            `&username=${encodeURIComponent(username)}` +
            `&tweet=${encodeURIComponent(tweet)}` +
            `&image=${encodeURIComponent(image ?? 'null')}` +
            `&theme=${encodeURIComponent(theme ?? 'light')}` +
            `&retweets=${encodeURIComponent(retweets ?? '0')}` +
            `&quotes=${encodeURIComponent(quotes ?? '0')}` +
            `&likes=${encodeURIComponent(likes ?? '0')}` +
            `&client=${encodeURIComponent(client ?? 'Twitter')}`;

        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'image/png,image/*,*/*;q=0.8'
            }
        });

        res.set('Content-Type', 'image/png');
        res.send(response.data);
    } catch (error: any) {
        res.status(500).json({ status: false, message: error.message || 'Internal Server Error' });
    }
}

