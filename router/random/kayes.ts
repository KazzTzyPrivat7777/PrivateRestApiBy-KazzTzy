import { Request, Response } from "express"
import fs from "fs"
import path from "path"

export default async function kayesHandler(req: Request, res: Response) {
  try {
    const filePath = path.join(__dirname, "kayes.json")
    const rawData = fs.readFileSync(filePath, "utf-8")
    const data: { url: string }[] = JSON.parse(rawData)

    if (!data.length) throw new Error("List gambar kosong")

    const randomItem = data[Math.floor(Math.random() * data.length)]
    const imageResponse = await fetch(randomItem.url)
    if (!imageResponse.ok) throw new Error("Gagal mengambil gambar")

    const arrayBuffer = await imageResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    res.set("Content-Type", "image/png")
    res.send(buffer)

  } catch (error: any) {
    console.error("Error Kayes", error)
    res.status(500).json({
      creator: "KayzzAoshi",
      status: false,
      message: error.message || "Internal Server Error"
    })
  }
}