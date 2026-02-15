import { Request, Response } from "express"
import axios from "axios"

export default async function toBugil(req: Request, res: Response) {
  const image = (req.query.image as string)?.trim()

  if (!image) {
    res.status(400)
    res.setHeader("Content-Type", "text/plain")
    return res.send("Parameter 'image' wajib diisi")
  }

  try {
    // Panggil API Bagus
    const apiUrl = `https://api.baguss.xyz/api/edits/tobugil?image=${encodeURIComponent(image)}`
    const apiResponse = await axios.get(apiUrl)

    if (!apiResponse.data?.success || !apiResponse.data?.url) {
      throw new Error("API gagal mengembalikan image")
    }

    const imageUrl = apiResponse.data.url

    // Fetch image sebenarnya
    const imgResponse = await axios.get(imageUrl, { responseType: "arraybuffer" })

    // Kirim langsung sebagai image
    res.setHeader("Content-Type", "image/webp")
    res.send(Buffer.from(imgResponse.data, "binary"))

  } catch (err) {
    console.error(err)
    res.status(500)
    res.setHeader("Content-Type", "text/plain")
    res.send("Gagal membuat image toBugil")
  }
}


