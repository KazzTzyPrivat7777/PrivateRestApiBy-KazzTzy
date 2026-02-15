import { createCanvas, loadImage, registerFont } from "canvas"
import axios from "axios"
import path from "path"

registerFont(path.join(__dirname, "Poppins-Bold.ttf"), { family: "Poppins" })

export default async function cprofile(req: any, res: any) {
  const url1 = req.query.url1 as string
  const url2 = req.query.url2 as string
  const nama = (req.query.nama as string) || "✅"

  if (!url1 || !url2) {
    return res.status(400).json({
      status: false,
      message: "Parameter 'url1' dan 'url2' diperlukan"
    })
  }

  try {
    const [img1Buffer, img2Buffer] = await Promise.all([
      axios.get(url1, { responseType: "arraybuffer" }).then(r => r.data),
      axios.get(url2, { responseType: "arraybuffer" }).then(r => r.data)
    ])

    const [img1, img2] = await Promise.all([
      loadImage(img1Buffer),
      loadImage(img2Buffer)
    ])

    const canvas = createCanvas(1080, 1080)
    const ctx = canvas.getContext("2d")

    // Background blur
    ctx.drawImage(img1, 0, 0, canvas.width, canvas.height)
    ctx.globalAlpha = 0.6
    ctx.drawImage(img1, 0, 0, canvas.width, canvas.height)
    ctx.globalAlpha = 1

    // Kotak dari img1
    const kotakW = 883, kotakH = 357
    ctx.drawImage(img1, 0, 0, kotakW, kotakH, 95, 245, kotakW, kotakH)
    ctx.strokeStyle = "white"
    ctx.lineWidth = 4
    ctx.strokeRect(95, 245, kotakW, kotakH)

    // Bulat dari img2
    const sizeBulat = 254
    const bulatX = 95, bulatY = 545
    ctx.save()
    ctx.beginPath()
    ctx.arc(bulatX + sizeBulat/2, bulatY + sizeBulat/2, sizeBulat/2, 0, Math.PI*2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(img2, bulatX, bulatY, sizeBulat, sizeBulat)
    ctx.restore()
    ctx.strokeStyle = "white"
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(bulatX + sizeBulat/2, bulatY + sizeBulat/2, sizeBulat/2 - 2, 0, Math.PI*2)
    ctx.stroke()

    // Teks nama
    ctx.fillStyle = "white"
    ctx.globalAlpha = 0.65
    ctx.font = "bold 40px Poppins"
    ctx.textAlign = "right"
    ctx.fillText(nama.toUpperCase(), 950, 660)

    const buffer = canvas.toBuffer("image/png")
    res.setHeader("Content-Type", "image/png")
    res.send(buffer)

  } catch (err: any) {
    res.status(500).json({ status: false, message: err.message || "Gagal membuat CProfile" })
  }
}