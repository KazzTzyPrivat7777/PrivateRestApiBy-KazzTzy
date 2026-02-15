import { Request, Response } from "express"
import axios from "axios"
import crypto from "crypto"

class SaveTube {
  private key = "C5D58EF67A7584E4A29F6C35BBC4EB12"
  private regex =
    /^((?:https?:)?\/\/)?((?:www|m|music)\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?([a-zA-Z0-9_-]{11})/

  private client = axios.create({
    headers: {
      "content-type": "application/json",
      origin: "https://yt.savetube.me",
      "user-agent": "Mozilla/5.0 (Android)",
    },
  })

  private async decrypt(enc: string) {
    const sr = Buffer.from(enc, "base64")
    const ky = Buffer.from(this.key, "hex")
    const iv = sr.slice(0, 16)
    const dt = sr.slice(16)

    const dc = crypto.createDecipheriv("aes-128-cbc", ky, iv)
    return JSON.parse(Buffer.concat([dc.update(dt), dc.final()]).toString())
  }

  private async getCdn(): Promise<string> {
    const r = await this.client.get(
      "https://media.savetube.vip/api/random-cdn"
    )
    return r.data.cdn
  }

  async download(url: string) {
    const id = url.match(this.regex)?.[3]
    if (!id) throw new Error("Invalid YouTube URL")

    const cdn = await this.getCdn()
    const info = await this.client.post(`https://${cdn}/v2/info`, {
      url: `https://www.youtube.com/watch?v=${id}`,
    })

    const dec = await this.decrypt(info.data.data)
    const dl = await this.client.post(`https://${cdn}/download`, {
      id,
      downloadType: "audio",
      quality: "128",
      key: dec.key,
    })

    return {
      title: dec.title,
      thumbnail:
        dec.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      duration: dec.duration,
      download: dl.data.data.downloadUrl,
      url: `https://www.youtube.com/watch?v=${id}`,
    }
  }
}

const st = new SaveTube()

export async function ytmp3(req: Request, res: Response) {
  try {
    const url = req.query.url as string
    if (!url) return res.status(400).json({ error: "url required" })

    const result = await st.download(url)
    res.json({ status: true, creator: "YourName", result })
  } catch (e: any) {
    res.status(500).json({ status: false, error: e.message })
  }
}