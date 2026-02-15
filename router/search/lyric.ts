import { Request, Response } from 'express'
import axios from 'axios'
import * as cheerio from 'cheerio'

async function scrapLirik(query: string) {
    const { data: html } = await axios.get(`https://lirik.my/?s=${encodeURIComponent(query)}`, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        }
    })

    const $ = cheerio.load(html)
    const links: string[] = []

    $("article.post").each((_, el) => {
        const url = $(el).find(".entry-title a").attr("href")
        if (url) links.push(url)
    })

    if (links.length === 0) return null

    const chosen = links.length === 1
        ? links[0]
        : Math.random() < 0.7
        ? links[0]
        : links[Math.floor(Math.random() * links.length)]

    const { data: page } = await axios.get(chosen, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        }
    })

    const $$ = cheerio.load(page)
    const $content = $$(".entry-content").clone()

    $content.find("script, style, .read-more-container, .code-block, .ai-viewports, .wp-block-button").remove()

    const lyrics = $content
        .html()!
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<p[^>]*>/gi, "")
        .replace(/<[^>]+>/g, "")
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length)
        .join("\n")

    return lyrics
}

export default async function lyricHandler(req: Request, res: Response) {
    try {
        const q = (req.query.q || req.body.q) as string
        
        if (!q) {
            return res.status(400).json({
                status: false,
                error: "parameter 'q' diperlukan"
            })
        }

        const result = await scrapLirik(q)

        if (!result) {
            return res.status(404).json({
                status: false,
                error: "Lirik tidak ditemukan"
            })
        }

        res.json({
            status: true,
            response: result
        })
    } catch (err: any) {
        res.status(500).json({
            status: false,
            error: err.message || "internal server error"
        })
    }
}