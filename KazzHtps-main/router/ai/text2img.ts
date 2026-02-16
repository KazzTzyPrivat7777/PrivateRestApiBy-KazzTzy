import { Request, Response } from 'express';
import axios from 'axios';
import FormData from 'form-data';
import https from 'https';

async function generateImage(prompt: string) {
    const form = new FormData();
    form.append('Prompt', prompt);
    form.append('Language', 'eng_Latn');
    form.append('Size', '1024x1024');
    form.append('Upscale', '2');
    form.append('Batch_Index', '0');

    const agent = new https.Agent({ rejectUnauthorized: false });

    const response = await axios.post(
        'https://api.zonerai.com/zoner-ai/txt2img',
        form,
        {
            httpsAgent: agent,
            headers: {
                ...form.getHeaders(),
                'Origin': 'https://zonerai.com',
                'Referer': 'https://zonerai.com/',
                'User-Agent': 'Mozilla/5.0'
            },
            responseType: 'arraybuffer'
        }
    );

    return Buffer.from(response.data);
}

export default async function text2imgHandler(req: Request, res: Response) {
    try {
        const q = (req.query.q || req.body.q) as string;

        if (!q) {
            return res.status(400).json({
                status: false,
                error: "parameter 'q' (prompt) diperlukan"
            });
        }

        const imageBuffer = await generateImage(q);

        // Mengirimkan hasil sebagai gambar langsung
        res.set('Content-Type', 'image/png');
        res.send(imageBuffer);

    } catch (err: any) {
        res.status(500).json({
            status: false,
            error: err.message || "internal server error"
        });
    }
}