import { Request, Response } from 'express'
import axios from 'axios'

async function metaAI(question: string) {
    if (!question) throw new Error('Question is required.')

    try {
        const response = await axios.get('https://api.siputzx.my.id/api/ai/metaai', {
            params: { query: question }
        })

        if (response.data && response.data.status) {
            return response.data.data
        } else {
            throw new Error('Gagal mendapatkan respon dari Meta AI')
        }
    } catch (err) {
        throw err
    }
}

export default async function metaAIHandler(req: Request, res: Response) {
    const q = (req.query.q || req.body.q || req.query.query || req.body.query) as string

    if (!q) {
        return res.status(400).json({
            status: false,
            message: "Parameter 'q' atau 'query' diperlukan."
        })
    }

    try {
        const result = await metaAI(q)
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