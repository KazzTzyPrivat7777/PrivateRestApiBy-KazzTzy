import { Request, Response } from "express"
import axios from "axios"
import sharp from "sharp"

export default async function robloxtopHandler(req: Request, res: Response) {
  try {
    /* =========================
       AMBIL LIST GAME ROBLOX
    ========================= */
    const api = new URL("https://apis.roblox.com/explore-api/v1/get-sort-content")
    api.search = new URLSearchParams({
      sessionId: "17996246-1290-440d-b789-d49484115b9a",
      sortId: "top-playing-now",
      cpuCores: "8",
      maxResolution: "1920x1080",
      maxMemory: "8192",
      networkType: "4g"
    })

    const { data } = await axios.get(api.toString())
    const games = data?.games?.slice(0, 10)

    if (!games || games.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Game Roblox tidak ditemukan"
      })
    }

    /* =========================
       AMBIL THUMBNAIL
    ========================= */
    const payload = games.map((v: any) => ({
      type: "GameIcon",
      targetId: v.universeId,
      format: "webp",
      size: "256x256"
    }))

    const thumbRes = await axios.post(
      "https://thumbnails.roblox.com/v1/batch",
      payload,
      { headers: { "Content-Type": "application/json" } }
    )

    const list = games.map((v: any, i: number) => ({
      ...v,
      imageUrl: thumbRes.data?.data?.[i]?.imageUrl
    })).filter(v => v.imageUrl)

    /* =========================
       DOWNLOAD IMAGE
    ========================= */
    const images = await Promise.all(
      list.map(async (v: any) => {
        const img = await axios.get(v.imageUrl, { responseType: "arraybuffer" })
        return sharp(img.data).resize(256, 256).toBuffer()
      })
    )

    /* =========================
       GABUNG JADI 1 IMAGE
    ========================= */
    const cols = 5
    const gap = 10
    const size = 256
    const rows = Math.ceil(images.length / cols)

    const canvas = sharp({
      create: {
        width: cols * (size + gap) - gap,
        height: rows * (size + gap) - gap,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })

    const composite = images.map((img, i) => ({
      input: img,
      left: (i % cols) * (size + gap),
      top: Math.floor(i / cols) * (size + gap)
    }))

    const output = await canvas
      .composite(composite)
      .png()
      .toBuffer()

    /* =========================
       CAPTION
    ========================= */
    const mapNum = (x: string) => {
      const c = ['𝟢','𝟣','𝟤','𝟥','𝟦','𝟧','𝟨','𝟩','𝟪','𝟫']
      return x.split("").map(v => isNaN(Number(v)) ? v : c[Number(v)]).join("")
    }

    const caption =
      "Top 10 Playing Now on Roblox\n\n" +
      list.map((v: any, i: number) =>
        `${i + 1}. ${v.name}
👥 ${mapNum(v.playerCount.toLocaleString("id-ID"))}
👍 ${mapNum(
          (v.totalUpVotes / (v.totalUpVotes + v.totalDownVotes) * 100).toFixed()
        )}%
🎮 https://www.roblox.com/games/${v.rootPlaceId}`
      ).join("\n\n")

    /* =========================
       RESPONSE
    ========================= */
    res.setHeader("Content-Type", "image/png")
    res.setHeader("X-Caption", encodeURIComponent(caption))
    res.send(output)

  } catch (error: any) {
    res.status(500).json({
      status: false,
      message: "Gagal mengambil data Roblox",
      error: error.message
    })
  }
}