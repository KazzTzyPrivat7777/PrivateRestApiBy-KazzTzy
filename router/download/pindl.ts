import axios from 'axios'
import cheerio from 'cheerio'
import { Request, Response } from 'express'

async function pindl(url: string) {
    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept': 'text/html'
            },
            timeout: 15000
        })

        const $ = cheerio.load(res.data)

        // Ambil JSON-LD
        const ldJson = $('script[type="application/ld+json"]').first().text()
        if (!ldJson) throw new Error('No JSON-LD found')

        const data = JSON.parse(ldJson)

        // Deteksi video atau image
        const isVideo = data['@type'] === 'VideoObject'

        let image = null
        let video = null

        if (isVideo) {
            video = data.contentUrl || null
            image = data.thumbnailUrl || null
        } else {
            image = data.image || null
        }

        if (!image && !video) {
            throw new Error('Media not found')
        }

        return {
            status: true,
            isVideo,
            info: data,
            image,
            video
        }
    } catch (e: any) {
        return {
            status: false,
            error: e.message || 'Failed to download Pinterest content'
        }
    }
}

export default async function pindlHandler(req: Request, res: Response) {
    try {
        const { url } = req.query

        if (!url || typeof url !== 'string') {
            return res.status(400).json({
                status: false,
                error: 'URL is required'
            })
        }

        const result = await pindl(url)

        if (!result.status) {
            return res.status(500).json(result)
        }

        return res.status(200).json({
            status: true,
            result
        })
    } catch (error: any) {
        console.error('Error pindl:', error)
        return res.status(500).json({
            status: false,
            error: error.message || 'Internal Server Error'
        })
    }
}