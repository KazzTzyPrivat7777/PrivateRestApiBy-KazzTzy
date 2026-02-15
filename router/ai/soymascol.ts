import { Request, Response } from 'express'
import axios from 'axios'

async function soyMascolAI(question: string) {
    if (!question) throw new Error("Parameter 'q' diperlukan.")

    const { data } = await axios.post(
        "https://ai.soymaycol.icu/api/chat",
        {
            messages: [
                {
                    id: Date.now().toString(),
                    role: "user",
                    content: question,
                    experimental_attachments: []
                }
            ],
            modelId: "microsoft/Phi-4"
        },
        {
            headers: { "Content-Type": "application/json" },
            responseType: 'text',
            validateStatus: () => true
        }
    )

    // Parsing data Soy AI
    const result = data
        .split("\n")
        .filter((line: string) => line.startsWith("data:"))
        .map((line: string) => {
            try {
                const json = JSON.parse(line.replace("data:", "").trim())
                if (json.type === "text-delta" && json.delta) return json.delta
                return ''
            } catch {
                return ''
            }
        })
        .join('')

    if (!result) throw new Error("Tidak ada balasan dari AI.")

    return result
}

// Express handler
export default async function soyMascolHandler(req: Request, res: Response) {
    const question = (req.query.q || req.body.q) as string
    const session = (req.query.session || req.body.session) as string | undefined
    const apikey = (req.query.apikey || req.body.apikey) as string

    if (!question) return res.status(400).json({ status: false, message: "Parameter 'q' diperlukan." })
    if (!apikey) return res.status(401).json({ status: false, message: "Parameter 'apikey' diperlukan." })

    try {
        const answer = await soyMascolAI(question)

        res.json({
            status: true,
            name: "SoyMascol Chat",
            endpoint: "/api/ai/soyMascol",
            filename: "SoyMascol",
            response: answer,
            params: {
                q: question,
                session: session || null,
                apikey: apikey
            }
        })
    } catch (error: any) {
        res.status(500).json({ status: false, message: error.message })
    }
}