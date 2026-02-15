import { Request, Response } from 'express'
import fetch from 'node-fetch'
import FormData from 'form-data'

const CONFIG = {
  baseUrl: 'https://app.live3d.io/aitools',
  resultUrl: 'https://temp.live3d.io',
  origin: 'https://live3d.io',
  originFrom: '5b3e78451640893a',
  fnName: 'demo-change-hair',
  requestFrom: 9
}

function generateHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'fp': '20cebea9c9d06e3b020503f67762edf3',
    'fp1': 'VYuryLPUfU5QZLF53k96BkHdB7IYyJ8VXkNwwNHDooU+n3SlBumb/UiX+PyrVRJv',
    'x-code': Date.now().toString(),
    'x-guide': 'PFu2MqGSK5Wgg3jFZ9VX/LCzTI03jSf6rvUSw8ydSHolxrgCsQrbpZtyycWD/+c4ttuBDSKIYhxAPt4zhxZ4qqyEwjwk6oXmK9Nc04LlwAar9K5Hw2f781SnnuKT/CU0l5PfwaeIIqxXCn3OxyJHKLpPNp6OdkBH952BZ40GETY=',
    'theme-version': '83EmcUoQTUv50LhNx0VrdcK8rcGexcP35FcZDcpgWsAXEyO4xqL5shCY6sFIWB2Q',
    'origin': CONFIG.origin,
    'referer': `${CONFIG.origin}/`
  }
}

async function uploadImageFromURL(imageUrl: string) {
  const response = await fetch(imageUrl)
  const buffer = await response.arrayBuffer()

  const form = new FormData()
  form.append('file', Buffer.from(buffer), {
    filename: 'image.jpg',
    contentType: 'image/jpeg'
  })
  form.append('fn_name', CONFIG.fnName)
  form.append('request_from', String(CONFIG.requestFrom))
  form.append('origin_from', CONFIG.originFrom)

  const res = await fetch(`${CONFIG.baseUrl}/upload-img`, {
    method: 'POST',
    headers: {
      ...generateHeaders(),
      ...form.getHeaders()
    },
    body: form
  })

  return await res.json()
}

async function createTask(imagePath: string, prompt: string) {
  const res = await fetch(`${CONFIG.baseUrl}/of/create`, {
    method: 'POST',
    headers: {
      ...generateHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fn_name: CONFIG.fnName,
      call_type: 3,
      input: {
        prompt,
        source_image: imagePath,
        request_from: CONFIG.requestFrom
      },
      request_from: CONFIG.requestFrom,
      origin_from: CONFIG.originFrom
    })
  })

  return await res.json()
}

async function checkStatus(taskId: string) {
  const res = await fetch(`${CONFIG.baseUrl}/of/check-status`, {
    method: 'POST',
    headers: {
      ...generateHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      task_id: taskId,
      fn_name: CONFIG.fnName,
      call_type: 3,
      request_from: CONFIG.requestFrom,
      origin_from: CONFIG.originFrom
    })
  })

  return await res.json()
}

async function waitForResult(taskId: string, max = 60) {
  for (let i = 0; i < max; i++) {
    const res = await checkStatus(taskId)
    if (res.code === 200 && res.data?.status === 2 && res.data?.result_image) {
      return res.data.result_image
    }
    if (res.data?.status === -1) throw new Error('Processing failed')
    await new Promise(r => setTimeout(r, 2000))
  }
  throw new Error('Timeout')
}

export default async function hairstyleHandler(req: Request, res: Response) {
  const imageUrl = (req.query.url || req.body.url) as string
  const prompt = (req.query.prompt || req.body.prompt) as string

  if (!imageUrl || !prompt) {
    return res.status(400).json({
      creator: 'KayzzAoshi',
      status: false,
      message: "Parameter 'url' dan 'prompt' wajib diisi"
    })
  }

  try {
    const uploaded = await uploadImageFromURL(imageUrl)
    if (uploaded.code !== 200) throw new Error('Upload gagal')

    const task = await createTask(uploaded.data.path, prompt)
    if (task.code !== 200) throw new Error('Task gagal')

    const resultPath = await waitForResult(task.data.task_id)
    const resultUrl = `https://temp.live3d.io/${resultPath}`

    // Redirect langsung ke URL gambar hasil
    res.redirect(resultUrl)
  } catch (e: any) {
    res.status(500).json({
      creator: 'KayzzAoshi',
      status: false,
      message: e.message
    })
  }
}