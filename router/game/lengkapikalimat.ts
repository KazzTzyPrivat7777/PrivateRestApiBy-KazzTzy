import { Request, Response } from "express";

export default async function lengkapikalimatHandler(req: Request, res: Response) {
  try {
    const apiResponse = await fetch(
      "https://raw.githubusercontent.com/qisyana/scrape/main/lengkapikalimat.json"
    );

    if (!apiResponse.ok) throw new Error("Gagal mengambil data JSON");

    const data = await apiResponse.json();

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ message: "Data kosong" });
    }

    // Pilih random item dari array
    const randomItem = data[Math.floor(Math.random() * data.length)];

    // Kirim langsung JSON
    res.json(randomItem);

  } catch (error: any) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}