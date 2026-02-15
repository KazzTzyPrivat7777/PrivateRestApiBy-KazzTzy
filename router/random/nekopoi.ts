import { Request, Response } from "express";
import axios from "axios";
import cheerio from "cheerio";

const URL = "https://nekopoi.care/category/hentai/";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function fetchHentai() {
  const { data: html } = await axios.get(URL, {
    headers: { "User-Agent": UA, Referer: URL }
  });

  const $ = cheerio.load(html);
  const results: any[] = [];

  $("div.result > ul > li").each((i, el) => {
    const item = $(el);
    const desc = item.find(".desc");
    const title = item.find("h2 a").text().trim();
    const link = item.find("h2 a").attr("href");
    let thumbnail = item.find("img.wp-post-image").attr("src");

    if (thumbnail && thumbnail.startsWith("/")) {
      thumbnail = "https://nekopoi.care" + thumbnail;
    }

    const sinopsis = desc.find("p").filter((_, p) => 
      $(p).prev().text().toLowerCase().includes("sinopsis")
    ).first().text().trim();

    const genre = desc.find('p:contains("Genre")').text().replace(/Genre\s*:\s*/i, "").trim();
    const produser = desc.find('p:contains("Producers")').text().replace(/Producers\s*:\s*/i, "").trim();
    const durasi = desc.find('p:contains("Duration")').text().replace(/Duration\s*:\s*/i, "").trim();
    const size = desc.find('p:contains("Size")').text().replace(/Size\s*:\s*/i, "").trim();

    if (title && link) {
      results.push({
        title,
        link,
        thumbnail,
        sinopsis,
        genre,
        produser,
        durasi,
        size
      });
    }
  });

  return shuffle(results);
}

export default async function nekopoiHandler(req: Request, res: Response) {
  try {
    const data = await fetchHentai();

    if (!data.length) {
      return res.status(404).json({
        status: false,
        message: "Data tidak ditemukan"
      });
    }

    res.status(200).json({
      status: true,
      category: "hentai",
      total: data.length,
      results: data
    });
  } catch (err: any) {
    res.status(500).json({
      status: false,
      message: err.message
    });
  }
}