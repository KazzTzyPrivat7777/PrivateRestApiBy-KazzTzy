import { Request, Response } from "express"
import { createCanvas, loadImage, registerFont } from "canvas"
import path from "path"
import moment from "moment-timezone"

// Register font Poppins-Bold
registerFont(path.join(__dirname, "Poppins-Bold.ttf"), { family: "Poppins" })

export default async function fakenotifdana(req: Request, res: Response) {
  const nama = (req.query.nama as string)?.trim()
  const jumlahStr = (req.query.jumlah as string)?.trim()

  if (!nama || !jumlahStr) {
    return res.status(400).json({
      status: false,
      message: "Parameter 'nama' dan 'jumlah' diperlukan"
    })
  }

  const jumlah = Number(jumlahStr)
  if (isNaN(jumlah)) {
    return res.status(400).json({
      status: false,
      message: "'jumlah' harus berupa angka"
    })
  }

  try {
    const waktu = moment().tz("Asia/Jakarta").format("HH:mm")
    const tanggal = moment().tz("Asia/Jakarta").format("DD-MM-YYYY")
    const hari = moment().tz("Asia/Jakarta").locale("id").format("dddd")

    const canvas = createCanvas(720, 1520)
    const ctx = canvas.getContext("2d")

    const background = await loadImage("https://cloudkuimages.guru/uploads/images/6852ed19dd705.jpg")
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 50px Poppins"
    ctx.fillText(waktu, 60, 615)

    ctx.font = "26px Poppins"
    ctx.fillText(`${hari}, ${tanggal.split('-').join(' • ')}`, 58, 660)

    ctx.font = "23px Poppins"
    ctx.fillText(`Rp${jumlah.toLocaleString('id-ID')} telah diterima dari ${nama}`, 105, 820)

    const buffer = canvas.toBuffer("image/png")
    res.setHeader("Content-Type", "image/png")
    res.send(buffer)

  } catch (err: any) {
    res.status(500).json({
      status: false,
      message: err.message || "Gagal membuat notifikasi DANA palsu"
    })
  }
}

