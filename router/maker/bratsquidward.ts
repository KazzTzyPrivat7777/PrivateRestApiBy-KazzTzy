import { Request, Response } from "express"
import { createCanvas, loadImage, registerFont } from "canvas"
import assets from "@putuofc/assetsku"

const wrapText = (context: any, text: string, maxWidth: number) => {
    let words = text.split(' ')
    let lines = []
    let currentLine = words[0]

    for (let i = 1; i < words.length; i++) {
        let word = words[i]
        let width = context.measureText(currentLine + " " + word).width
        if (width < maxWidth) {
            currentLine += " " + word
        } else {
            lines.push(currentLine)
            currentLine = word
        }
    }
    lines.push(currentLine)
    return lines
}

export default async function bratsquidward(req: Request, res: Response) {
    const text = (req.query.text as string)?.trim()

    if (!text) {
        return res.status(400).json({
            status: false,
            message: "Parameter 'text' wajib diisi"
        })
    }

    try {
        registerFont(assets.font.get("ARRIAL"), { family: "Arial" })

        const bgUrl = 'https://c.termai.cc/i172/LpJ.jpeg'
        const image = await loadImage(bgUrl)

        const canvas = createCanvas(image.width, image.height)
        const ctx = canvas.getContext('2d')

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

        const centerX = 370
        const centerY = 370
        const maxWidth = 230
        const maxHeight = 110 
        
        let fontSize = 50

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#000000'

        let lines: string[] = []
        do {
            ctx.font = `bold ${fontSize}px Arial`
            lines = wrapText(ctx, text, maxWidth)
            
            let totalHeight = lines.length * (fontSize * 1.2)
            let exceedsWidth = false
            
            for (let line of lines) {
                if (ctx.measureText(line).width > maxWidth) {
                    exceedsWidth = true
                    break
                }
            }

            if (totalHeight <= maxHeight && !exceedsWidth) {
                break
            }
            fontSize -= 1
        } while (fontSize > 10)

        const lineHeight = fontSize * 1.1
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