import { Request, Response } from "express";
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";

registerFont(path.join(__dirname, "Teuton.otf"), {
  family: "TeutonNormal"
});

const githubBaseUrl = "https://raw.githubusercontent.com/Raavfy-24/Maker/refs/heads/main";
const maxBackgrounds = 60;

export default async function fakeff(req: Request, res: Response) {
  const text = req.query.text as string;
  const bgNum = req.query.bg as string;

  if (!text) {
    return res.status(400).json({
      status: false,
      message: "Parameter 'text' diperlukan"
    });
  }

  const getBackgroundUrl = (index: number) =>
    `${githubBaseUrl}/FAKE%20FF%20SOLO/${index + 1}.png`;

  let index = 0;
  if (bgNum) {
    const n = parseInt(bgNum);
    if (!isNaN(n) && n >= 1 && n <= maxBackgrounds) {
      index = n - 1;
    } else if ((bgNum.toLowerCase() === "rand" || bgNum.toLowerCase() === "random")) {
      index = Math.floor(Math.random() * maxBackgrounds);
    } else {
      return res.status(400).json({
        status: false,
        message: `Nomor background tidak valid. Pilih 1 s/d ${maxBackgrounds}`
      });
    }
  }

  try {
    const bg = await loadImage(getBackgroundUrl(index));
    const canvas = createCanvas(bg.width, bg.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    // Text rendering (tetap sama seperti versi lama)
    ctx.font = `bold 50px "TeutonNormal"`;
    ctx.textAlign = "center";

    const x = 582;
    const y = canvas.height - 378;

    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    ctx.lineWidth = 1.8;
    ctx.strokeText(text, x, y);

    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, x, y);

    ctx.fillStyle = "#ffb300";
    ctx.fillText(text, x, y);

    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({
      status: false,
      message: err.message
    });
  }
}