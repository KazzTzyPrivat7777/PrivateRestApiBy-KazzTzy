import { Request, Response } from "express";
import fetch from "node-fetch";

export default async function mpls2Handler(req: Request, res: Response) {
  const imageUrl = req.query.image as string;

  if (!imageUrl) {
    return res.status(400).json({
      status: false,
      message: "Parameter 'image' diperlukan"
    });
  }

  try {
    const apiUrl = `https://api.baguss.xyz/api/edits/tompls?image=${encodeURIComponent(imageUrl)}`;
    const response = await fetch(apiUrl);

    if (!response.ok) throw new Error("Gagal memproses image");

    const buffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "image/png");
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    res.status(500).json({
      status: false,
      message: err.message
    });
  }
}

