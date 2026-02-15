import { Request, Response } from 'express'
import axios from "axios"
import * as Canvas from "canvas"
import assets from "@putuofc/assetsku"

class Gay {
  private bg: Buffer
  private fm: Buffer
  private pp: string | Buffer
  private nama: string
  private num: string

  constructor() {
    this.bg = assets.image.get("BGAY")
    this.fm = assets.image.get("GYF")
    this.pp = "https://files.catbox.moe/g45kly.jpg"
    this.nama = "Kayzz"
    this.num = "87"
  }

  setName(value: string) {
    this.nama = value
    return this
  }

  setAvatar(value: string | Buffer) {
    this.pp = value
    return this
  }

  setNum(value: string) {
    this.num = value
    return this
  }

  async toAttachment(): Promise<Canvas.Canvas> {
    let pp: Canvas.Image

    if (Buffer.isBuffer(this.pp)) {
      pp = await Canvas.loadImage(this.pp)
    } else {
      const response = await axios.get(this.pp as string, { responseType: "arraybuffer" })
      const buffer = Buffer.from(response.data)
      pp = await Canvas.loadImage(buffer)
    }

    const canvas = Canvas.createCanvas(600, 450)
    const ctx = canvas.getContext("2d")

    let iyga = await Canvas.loadImage(this.bg)
    ctx.drawImage(iyga, 0, 0, 600, 450)

    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = "white"
    ctx.lineWidth = 3
    ctx.arc(300, 160, 100, 0, Math.PI * 2, true)
    ctx.stroke()
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(pp, 200, 60, 200, 200)
    let frame = await Canvas.loadImage(this.fm)
    ctx.drawImage(frame, 200, 60, 200, 200)
    ctx.strokeRect(200, 60, 200, 200)
    ctx.restore()

    let usr = this.nama
    let name = usr.length > 16 ? usr.substring(0, 16) + " " : usr
    ctx.font = "30px Arial"
    ctx.textAlign = "center"
    ctx.fillStyle = "#ffffff"
    ctx.fillText(`~${name}~`, 300, 300)

    ctx.font = "bold 48px Arial"
    ctx.textAlign = "center"
    ctx.fillStyle = "#ff4b74"
    ctx.fillText(`~ ${this.num} ~`, 300, 370)

    return canvas
  }
}

export default async function gayHandler(req: Request, res: Response) {
  try {
    const name = (req.query.name || req.body.name) as string
    const avatar = (req.query.avatar || req.body.avatar) as string
    const num = (req.query.num || req.body.num) as string

    if (!name || !avatar || !num) {
      return res.status(400).json({
        status: false,
        error: "Parameter 'name', 'avatar', dan 'num' diperlukan."
      })
    }

    const gayInstance = new Gay()
    const canvas = await gayInstance
      .setName(name)
      .setAvatar(avatar)
      .setNum(num)
      .toAttachment()

    const buffer = canvas.toBuffer("image/png")

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