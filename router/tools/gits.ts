import { Request, Response } from 'express'
import axios from 'axios'

function extractId(url: string): string | null {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean)
    return parts.pop() || null
  } catch {
    return null
  }
}

export default async function gitsHandler(req: Request, res: Response) {
  try {
    const { url, type } = req.query

    if (!url || typeof url !== 'string' || !url.includes('github')) {
      return res.status(400).json({
        status: false,
        error: 'GitHub Gist URL is required'
      })
    }

    const id = extractId(url)
    if (!id) {
      return res.status(400).json({
        status: false,
        error: 'Invalid Gist URL'
      })
    }

    const { data } = await axios.get(`https://api.github.com/gists/${id}`)
    const files = Object.values<any>(data?.files || {})

    if (!files.length) {
      return res.status(404).json({
        status: false,
        error: 'No files found in gist'
      })
    }

    res.status(200).json({
      status: true,
      mode: type === 'doc' ? 'document' : 'text',
      result: files.map(file => ({
        filename: file.filename,
        language: file.language,
        type: file.type,
        size: file.size,
        content: file.content
      }))
    })

  } catch (error: any) {
    console.error('GITS ERROR:', error)
    res.status(500).json({
      status: false,
      error: error.message || 'Internal Server Error'
    })
  }
}
