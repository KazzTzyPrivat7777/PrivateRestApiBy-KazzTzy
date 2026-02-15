import { Request, Response } from 'express';
import axios from 'axios';

export default async function cewekBratHandler(req: Request, res: Response) {
    const text = (req.query.text || req.body.text) as string;

    if (!text) {
        return res.status(400).json({
            status: false,
            message: "Parameter 'text' diperlukan."
        });
    }

    try {
        const url = `https://api.deline.web.id/maker/cewekbrat?text=${encodeURIComponent(text)}`;

        const response = await axios.get(url, {
            responseType: 'arraybuffer', // output image
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
            message: error.message || 'Internal Server Error'
        });
    }
}