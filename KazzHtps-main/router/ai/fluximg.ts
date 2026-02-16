import { Request, Response } from "express"
import axios from "axios"

export default async function fluxImageHandler(req: Request, res: Response) {
  const prompt = (req.query.prompt as string)?.trim()
  const seed = req.query.seed || Math.floor(Math.random() * 1000000)

  if (!prompt) {
    res.status(400)
    res.setHeader("Content-Type", "text/plain")
    return res.send("Parameter 'prompt' wajib diisi")
  }

  try {
    const endpoint = "https://nologintoo.abdelatifana0.workers.dev/"
    const imageUrl = `${endpoint}?target=pollinations&prompt=${encodeURIComponent(prompt)}&model=flux&width=512&height=512&seed=${seed}`

    const response = await axios.get(imageUrl, { responseType: "arraybuffer" })

    res.setHeader("Content-Type", "image/jpeg")
    res.send(Buffer.from(response.data, "binary"))

  } catch (err: any) {
    console.error(err)
    res.status(500)
    res.setHeader("Content-Type", "text/plain")
    res.send("Gagal generate gambar: " + err.message)
  }
}