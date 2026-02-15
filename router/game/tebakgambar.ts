import { Request, Response } from "express";
import fs from "fs";
import path from "path";

interface TebakGambar {
  index: number;
  img: string;
  jawaban: string;
  deskripsi: string;
}

export default async function tebakgambarHandler(
  req: Request,
  res: Response
) {
  try {
    const filePath = path.join(__dirname, "tebakgambar.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const data: TebakGambar[] = JSON.parse(raw);

    if (!data.length) {
      return res.status(404).json({
        status: false,
        message: "Data tebak gambar kosong"
      });
    }

    // ambil random
    const random = data[Math.floor(Math.random() * data.length)];

    res.json({
      status: true,
      game: "tebakgambar",
      index: random.index,
      soal: {
        type: "image",
        url: random.img
      },
      jawaban: random.jawaban,
      deskripsi: random.deskripsi
    });
  } catch (err: any) {
    res.status(500).json({
      status: false,
      message: err.message
    });
  }
}