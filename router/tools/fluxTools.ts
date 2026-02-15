import { Request, Response } from "express"
import axios from "axios"

const CONFIG = {
    base: "https://dydkrpmnafsnivjxmipj.supabase.co",
    apikey: "sb_publishable_W_1Ofv9769iYEEn9dfyAHQ_OhuCER6g",
    headers: {
        "User-Agent": "Dart/3.9 (dart:io)",
        "x-supabase-client-platform": "android",
        "x-client-info": "supabase-flutter/2.10.3",
        "Content-Type": "application/json; charset=utf-8",
        "x-supabase-api-version": "2024-01-01"
    }
}

let sessionToken: string | null = null

async function getSession() {
    if (sessionToken) return sessionToken
    const auth = await axios.post(`${CONFIG.base}/auth/v1/signup`, 
        { data: {}, gotrue_meta_security: { captcha_token: null } },
        { headers: { ...CONFIG.headers, "apikey": CONFIG.apikey, "Authorization": `Bearer ${CONFIG.apikey}` } }
    )
    sessionToken = auth.data.access_token
    return sessionToken
}

export default async function fluxTools(req: Request, res: Response) {
    const imageUrl = (req.query.image as string)?.trim()
    const endpoint = req.path.split('/').pop()

    if (!imageUrl) {
        res.status(400)
        res.setHeader("Content-Type", "text/plain")
        return res.send("Parameter 'image' (URL) wajib diisi")
    }

    const promptMap: Record<string, string> = {
        "toblue": "change skin color to blue",
        "towhite": "change skin color to white",
        "toblack": "change skin color to black",
        "toghibli": "convert the image into Studio Ghibli style animation, soft hand-drawn colors, warm lighting, dreamy atmosphere, high detail background painting, expressive character design"
    }

    const prompt = promptMap[endpoint || ""] || "change skin color to blue"

    try {
        const token = await getSession()
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' })
        const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64')

        const editRes = await axios.post(`${CONFIG.base}/functions/v1/edit-image`, {
            image: base64Image,
            mimeType: "image/png",
            prompt: prompt,
            model: "auto",
            isFirstAttempt: true
        }, { 
            headers: { 
                ...CONFIG.headers, 
                "apikey": CONFIG.apikey, 
                "Authorization": `Bearer ${token}` 
            } 
        })

        if (!editRes.data?.image) throw new Error("Gagal memproses gambar")

        res.setHeader("Content-Type", "image/png")
        res.send(Buffer.from(editRes.data.image, 'base64'))

    } catch (err: any) {
        if (err.response?.status === 401) sessionToken = null
        res.status(500).send("Error: " + err.message)
    }
}