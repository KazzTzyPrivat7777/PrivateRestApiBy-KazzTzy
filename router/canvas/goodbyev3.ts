import { Request, Response } from 'express'
import axios from "axios"
import { createCanvas, loadImage } from "canvas"
import assets from "@putuofc/assetsku"

async function generateGoodbyeV3(username: string, avatarURL: string): Promise<Buffer> {
  const canvas = createCanvas(650, 300)
  const ctx = canvas.getContext("2d")

  const bg = assets.image.get("GOODBYE3")
  
  // Fetch avatar dan load background secara paralel
  const [background, avatarResponse] = await Promise.all([
    loadImage(bg),
    axios.get(avatarURL, { responseType: "arraybuffer" })
  ])
  
  const avatarImg = await loadImage(Buffer.from(avatarResponse.data))

  // Gambar background
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height)

  const name = username.length > 10 ? username.substring(0, 10) + "..." : username
  
  // Gambar teks nama (hitam - tengah)
  ctx.font = "700 30px Courier New"
  ctx.textAlign = "center"
  ctx.fillStyle = "#000000"
  ctx.fillText(name, 325, 273)

  // Gambar avatar bulat dengan stroke putih
  ctx.save()
  ctx.beginPath()
  ctx.lineWidth = 6
  ctx.strokeStyle = "white"
  ctx.arc(325, 150, 75, 0, Math.PI * 2, true)
  ctx.stroke()
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(avatarImg, 250, 75, 150, 150)
  ctx.restore()

  return canvas.toBuffer("image/png")
}

export default async function goodbyeV3Handler(req: Request, res: Response) {
  try {
    const { username, avatar } = req.query

    if (!username || !avatar) {
      return res.status(400).json({
        status: false,
        error: "Parameter 'username' dan 'avatar' wajib diisi."
      })
    }

    const buffer = await generateGoodbyeV3(username as string, avatar as string)

    res.set({
      "Content-Type": "image/png",
      "Content-Length": buffer.length,
      "Cache-Control": "public, max-age=3600"
    })

    res.send(buffer)
  } catch (err: any) {
    res.status(500).json({
      status: false,
      error: err.message || "Internal Server Error"
    })
  }
}