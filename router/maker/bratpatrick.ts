import { Request, Response } from "express"
import { createCanvas, loadImage, registerFont } from "canvas"
import assets from "@putuofc/assetsku"

const wrapText = (context: any, text: string, maxWidth: number) => {
    let words = text.split(' ')
    let lines = []
    let currentLine = ''

    for (let n = 0; n < words.length; n++) {
        let testLine = currentLine + words[n] + ' '
        let metrics = context.measureText(testLine)
        let testWidth = metrics.width
        if (testWidth > maxWidth && n > 0) {
            lines.push(currentLine.trim())
            currentLine = words[n] + ' '
        } else {
            currentLine = testLine
        }
    }
    lines.push(currentLine.trim())
    return lines
}

export default async function bratpatrick(req: Request, res: Response) {
    const text = (req.query.text as string)?.trim()

    if (!text) {
        return res.status(400).json({
            status: false,
            message: "Parameter 'text' wajib diisi"
        })
    }

    try {
        registerFont(assets.font.get("ARRIAL"), { family: "Arial" })

        const bgUrl = 'https://c.termai.cc/i196/i1vG6.jpeg'
        const image = await loadImage(bgUrl)

        const canvas = createCanvas(image.width, image.height)
        const ctx = canvas.getContext('2d')

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

        const centerX = 460
        const centerY = 599
        const maxWidth = 260
        const maxHeight = 160 
        
        let fontSize = 70

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#000000'

        let lines: string[] = []
        let lineHeight = fontSize * 1.1

        while (fontSize > 8) {
            ctx.font = `bold ${fontSize}px Arial`
            lines = wrapText(ctx, text, maxWidth)
            lineHeight = fontSize * 1.05
            if ((lines.length * lineHeight) <= maxHeight) {
                break
            }
            fontSize -= 1
        }

        const totalHeight = lines.length * lineHeight
        let startY = centerY - (totalHeight / 2) + (lineHeight / 2)

        lines.forEach((line) => {
            ctx.fillText(line, centerX, startY)
            startY += lineHeight
        })

        const buffer = canvas.toBuffer('image/png')
        
        res.setHeader("Content-Type", "image/png")
        res.send(buffer)

    } catch (err: any) {
        res.status(500).json({
            status: false,
            message: err.message || "Gagal memproses gambar"
        })
    }
}