import { Request, Response } from "express";
import fs from "fs";
import path from "path";

interface TebakBendera {
  soal: string;
  jawaban: string;
}

export default async function tebakbenderaHandler(
  req: Request,
  res: Response
) {
  try {
    const jsonPath = path.join(__dirname, "tebakbendera.json");
    const raw = fs.readFileSync(jsonPath, "utf-8");
    const data: TebakBendera[] = JSON.parse(raw);

    if (!data.length) {
      return res.status(404).json({
        status: false,
        message: "Data tebak bendera kosong"
      });
    }

    const random = data[Math.floor(Math.random() * data.length)];

    res.json({
      status: true,
      game: "tebakbendera",
      soal: {
        type: "image",
        url: random.soal
      },
      jawaban: random.jawaban
    });
  } catch (err: any) {
    res.status(500).json({
      status: false,
      message: err.message
    });
  }
}