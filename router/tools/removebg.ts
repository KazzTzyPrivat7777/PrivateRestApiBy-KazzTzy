import { Request, Response } from 'express'
import axios from 'axios'
import FormData from 'form-data'

export default async function removebg(req: Request, res: Response) {
  try {
    const imageUrl = req.query.url as string

    if (!imageUrl) {
      return res.status(400).json({
        creator: 'KayzzAoshi',
        status: false,
        error: 'Image URL is required'
      })
    }

    // ambil gambar dari URL
    const img = await axios.get(imageUrl, { responseType: 'arraybuffer' })

    const form = new FormData()
    form.append('image', img.data, {
      filename: 'image.png',
      contentType: img.headers['content-type'] || 'image/png'
    })
    form.append('format', 'png')
    form.append('model', 'v1')

    const response = await axios.post(
      'https://api2.pixelcut.app/image/matte/v1',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'x-client-version': 'web',
          'x-locale': 'en'
        },
        responseType: 'arraybuffer'
      }
    )

    res.set('Content-Type', 'image/png')
    res.send(response.data)

  } catch (err: any) {
    res.status(500).json({
      creator: 'KayzzAoshi',
      status: false,
      error: err.message
    })
  }
}