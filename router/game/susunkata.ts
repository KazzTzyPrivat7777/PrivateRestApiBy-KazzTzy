import { Request, Response } from "express";
import fs from "fs";
import path from "path";

export default async function susunkataHandler(req: Request, res: Response) {
  try {
    const jsonPath = path.join(__dirname, "susunkata.json");
    const raw = fs.readFileSync(jsonPath, "utf-8");
    const data = JSON.parse(raw);

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Data susunkata kosong"
      });
    }

    const randomItem = data[Math.floor(Math.random() * data.length)];

    res.json({
      status: true,
      soal: randomItem.soal,
      jawaban: randomItem.jawaban
    });
  } catch (err: any) {
    res.status(500).json({
      status: false,
      message: err.message
    });
  }
}