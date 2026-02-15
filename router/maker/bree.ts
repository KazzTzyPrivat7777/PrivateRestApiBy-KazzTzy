import { Request, Response } from "express"
import axios from "axios"
import { createCanvas, loadImage, registerFont } from "canvas"
import assets from "@putuofc/assetsku"

export default async function bree(req: Request, res: Response) {
    const text = (req.query.text as string)?.trim()

    if (!text || !text.includes("|")) {
        return res.status(400).json({
            status: false,
            message: "Format harus: teks1 | teks2"
        })
    }

    try {
        registerFont(assets.font.get("ARRIAL"), { family: "Arial" })

        let [t1, t2] = text.split("|").map(v => v.trim())

        if (!t1 || !t2) {
            return res.status(400).json({
                status: false,
                message: "Format harus: teks1 | teks2"
            })
        }

        const bgUrl = "https://c.termai.cc/i133/4Xw.jpg"
        const resImg = await axios.get(bgUrl, { responseType: "arraybuffer" })
        const background = await loadImage(Buffer.from(resImg.data, "binary"))

        const canvas = createCanvas(background.width, background.height)
        const ctx = canvas.getContext("2d")

        ctx.drawImage(background, 0, 0, canvas.width, canvas.height)

        let longest = t1.length > t2.length ? t1 : t2
        let fontSize = 280
        if (longest.length > 5) fontSize = 200
        if (longest.length > 10) fontSize = 150
        if (longest.length > 15) fontSize = 110
        if (longest.length > 20) fontSize = 85
        if (longest.length > 30) fontSize = 65

        const drawText = (txt: string, x: number, y: number, size: number) => {
            ctx.font = `bold ${size}px Arial`
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillStyle = "#000000"

            const words = txt.trim().split(" ")
            let lines: string[] = []
            let currentLine = words[0]
            const maxWidth = canvas.width * 0.45

            for (let i = 1; i < words.length; i++) {
                let testLine = currentLine + " " + words[i]
                if (ctx.measureText(testLine).width < maxWidth) {
                    currentLine = testLine
                } else {
                    lines.push(currentLine)
                    currentLine = words[i]
                }
            }
            lines.push(currentLine)

            let lineHeight = size * 1.1
            let totalHeight = lines.length * lineHeight
            let startY = y - totalHeight / 2 + lineHeight / 2

            lines.forEach((line, index) => {
                ctx.fillText(line, x, startY + index * lineHeight)
            })
        }

        drawText(t1, canvas.width * 0.74, canvas.height * 0.25, fontSize)
        drawText(t2, canvas.width * 0.74, canvas.height * 0.75, fontSize)

        const buffer = canvas.toBuffer("image/jpeg")

        res.setHeader("Content-Type", "image/jpeg")
        res.send(buffer)

    } catch (err: any) {
        res.status(500).json({
            status: false,
            message: err.message || "Gagal memproses gambar"
        })
    }
}