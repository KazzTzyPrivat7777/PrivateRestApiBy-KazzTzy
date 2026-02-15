import { Request, Response } from 'express'
import axios from 'axios'
import cheerio from 'cheerio'

class ImgFlipScraper {
    baseURL = 'https://imgflip.com'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9'
    }

    async scrapePopularMemes(page = 1) {
        const url = `${this.baseURL}/memetemplates${page > 1 ? `?page=${page}` : ''}`
        const { data } = await axios.get(url, { headers: this.headers })
        const $ = cheerio.load(data)
        const memes: { title: string; imageUrl: string }[] = []

        $('.mt-boxes .mt-box').each((_, el) => {
            const title =
                $(el).find('.mt-title a').attr('title') ||
                $(el).find('.mt-title a').text().trim()
            const src = $(el).find('.mt-img-wrap img').attr('src')
            if (src) {
                memes.push({
                    title,
                    imageUrl: 'https:' + src
                })
            }
        })

        return memes
    }
}

export default async function randomMemeHandler(req: Request, res: Response) {
    try {
        const scraper = new ImgFlipScraper()
        const page = Math.floor(Math.random() * 5) + 1
        const memes = await scraper.scrapePopularMemes(page)

        if (!memes.length) {
            return res.status(404).json({
                status: false,
                message: 'Meme tidak ditemukan'
            })
        }

        const randomMeme = memes[Math.floor(Math.random() * memes.length)]
        const imageResponse = await axios.get(randomMeme.imageUrl, {
            responseType: 'arraybuffer'
        })

        res.set('Content-Type', 'image/jpeg')
        res.send(Buffer.from(imageResponse.data))
    } catch (error) {
        console.error(error)
        res.status(500).json({
            status: false,
            message: 'Internal Server Error'
        })
    }
}