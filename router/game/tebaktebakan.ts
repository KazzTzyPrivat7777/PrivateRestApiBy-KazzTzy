import { Request, Response } from "express";

export default async function tebaktebakanHandler(req: Request, res: Response) {
  try {
    // Ambil JSON dari GitHub
    const apiResponse = await fetch(
      "https://raw.githubusercontent.com/BochilTeam/database/master/games/tebaktebakan.json"
    );

    if (!apiResponse.ok) throw new Error("Gagal mengambil data JSON");

    const data = await apiResponse.json();

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ message: "Data tebaktebakan kosong" });
    }

    // Pilih satu item random dari array
    const randomItem = data[Math.floor(Math.random() * data.length)];

    // Kirim langsung JSON apa adanya
    res.json(randomItem);

  } catch (error: any) {
    console.error("Error TebakTebakan:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}