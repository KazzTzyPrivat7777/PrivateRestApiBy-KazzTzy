import { Request, Response } from "express";
import axios from "axios";

async function capcut(url: string) {
  const { data } = await axios.post(
    "https://3bic.com/api/download",
    { url },
    {
      headers: {
        "content-type": "application/json",
        origin: "https://3bic.com",
        referer: "https://3bic.com/",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, seperti Gecko) Chrome/133.0.0.0 Mobile Safari/537.36",
      },
    }
  );

  if (!data.originalVideoUrl) throw new Error("Video tidak ditemukan");
  data.originalVideoUrl = "https://3bic.com" + data.originalVideoUrl;
  return data;
}

export default async function capcutHandler(req: Request, res: Response) {
  try {
    const { url } = req.query as { url: string };
    if (!url) return res.status(400).json({ status: false, message: "url wajib diisi" });

    const result = await capcut(url);

    res.json({
      status: true,
      result: {
        title: result.title || "Tanpa judul",
        videoUrl: result.originalVideoUrl,
        ...result,
      },
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
}

