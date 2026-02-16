import { Request, Response } from 'express'

async function gptService(text: string) {
    const systemPrompt = "Kamu adalah GPT, sebuah model bahasa besar yang dilatih oleh OpenAI. Jawablah semua pertanyaan dengan gaya bahasa GPT yang profesional, cerdas, dan sangat membantu. Aku adalah GPT."
    
    const response = await fetch("https://ai.soymaycol.icu/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            modelId: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ]
        })
    })

    if (!response.ok) throw new Error(`API Error: ${response.statusText}`)

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let result = ""

    if (reader) {
        while (true) {
            const { value, done } = await reader.read()
            if (done) break
            
            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split("\n")
            
            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    try {
                        const data = JSON.parse(line.slice(6))
                        if (data.type === "text-delta") {
                            result += data.delta
                        }
                    } catch (e) {}
                }
            }
        }
    }

    return result.trim()
}

export default async function handler(req: Request, res: Response) {
    const q = (req.query.q || req.body.q) as string

    if (!q) {
        return res.status(400).json({
            status: false,
            message: "Parameter 'q' diperlukan."
        })
    }

    try {
        const response = await gptService(q)
        res.json({
            status: true,
            response: response
        })
    } catch (err: any) {
        res.status(500).json({
            status: false,
            message: err.message || "Internal Server Error"
        })
    }
}