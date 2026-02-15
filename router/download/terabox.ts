/*
 fitur: Terabox Downloader (API)
 credit: ©AlfiXD
 channel: https://whatsapp.com/channel/0029Vb4fjWE1yT25R7epR110
 scrape: https://whatsapp.com/channel/0029Vb7AafUL7UVRIpg1Fy24/141
*/

import axios from 'axios'
import * as cheerio from 'cheerio'
import FormData from 'form-data'
import { Request, Response } from 'express'

class TeraBox {
    BASE_URL = 'https://terabxdownloader.org'
    AJAX_PATH = '/wp-admin/admin-ajax.php'
    HEADERS = {
        accept: '*/*',
        'accept-language': 'id-ID',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Referer: 'https://terabxdownloader.org/',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    }

    CREATED_BY = 'Ditzzy'
    NOTE =
        'Thank you for using this scrape, I hope you appreciate me for making this scrape by not deleting wm'

    wrapResponse(data: any) {
        return {
            created_by: this.CREATED_BY,
            note: this.NOTE,
            results: data
        }
    }

    transformFolder(raw: any) {
        return {
            name: raw['📂 Name'],
            type: raw['📋 Type'],
            size: raw['📏 Size']
        }
    }

    transformFile(raw: any) {
        return {
            name: raw['📂 Name'],
            type: raw['📋 Type'],
            fullPath: raw['📍 Full Path'],
            size: raw['📏 Size'],
            downloadLink: raw['🔽 Direct Download Link']
        }
    }

    transformSummary(raw: any) {
        return {
            totalFolders: raw['📁 Total Folders'],
            totalFiles: raw['📄 Total Files'],
            totalItems: raw['🔢 Total Items']
        }
    }

    extractData(rawResponse: any) {
        const raw = rawResponse.data

        return {
            folders: (raw['📁 Folders'] || []).map((v: any) =>
                this.transformFolder(v)
            ),
            files: (raw['📄 Files'] || []).map((v: any) =>
                this.transformFile(v)
            ),
            summary: raw['📊 Summary']
                ? this.transformSummary(raw['📊 Summary'])
                : { totalFolders: 0, totalFiles: 0, totalItems: 0 },
            shortlink: raw['🔗 ShortLink'] || ''
        }
    }

    async getNonce() {
        const { data } = await axios.get(this.BASE_URL)
        const $ = cheerio.load(data)

        const script = $('#jquery-core-js-extra').html()
        if (!script) throw new Error('Nonce script not found')

        const match = script.match(/"nonce"\s*:\s*"([^"]+)"/i)
        if (!match) throw new Error('Nonce value not found')

        return match[1]
    }

    async download(url: string) {
        const nonce = await this.getNonce()

        const form = new FormData()
        form.append('action', 'terabox_fetch')
        form.append('url', url)
        form.append('nonce', nonce)

        const { data } = await axios.post(
            this.BASE_URL + this.AJAX_PATH,
            form,
            { headers: this.HEADERS }
        )

        return this.wrapResponse(this.extractData(data))
    }
}

export default async function teraboxHandler(req: Request, res: Response) {
    try {
        const { url } = req.query

        if (!url || typeof url !== 'string') {
            return res.status(400).json({
                status: false,
                error: 'URL is required'
            })
        }

        const terabox = new TeraBox()
        const result = await terabox.download(url)

        if (!result.results.files || result.results.files.length === 0) {
            return res.status(404).json({
                status: false,
                error: 'No files found or invalid TeraBox link'
            })
        }

        return res.status(200).json({
            status: true,
            result
        })
    } catch (error: any) {
        console.error('Error terabox:', error)
        return res.status(500).json({
            status: false,
            error: error.message || 'Internal Server Error'
        })
    }
}
