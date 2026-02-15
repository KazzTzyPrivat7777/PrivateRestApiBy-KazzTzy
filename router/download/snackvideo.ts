import { Request, Response } from "express";
import axios from "axios";

export default async function snackvideoHandler(req: Request, res: Response) {
  try {
    const url = (req.query.url || req.body.url) as string;
    if (!url) {
      return res.status(400).json({
        creator: "KayzzAoshi",
        status: false,
        error: "Parameter 'url' diperlukan"
      });
    }

    const response = await axios.get(
      `https://api.siputzx.my.id/api/d/snackvideo?url=${encodeURIComponent(url)}`,
      { timeout: 20000 }
    );

    if (!response.data?.status || !response.data.data) {
      throw new Error("Gagal mendapatkan data dari API SnackVideo");
    }

    const data = response.data.data;

    res.json({
      creator: "KayzzAoshi",
      status: true,
      data: {
        title: data.title,
        creator: data.creator.name,
        uploadDate: data.uploadDate,
        likes: data.interaction.likes,
        views: data.interaction.views,
        shares: data.interaction.shares,
        videoUrl: data.videoUrl
      }
    });
  } catch (err: any) {
    res.status(500).json({
      creator: "KayzzAoshi",
      status: false,
      error: err.message || "Internal Server Error"
    });
  }
}