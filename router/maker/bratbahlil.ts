import { Request, Response } from "express"
import { createCanvas, loadImage, registerFont } from "canvas"
import assets from "@putuofc/assetsku"

function getLines(ctx: any, text: string, maxWidth: number) {
    let words = text.split(" ")
    let lines = []
    let currentLine = words[0]

    for (let i = 1; i < words.length; i++) {
        let word = words[i]
        let width = ctx.measureText(currentLine + " " + word).width
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

export default async function bratbahlil(req: Request, res: Response) {
    const text = (req.query.text as string)?.trim()

    if (!text) {
        return res.status(400).json({
            status: false,
            message: "Parameter 'text' wajib diisi"
        })
    }

    try {
        registerFont(assets.font.get("ARRIAL"), { family: "Arial" })

        const bgUrl = 'https://c.termai.cc/i152/h5EU3se.png'
        const image = await loadImage(bgUrl)
        
        const canvas = createCanvas(image.width, image.height)
        const ctx = canvas.getContext('2d')

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

        const rect = {
            x: 100,      
            y: 770,      
            width: 720,  
            height: 140  
        }

        let fontSize = 95 
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#000000'
        ctx.font = `bold ${fontSize}px Arial`

        let lines = getLines(ctx, text, rect.width - 60)
        
        while ((lines.length * (fontSize * 1.2) > rect.height || ctx.measureText(text).width > (rect.width * 2.8)) && fontSize > 40) {
            fontSize -= 5
            ctx.font = `bold ${fontSize}px Arial`
            lines = getLines(ctx, text, rect.width - 60)
        }

        const centerX = rect.x + (rect.width / 2)
        const centerY = rect.y + (rect.height / 2) + 55

        let lineHeight = fontSize * 1.1
        let totalHeight = lines.length * lineHeight
        let startY = centerY - (totalHeight / 2) + (lineHeight / 2)

        lines.forEach((line, i) => {
            ctx.fillText(line.trim(), centerX, startY + (i * lineHeight))
        })

        const buffer = canvas.toBuffer('image/png')
        
        res.setHeader("Content-Type", "image/png")
        res.send(buffer)

    } catch (err: any) {
        res.status(500).json({
            status: false,
            message: err.message || "Internal Server Error"
        })
    }
}