import { Request, Response } from 'express'

const fetchFn = (...args: any[]) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args))

// helper pick field tertentu
function pick<T>(obj: T, keys: (keyof T)[]) {
  const out: any = {}
  for (const k of keys) out[k] = (obj as any)[k]
  return out
}

export default async function xnxxHandler(req: Request, res: Response) {
  const url = (req.query.url || req.body.url) as string

  if (!url) {
    return res.status(400).json({
      status: false,
      message: "Parameter 'url' diperlukan. Contoh: /api/downloader/xnxx?url=<video_url>"
    })
  }

  try {
    // 1️⃣ Ambil data dari API Deline
    const apiRes = await fetchFn(
      `https://api.deline.web.id/downloader/xnxx?url=${encodeURIComponent(url)}`,
      {
        headers: {
          'user-agent': 'Mozilla/5.0',
          accept: 'application/json'
        }
      }
    ).then(r => r.json())

    if (!apiRes?.status || !apiRes?.result) {
      throw new Error(apiRes?.message || 'Gagal mengambil data dari API')
    }

    const r = apiRes.result

    // 2️⃣ Bersihin branding / jejak Agas → rename sesuai server kita
    const result = {
      title: r.title,
      url: r.URL,
      duration: Number(r.duration),
      thumbnail: r.image,
      author: r.info?.split('\n')[0] || null,
      info: r.info,
      files: r.files
    }

    return res.json({
      status: true,
      creator: 'KayzzAoshi', // ganti sesuai branding kamu
      result
    })
  } catch (err: any) {
    return res.status(500).json({
      status: false,
      message: err.message || 'Internal Server Error'
    })
  }
}

