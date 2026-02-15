import { Request, Response } from "express"
import { createCanvas, loadImage, registerFont } from "canvas"
import path from "path"

// font sefolder dengan file ini
registerFont(
  path.join(__dirname, "Arial Bold.ttf"),
  { family: "ArialBold" }
)

export default async function bratanime2(req: Request, res: Response) {
  const text = req.query.text as string

  if (!text) {
    return res.status(400).json({
      status: false,
      message: "Parameter 'text' diperlukan"
    })
  }

  try {
    const bg = await loadImage("https://c.termai.cc/i151/AkEEhR.webp")

    const canvas = createCanvas(bg.width, bg.height)
    const ctx = canvas.getContext("2d")

    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)

    const content = text.trim()

    // posisi box sama seperti handler WA
    const boxX = canvas.width * 0.48
    const boxY = canvas.height * 0.47
    const boxW = canvas.width * 0.40
    const boxH = canvas.height * 0.30

    ctx.fillStyle = "#000000"
    ctx.textAlign = "center"
    ctx.textBaseline = "top"

    const wrapText = (txt: string, maxW: number) => {
      const words = txt.split(" ")
      const lines: string[] = []
      let line = ""

      for (const w of words) {
        const test = line + w + " "
        if (ctx.measureText(test).width > maxW && line) {
          lines.push(line.trim())
          line = w + " "
        } else {
          line = test
        }
      }

      if (line) lines.push(line.trim())
      return lines
    }

    let fontSize = 48
    let lines: string[] = []

    while (fontSize > 12) {
      ctx.font = `bold ${fontSize}px ArialBold`
      lines = wrapText(content, boxW - 24)

      if (lines.length * (fontSize + 6) <= boxH - 20) break
      fontSize--
    }

    const totalHeight = lines.length * (fontSize + 6)
    let startY = boxY + (boxH - totalHeight) / 2 + 30

    for (const line of lines) {
      ctx.fillText(line, boxX + boxW / 2, startY)
      startY += fontSize + 6
    }

    const buffer = canvas.toBuffer("image/png")
    res.setHeader("Content-Type", "image/png")
    res.send(buffer)

  } catch (err: any) {
    res.status(500).json({
      status: false,
      message: err.message
    })
  }
}