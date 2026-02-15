import { Request, Response } from 'express'
import axios from 'axios'

async function createPaste(text: string, name: string) {
    const api_dev_key = 'h9WMT2Mn9QW-qDhvUSc-KObqAYcjI0he'

    const data = new URLSearchParams({
        api_dev_key,
        api_option: 'paste',
        api_paste_code: text,
        api_paste_name: name
    })

    const res = await axios.post(
        'https://pastebin.com/api/api_post.php',
        data.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    if (typeof res.data !== 'string') {
        throw new Error('Invalid response')
    }

    if (res.data.startsWith('Bad API request')) {
        throw new Error(res.data)
    }

    return res.data
}

export default async function pastebinHandler(req: Request, res: Response) {
    const text = (req.query.text || req.body.text) as string
    const name = (req.query.name || req.body.name || 'User') as string

    if (!text) {
        return res.status(400).json({
            status: false,
            message: "Parameter 'text' diperlukan"
        })
    }

    try {
        const url = await createPaste(text.trim(), `Paste dari ${name}`)

        res.json({
            status: true,
            url
        })

    } catch (e: any) {
        res.status(500).json({
            status: false,
            message: e.message
        })
    }
}