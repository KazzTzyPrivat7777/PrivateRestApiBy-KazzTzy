import axios from 'axios'
import FormData from 'form-data'
import { Request, Response } from 'express'

export default async function upvidey(req: Request, res: Response) {
  const { url } = req.query

  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      status: false,
      message: 'Parameter url video diperlukan'
    })
  }

  try {
    const videoStream = await axios.get(url, { responseType: 'stream' })

    const form = new FormData()
    form.append('file', videoStream.data, {
      filename: 'video.mp4'
    })

    const upload = await axios.post('https://videy.co/api/upload', form, {
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'Mozilla/5.0'
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    })

    const result =
      upload.data?.url ||
      upload.data?.result ||
      upload.data?.link ||
      upload.data

    res.json({
      status: true,
      result
    })
  } catch (e: any) {
    res.status(500).json({
      status: false,
      message: e.message
    })
  }
}