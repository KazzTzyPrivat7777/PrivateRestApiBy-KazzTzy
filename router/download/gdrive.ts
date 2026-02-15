import { Request, Response } from "express";
import fetch from "node-fetch";

export default async function gdriveHandler(req: Request, res: Response) {
  try {
    const link = (req.query.url || req.body.url) as string;
    if (!link) {
      return res.status(400).json({
        creator: "KayzzAoshi",
        status: false,
        error: "Parameter 'url' diperlukan"
      });
    }

    const fileId = link.split('/d/')[1]?.split('/')[0];
    if (!fileId) {
      return res.status(400).json({
        creator: "KayzzAoshi",
        status: false,
        error: "Link Google Drive tidak valid"
      });
    }

    const apiUrl = `https://drive.usercontent.google.com/uc?id=${fileId}&export=download`;

    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Gagal download file dari Google Drive");

    const buffer = await response.arrayBuffer();

    res.json({
      creator: "KayzzAoshi",
      status: true,
      file: {
        mimeType: "video/mp4",
        size: buffer.byteLength,
        base64: Buffer.from(buffer).toString("base64")
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