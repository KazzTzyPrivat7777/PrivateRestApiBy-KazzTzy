import { Request, Response } from "express";
import axios from "axios";

export default async function tebakJktHandler(req: Request, res: Response) {
  try {
    const url =
      "https://raw.githubusercontent.com/siputzx/tebak-jkt/refs/heads/main/tebak.json";

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const data = response.data;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ message: "Data tebak-jkt kosong" });
    }

    // Ambil satu item random
    const randomItem = data[Math.floor(Math.random() * data.length)];

    // Kirim langsung JSON apa adanya
    res.json(randomItem);

  } catch (error: any) {
    console.error("Error Tebak JKT:", error.message);
    res.status(500).json({ message: "Gagal mengambil data tebak-jkt" });
  }
}