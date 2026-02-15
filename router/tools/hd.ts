import { Request, Response } from 'express'
import axios from 'axios'
import FormData from 'form-data'

async function enhanceFromURL(imageUrl: string, method: number) {
  const img = await axios.get(imageUrl, { responseType: 'arraybuffer' })

  const form = new FormData()
  form.append('method', method.toString())
  form.append('is_pro_version', 'false')
  form.append('is_enhancing_more', 'false')
  form.append('max_image_size', 'high')
  form.append('file', Buffer.from(img.data), 'image.jpg')

  const res = await axios.post('https://ihancer.com/api/enhance', form, {
    headers: {
      ...form.getHeaders(),
      'user-agent': 'Dart/3.5 (dart:io)'
    },
    responseType: 'arraybuffer'
  })

  return Buffer.from(res.data)
}

export default async function hdHandler(req: Request, res: Response) {
  const url = (req.query.url || req.body.url) as string
  const methodParam = (req.query.method || req.body.method) as string
  const method = methodParam ? Number(methodParam) : 3 // default method 3

  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      creator: 'KayzzAoshi',
      status: false,
      message: "Parameter 'url' gambar diperlukan"
    })
  }

  try {
    const result = await enhanceFromURL(url, method)
    res.setHeader('Content-Type', 'image/jpeg')
    res.send(result)
  } catch (e: any) {
    res.status(500).json({
      creator: 'KayzzAoshi',
      status: false,
      message: e.message
    })
  }
}