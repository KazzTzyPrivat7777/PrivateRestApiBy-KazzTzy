import { Request, Response } from 'express'
import axios from "axios"
import { createCanvas, loadImage, registerFont } from "canvas"
import assets from "@putuofc/assetsku"

registerFont(assets.font.get("CUBESTMEDIUM"), { family: "CubestMedium" })

async function getImage(urlOrBuffer: string | Buffer): Promise<any> {
    if (Buffer.isBuffer(urlOrBuffer)) return await loadImage(urlOrBuffer)
    const response = await axios.get(urlOrBuffer, { responseType: 'arraybuffer' })
    return await loadImage(Buffer.from(response.data))
}

async function generateGoodbyeImage(
  username: string,
  guildName: string,
  memberCount: number,
  avatar: string,
  background: string,
): Promise<Buffer> {
  const canvas = createCanvas(512, 256)
  const ctx = canvas.getContext("2d")
  const fram = assets.image.get("GOODBYE2")

  const [backgroundImg, framImg, avatarImg] = await Promise.all([
    getImage(background),
    loadImage(fram),
    getImage(avatar),
  ])

  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height)
  ctx.drawImage(framImg, 0, 0, canvas.width, canvas.height)

  ctx.save()
  ctx.beginPath()
  ctx.rotate((-17 * Math.PI) / 180)
  ctx.strokeStyle = "white"
  ctx.lineWidth = 3
  ctx.drawImage(avatarImg, -4, 110, 96, 96)
  ctx.strokeRect(-4, 110, 96, 96)
  ctx.restore()

  const name = guildName.length > 10 ? guildName.substring(0, 10) + "..." : guildName
  ctx.globalAlpha = 1
  ctx.font = "18px CubestMedium"
  ctx.textAlign = "center"
  ctx.fillStyle = "#ffffff"
  ctx.fillText(name, 336, 158)

  ctx.font = "700 18px Courier New"
  ctx.textAlign = "left"
  ctx.fillStyle = "#ffffff"
  ctx.fillText(`${memberCount}th member`, 214, 248)

  const namalu = username.length > 12 ? username.substring(0, 15) + "..." : username
  ctx.font = "700 24px Courier New"
  ctx.fillText(namalu, 208, 212)

  return canvas.toBuffer("image/png")
}

export default async function goodbyeV2Handler(req: Request, res: Response) {
  try {
    const { username, guildName, memberCount, avatar, background } = req.query

    if (!username || !guildName || !memberCount || !avatar || !background) {
        return res.status(400).json({
            status: false,
            error: "Parameter username, guildName, memberCount, avatar, dan background wajib diisi."
        })
    }

    const mCount = parseInt(memberCount as string)

    const buffer = await generateGoodbyeImage(
        username as string,
        guildName as string,
        mCount,
        avatar as string,
        background as string
    )

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