import { Request, Response } from 'express';
import axios from 'axios';
import FormData from 'form-data';
import https from 'https';

export default async function bratAnimeHandler(req: Request, res: Response) {
    const text = (req.query.text || req.body.text) as string;

    if (!text) {
        return res.status(400).json({
            status: false,
            message: "Parameter 'text' diperlukan."
        });
    }

    const prompt = `An anime girl cute, around 17 years old, with short white hair parted in the middle like the Uchiha clan, wearing a black sweater, with slightly orange eyes, holding a sign that says '${text}'`;
    const width = 1024;
    const height = 1024;

    try {
        const form = new FormData();
        form.append('Prompt', prompt);
        form.append('Language', 'eng_Latn');
        form.append('Size', `${width}x${height}`);
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

        res.setHeader('Content-Type', 'image/png'); // atau 'image/jpeg' jika format JPEG
        res.send(Buffer.from(response.data));

    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: error.message || 'Gagal membuat gambar BratAnime'
        });
    }
}