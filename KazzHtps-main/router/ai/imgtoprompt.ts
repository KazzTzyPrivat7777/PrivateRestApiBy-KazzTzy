import { Request, Response } from 'express'
import axios from 'axios'
import FormData from 'form-data'

export default async function imgToPromptHandler(req: Request, res: Response) {
  const imageUrl = req.query.url as string

  if (!imageUrl) {
    return res.status(400).json({
      creator: 'Hilman',
      status: false,
      message: "Parameter 'url' wajib diisi"
    })
  }

  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })
    const buffer = Buffer.from(response.data)

    const form = new FormData()
    form.append('file', buffer, 'img.jpg')

    const apiRes = await axios.post('https://be.neuralframes.com/clip_interrogate/', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': 'Bearer uvcKfXuj6Ygncs6tiSJ6VXLxoapJdjQ3EEsSIt45Zm+vsl8qcLAAOrnnGWYBccx4sbEaQtCr416jxvc/zJNAlcDjLYjfHfHzPpfJ00l05h0oy7twPKzZrO4xSB+YGrmCyb/zOduHh1l9ogFPg/3aeSsz+wZYL9nlXfXdvCqDIP9bLcQMHiUKB0UCGuew2oRt',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
        'Referer': 'https://www.neuralframes.com/tools/image-to-prompt'
      }
    })

    res.json({
      creator: 'KayzAoshi',
      status: true,
      prompt: apiRes.data?.caption || apiRes.data?.prompt || 'Tidak ada prompt ditemukan'
    })
  } catch (e: any) {
    res.status(500).json({
      creator: 'KayzzAoshi',
      status: false,
      message: e.message
    })
  }
}