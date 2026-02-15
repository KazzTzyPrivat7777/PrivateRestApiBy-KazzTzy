import { Request, Response } from 'express'
import axios from 'axios'
import FormData from 'form-data'

export default async function wasted(req: Request, res: Response) {
  try {
    const imageUrl = req.query.url as string

    // optional options
    const bannerTopPercent = req.query.top
      ? Number(req.query.top)
      : 50
    const bannerWidthPercent = req.query.width
      ? Number(req.query.width)
      : 80
    const isPublic = req.query.public === 'true'

    if (!imageUrl) {
      return res.status(400).json({
        creator: 'KayzzAoshi',
        status: false,
        error: 'Image URL is required'
      })
    }

    // ambil gambar dari URL
    const img = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    })

    const form = new FormData()
    form.append('image', img.data, {
      filename: 'image.jpg',
      contentType: img.headers['content-type'] || 'image/jpeg'
    })
    form.append('bannerTopPercent', String(bannerTopPercent))
    form.append('bannerWidthPercent', String(bannerWidthPercent))
    form.append('isPublic', String(isPublic))

    const response = await axios.post(
      'https://wastedgenerator.com/generate',
      form,
      {
        headers: {
          ...form.getHeaders(),
          origin: 'https://wastedgenerator.com',
          referer: 'https://wastedgenerator.com/',
          'user-agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107 Safari/537.36'
        },
        timeout: 60000
      }
    )

    if (!response.data?.success) {
      return res.status(500).json({
        creator: 'KayzzAoshi',
        status: false,
        error: 'Failed to generate wasted image'
      })
    }

    const resultUrl =
      'https://wastedgenerator.com' + response.data.filePath

    // redirect ke hasil (atau bisa res.json)
    res.json({
      creator: 'KayzzAoshi',
      status: true,
      result: resultUrl
    })

  } catch (err: any) {
    res.status(500).json({
      creator: 'KayzzAoshi',
      status: false,
      error: err.message
    })
  }
}