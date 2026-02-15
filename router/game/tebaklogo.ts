import { Request, Response } from "express";
import axios from "axios";

export default async function tebakAppHandler(req: Request, res: Response) {
  try {
    const url =
      "https://raw.githubusercontent.com/orderku/db/main/dbbot/game/tebakapp.json";

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const data = response.data;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Data tebak app kosong",
      });
    }

    // Pilih random item
    const randomItem = data[Math.floor(Math.random() * data.length)];

    res.json({
      status: true,
      data: randomItem,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error Tebak App:", error.message);
    res.status(500).json({
      status: false,
      message: "Gagal mengambil data Tebak App",
    });
  }
}