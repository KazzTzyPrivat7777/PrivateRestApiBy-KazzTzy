import { Request, Response } from 'express'
import axios from 'axios'
import cheerio from 'cheerio'
import moment from 'moment'

moment.locale('id')

const fetchOngoingAnime = async () => {
  const { data } = await axios.get("https://www.livechart.me/summer-2024/tv")
  const $ = cheerio.load(data)
  const Result: any[] = []

  $("#content > main > article:nth-child(n)").each((i, e) => {
    const judul = $(e).find("div > h3 > a").text()
    const image = $(e).find("div > div.poster-container > img").attr("src")
    const eps = $(e).find("div > div.poster-container > a > div").text()
    const timestamp = $(e).find("time[data-anime-card-target='countdown']").attr("data-timestamp")
    if (!timestamp) return

    const jadwal = moment.unix(Number(timestamp)).format("YYYY-MM-DD HH:mm:ss")

    const now = moment()
    const releaseDate = moment.unix(Number(timestamp))
    const duration = moment.duration(releaseDate.diff(now))
    const countdown = `${duration.days()}d ${duration.hours()}h ${duration.minutes()}m ${duration.seconds()}s`

    const studio = $(e).find("div > div.anime-info > ul > li > a").text()
    const adaptasi = "Diadaptasi dari " + $(e).find("div > div.anime-info > div.anime-metadata > div.anime-source").text()
    
    const tags: string[] = []
    $(e).find("div > ol > li:nth-child(n)").each((i, b) => {
      const a = $(b).find("a").text()
      if (a) tags.push(a)
    })

    const hari = moment.unix(Number(timestamp)).format('dddd')

    Result.push({
      judul,
      tags,
      jadwal,
      countdown,
      image,
      studio,
      adaptasi,
      eps,
      hari
    })
  })

  return Result
}

export default async function ongoingAnimeHandler(req: Request, res: Response) {
  const hariFilter = (req.query.hari || req.body.hari || '').toString().toLowerCase()
  
  try {
    let animeList = await fetchOngoingAnime()

    if (hariFilter) {
      animeList = animeList.filter(a => a.hari.toLowerCase() === hariFilter)
    }

    res.json({
      status: true,
      count: animeList.length,
      data: animeList
    })
  } catch (e: any) {
    res.status(500).json({
      status: false,
      message: e.message
    })
  }
}

