import { Request, Response } from 'express'
import { URL } from 'url'

export default async function videyHandler(req: Request, res: Response) {
  try {
    const { url } = req.query

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        status: false,
        error: 'URL is required'
      })
    }

    const parsed = new URL(url)
    const id = parsed.searchParams.get('id')

    if (!id) {
      return res.status(400).json({
        status: false,
        error: 'Invalid Videy URL, missing id parameter'
      })
    }

    const videoUrl = `https://cdn.videy.co/${id}.mp4`

    res.status(200).json({
      status: true,
      result: {
        id,
        video: videoUrl
      }
    })

  } catch (error: any) {
    console.error('VIDEY ERROR:', error)
    res.status(500).json({
      status: false,
      error: error.message || 'Internal Server Error'
    })
  }
}