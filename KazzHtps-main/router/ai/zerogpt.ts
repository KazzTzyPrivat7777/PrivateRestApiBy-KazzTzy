import { Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';

async function zeroGPTDetect(message: string, apikey: string) {
    if (!message) throw new Error('Text is required.');
    if (!apikey) throw new Error('API key is required.');

    const apiUrl = 'https://api.zerogpt.com/api/detect/detectText';
    const referer = 'https://www.zerogpt.com/';

    const generateCookies = () => {
        const timestamp = Date.now();
        const randomId = () => Math.random().toString(36).substring(2, 15);
        const uuid = () => crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : randomId() + randomId();

        return {
            '_gcl_au': `1.1.${Math.floor(Math.random() * 9000000000) + 1000000000}.${timestamp}`,
            '_ga': `GA1.1.${Math.floor(Math.random() * 9000000000) + 1000000000}.${timestamp}`,
            '_ga_0YHYR2F422': `GS2.1.s${timestamp}$o1$g0$t${timestamp}$j60$l0$h${Math.floor(Math.random() * 9000000000)}`,
            '__gads': `ID=${uuid().substring(0, 16)}:T=${timestamp}:RT=${timestamp}:S=ALNI_${randomId()}${randomId()}`,
            '__gpi': `UID=${uuid().substring(0, 16)}:T=${timestamp}:RT=${timestamp}:S=ALNI_${randomId()}${randomId()}`,
            '__eoi': `ID=${uuid().substring(0, 16)}:T=${timestamp}:RT=${timestamp}:S=AA-${randomId()}`,
            '_cc_id': uuid().substring(0, 32),
            'panoramaId_expiry': (timestamp + 604800000).toString(),
            'panoramaId': uuid() + uuid(),
            'panoramaIdType': 'panoDevice'
        };
    };

    const getCookieString = () => {
        return Object.entries(generateCookies())
            .map(([key, value]) => `${key}=${value}`)
            .join('; ');
    };

    const { data } = await axios.post(
        apiUrl,
        { input_text: message },
        {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Content-Type': 'application/json',
                'Origin': 'https://www.zerogpt.com',
                'Referer': referer,
                'Cookie': getCookieString(),
                'X-API-Key': apikey
            }
        }
    );

    if (!data.success) throw new Error(data.message || 'Detection failed');

    const result = data.data;
    return {
        isHuman: result.isHuman,
        isAI: 100 - result.isHuman,
        feedback: result.feedback,
        fakePercentage: result.fakePercentage,
        textWords: result.textWords,
        aiWords: result.aiWords,
        detectedLanguage: result.detected_language,
        additionalFeedback: result.additional_feedback,
        originalText: result.originalParagraph,
        sentences: result.sentences
    };
}

export default async function zeroGPTHandler(req: Request, res: Response) {
    // Ambil parameter dari query string saja
    const text = req.query.text as string;
    const apikey = req.query.apikey as string;

    if (!text || !apikey) {
        return res.status(400).json({
            creator: "KayzzAoshi",
            status: false,
            message: "parameter 'text' dan 'apikey' wajib diisi"
        });
    }

    try {
        const result = await zeroGPTDetect(text, apikey);
        res.json({
            creator: "KayzzAoshi",
            status: true,
            response: result
        });
    } catch (error: any) {
        res.status(500).json({
            creator: "KayzzAoshi",
            status: false,
            message: error.message || "internal server error"
        });
    }
}