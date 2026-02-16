import { Request, Response } from 'express'
import axios from 'axios'
import cheerio from 'cheerio'

export default async function animeMangaHandler(req: Request, res: Response) {
  const query = (req.query.q || '').toString().trim()
  if (!query) return res.status(400).json({ status: false, message: 'Parameter q diperlukan.' })

  try {
    // === MANGA KOMIKU ===
    const searchUrl = `https://komiku.org/?post_type=manga&s=${encodeURIComponent(query)}`
    const { data: searchPageHtml } = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en-US,en;q=0.9' }
    })

    const $searchPage = cheerio.load(searchPageHtml)
    const apiUrl = $searchPage("span[hx-get]").attr("hx-get")

    let mangaResults: any[] = []
    if (apiUrl) {
      const { data: apiData } = await axios.get(apiUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en-US,en;q=0.9' }
      })
      const $ = cheerio.load(apiData)
      $("div.bge").each((_, el) => {
        const title = $(el).find("h3").text().trim()
        const link = $(el).find("div.bgei > a").attr("href")
        const image = $(el).find("div.bgei > a > img").attr("src")
        if (title && link && image) mangaResults.push({ title, link, image })
      })
    }

    // === ANIME JIKAN API ===
    const animeRes = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}`)
    const animeData = animeRes.data.data?.slice(0, 3).map((anime: any) => ({
      title: anime.title,
      score: anime.score,
      url: anime.url,
      image: anime.images?.jpg?.image_url
    })) || []

    res.json({
      status: true,
      query,
      manga: mangaResults.slice(0, 5),
      anime: animeData
    })

  } catch (error: any) {
    res.status(500).json({ status: false, message: error.message })
  }
}