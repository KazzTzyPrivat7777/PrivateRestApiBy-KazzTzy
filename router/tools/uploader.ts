import { Request, Response } from "express";
import axios from "axios";
import FormData from "form-data";
import path from "path";

const KEY = "AIzaBj7z2z3xBjsk";
const DOMAIN = "https://c.termai.cc";

async function uploadToTermai(fileBuffer: Buffer, fileName: string, mimetype: string) {
  const fd = new FormData();
  fd.append('file', fileBuffer, { 
    filename: fileName, 
    contentType: mimetype 
  });

  const { data } = await axios.post(`${DOMAIN}/api/upload?key=${KEY}`, fd, {
    headers: {
        ...fd.getHeaders(),
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    },
    timeout: 60000
  });

  if (!data || !data.status) {
    throw new Error(data?.error || "Upload ke Termai gagal");
  }

  return data.path; // Mengembalikan URL hasil upload
}

export default async function tourlHandler(req: Request, res: Response) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ 
        status: false, 
        message: "Parameter 'url' (link media) diperlukan." 
      });
    }

    // 1. Download media dari URL yang diberikan
    const response = await axios.get(url as string, { 
        responseType: 'arraybuffer',
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    
    const buffer = Buffer.from(response.data);
    const mime = response.headers['content-type'] || 'application/octet-stream';
    
    // 2. Tentukan nama file dan ekstensi
    const ext = path.extname(url as string) || `.${mime.split('/')[1]}` || ".bin";
    const fileName = `${Date.now()}${ext}`;

    // 3. Upload ke Termai
    const resultUrl = await uploadToTermai(buffer, fileName, mime);

    res.status(200).json({
      status: true,
      original_url: url,
      result_url: resultUrl
    });

  } catch (error: any) {
    res.status(500).json({ 
      status: false, 
      message: error.message || "Gagal memproses upload"
    });
  }
}