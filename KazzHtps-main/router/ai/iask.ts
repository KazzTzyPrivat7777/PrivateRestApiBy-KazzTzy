import { Request, Response } from 'express'
import axios from 'axios'

async function iAskGPT(question: string) {
    if (!question) throw new Error('Question is required.')

    const systemPrompt = "Kamu adalah GPT, sebuah model bahasa besar yang dilatih oleh OpenAI. Jawablah semua pertanyaan dengan gaya bahasa GPT yang profesional, cerdas, dan sangat membantu. Aku adalah GPT.\n\n"
    
    const payload = {
        stream: false,
        prompt: systemPrompt + question
    }

    try {
        const response = await axios.post(
            'https://api.iask.ai/v1/query',
            payload,
            {
                headers: {
                    'Authorization': 'Bearer HD7zrGqqvMy-YgGWMdSSNKGpyMFtvTpEXQUtPYfKz7I',
                    'Content-Type': 'application/json'
                },
                timeout: 120000
            }
        )

        const result = response.data.response?.message
        
        if (result) {
            return result
        } else {
            throw new Error('No response message found from iAsk API')
        }
    } catch (err) {
        throw err
    }
}

export default async function iAskGPTHandler(req: Request, res: Response) {
    // Ambil dari query string saja untuk GET
    const q = (req.query.q as string)

    if (!q) {
        return res.status(400).json({
            status: false,
            message: "Parameter 'q' diperlukan."
        })
    }

    try {
        const result = await iAskGPT(q)
        res.json({
            status: true,
            response: result
        })
    } catch (error: any) {
        res.status(500).json({
            status: false,
            message: error.message
        })
    }
}