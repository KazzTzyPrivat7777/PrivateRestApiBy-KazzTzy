import { Request, Response } from "express"
import * as Canvas from "canvas"

async function generateBlur(source: string) {
  const img = await Canvas.loadImage(source)

  const canvas = Canvas.createCanvas(img.width, img.height)
  const ctx = canvas.getContext("2d")

  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.imageSmoothingEnabled = true
  ctx.drawImage(img, 0, 0, canvas.width / 4, canvas.height / 4)
  ctx.drawImage(
    canvas,
    0,
    0,
    canvas.width / 4,
    canvas.height / 4,
    0,
    0,
    canvas.width + 5,
    canvas.height + 5
  )

  return canvas.toBuffer("image/png")
}

export default async function blur(req: Request, res: Response) {
  const image = req.query.image as string

  if (!image) {
    return res.status(400).json({
      status: false,
      message: "Parameter 'image' diperlukan"
    })
  }

  try {
    const buffer = await generateBlur(image)

    res.setHeader("Content-Type", "image/png")
    res.setHeader("Cache-Control", "public, max-age=3600")
    res.send(buffer)

  } catch (err: any) {
    res.status(500).json({
      status: false,
      message: err.message || "Gagal memproses gambar"
    })
  }
}