import { Request, Response } from 'express'
import axios from 'axios'
import FormData from 'form-data'
import https from 'https'
import crypto from 'crypto'

function generateSessionHash() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 11; i++) {
    const byte = crypto.randomBytes(1)[0]
    result += chars[byte % chars.length]
  }
  return result
}

function getStream(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, res => {
        let buffer = ''
        res.on('data', chunk => {
          buffer += chunk.toString()
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.replace('data: ', ''))
                if (
                  data.msg === 'process_completed' &&
                  data.output?.data?.[0]?.url
                ) {
                  resolve(data.output.data[0].url)
                }
              } catch {}
            }
          }
        })
        res.on('end', () => reject('Stream ended'))
      })
      .on('error', reject)
  })
}

async function uploadToCatbox(imageBuffer: Buffer) {
  const form = new FormData()
  form.append('reqtype', 'fileupload')
  form.append('userhash', '')
  form.append('fileToUpload', imageBuffer, {
    filename: 'image.jpg'
  })

  const { data } = await axios.post(
    'https://catbox.moe/user/api.php',
    form,
    { headers: form.getHeaders() }
  )

  return data as string
}

async function imageToSketch(imageUrl: string) {
  const sessionHash = generateSessionHash()

  const imageResponse = await axios.get(imageUrl, {
    responseType: 'arraybuffer'
  })

  const form = new FormData()
  form.append('files', Buffer.from(imageResponse.data), {
    filename: 'image.jpg',
    contentType: 'image/jpeg'
  })

  const uploadRes = await axios.post(
    'https://raec25-image-to-drawing-sketch.hf.space/gradio_api/upload?upload_id=qcu1l42hpn',
    form,
    { headers: form.getHeaders() }
  )

  const filePath = uploadRes.data[0]

  const payload = {
    data: [
      {
        path: filePath,
        url: `https://raec25-image-to-drawing-sketch.hf.space/gradio_api/file=${filePath}`,
        orig_name: 'image.jpg',
        size: imageResponse.data.length,
        mime_type: 'image/jpeg',
        meta: { _type: 'gradio.FileData' }
      },
      'Pencil Sketch'
    ],
    event_data: null,
    fn_index: 2,
    trigger_id: 13,
    session_hash: sessionHash
  }

  await axios.post(
    'https://raec25-image-to-drawing-sketch.hf.space/gradio_api/queue/join?__theme=system',
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  )

  const result = await getStream(
    `https://raec25-image-to-drawing-sketch.hf.space/gradio_api/queue/data?session_hash=${sessionHash}`
  )

  return result
}

export default async function img2sketch(req: Request, res: Response) {
  try {
    const imageUrl = req.query.url as string

    if (!imageUrl) {
      return res.status(400).json({
        creator: 'KayzzAoshi',
        status: false,
        error: 'Image URL is required'
      })
    }

    const catboxUrl = await imageToSketch(imageUrl)

    res.json({
      creator: 'KayzzAoshi',
      status: true,
      result: catboxUrl
    })
  } catch (err: any) {
    res.status(500).json({
      creator: 'KayzzAoshi',
      status: false,
      error: err.message
    })
  }
}