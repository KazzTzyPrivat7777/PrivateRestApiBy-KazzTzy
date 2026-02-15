import { Request, Response } from "express";
import axios from "axios";

export default async function twitterHandler(req: Request, res: Response) {
  try {
    const url = (req.query.url || req.body.url) as string;
    if (!url) {
      return res.status(400).json({
        creator: "KayzzAoshi",
        status: false,
        error: "Parameter 'url' diperlukan"
      });
    }

    // Ambil data dari API
    const apiRes = await axios.get(`https://api.siputzx.my.id/api/d/twitter?url=${encodeURIComponent(url)}`, {
      timeout: 20000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const body = apiRes.data;
    if (!body?.status || !body?.data) {
      throw new Error(body?.message || "API mengembalikan respons tidak valid");
    }

    const downloadLink = body.data.downloadLink || body.data.download || body.data.url;
    if (!downloadLink) throw new Error("Download link tidak ditemukan di respons API");

    // Jika ingin return URL saja (lebih ringan)
    res.json({
      creator: "KayzzAoshi",
      status: true,
      video: {
        title: body.data.videoTitle || "",
        description: body.data.videoDescription || "",
        url: downloadLink
      }
    });

    // --- Kalau mau langsung return base64 video, uncomment ini ---
    /*
    const videoRes = await axios.get(downloadLink, { responseType: "arraybuffer", timeout: 60000, maxContentLength: 100 * 1024 * 1024 });
    res.json({
      creator: "KayzzAoshi",
      status: true,
      video: {
        title: body.data.videoTitle || "",
        description: body.data.videoDescription || "",
        mimeType: "video/mp4",
        size: videoRes.data.byteLength,
        base64: Buffer.from(videoRes.data).toString("base64")
      }
    });
    */

  } catch (err: any) {
    res.status(500).json({
      creator: "KayzzAoshi",
      status: false,
      error: err.message || "Internal Server Error"
    });
  }
}