import { Request, Response } from "express"
import axios from "axios"

async function saveweb2zip(url: string) {
  if (!url) throw new Error("URL is required")
  const targetUrl = url.startsWith("http") ? url : `https://${url}`
  
  const headers = {
    "accept": "*/*",
    "content-type": "application/json",
    "origin": "https://saveweb2zip.com",
    "referer": "https://saveweb2zip.com/",
    "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
  }

  try {
    const { data } = await axios.post(
      "https://copier.saveweb2zip.com/api/copySite",
      { 
        url: targetUrl, 
        renameAssets: true, 
        saveStructure: false, 
        alternativeAlgorithm: false, 
        mobileVersion: false 
      },
      { headers }
    )

    if (!data || !data.md5) {
      throw new Error("Gagal memulai proses copying. MD5 tidak ditemukan.")
    }

    while (true) {
      const { data: process } = await axios.get(
        `https://copier.saveweb2zip.com/api/getStatus/${data.md5}`,
        { headers }
      )
      
      if (process.isFinished) {
        if (process.errorText) {
          throw new Error(`Web2Zip Error: ${process.errorText}`)
        }
        
        return {
          targetUrl,
          copiedFilesAmount: process.copiedFilesAmount,
          downloadUrl: `https://copier.saveweb2zip.com/api/downloadArchive/${process.md5}`,
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        continue
      }
    }
  } catch (error) {
    throw error
  }
}

export default async function web2zipHandler(req: Request, res: Response) {
  const url = (req.query.url || req.body.url) as string

  if (!url) {
    return res.status(400).json({
      status: false,
      message: "Parameter 'url' diperlukan."
    })
  }

  try {
    const result = await saveweb2zip(url)

    res.json({
      status: true,
      result
    })
  } catch (error: any) {
    res.status(500).json({
      status: false,
      message: error.message || "Terjadi kesalahan pada server."
    })
  }
}