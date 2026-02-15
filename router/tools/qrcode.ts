import { Request, Response } from 'express'
import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'

async function uploadLogoFromUrl(imageUrl: string) {
    const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' })
    const tmp = `./tmp_${Date.now()}.png`
    fs.writeFileSync(tmp, imgRes.data)

    const form = new FormData()
    form.append('file', fs.createReadStream(tmp))

    const { data } = await axios.post(
        'https://api.qrcode-monkey.com/qr/uploadimage',
        form,
        {
            headers: {
                ...form.getHeaders(),
                'User-Agent': 'Mozilla/5.0',
                origin: 'https://www.qrcode-monkey.com',
                referer: 'https://www.qrcode-monkey.com/'
            }
        }
    )

    fs.unlinkSync(tmp)
    return data.file
}

async function generateQR(text: string, logoUrl?: string) {
    let logoFile: string | undefined

    if (logoUrl) {
        logoFile = await uploadLogoFromUrl(logoUrl)
    }

    const payload = {
        data: text,
        config: {
            body: 'square',
            eye: 'frame0',
            eyeBall: 'ball0',
            bodyColor: '#000000',
            bgColor: '#FFFFFF',
            eye1Color: '#000000',
            eye2Color: '#000000',
            eye3Color: '#000000',
            eyeBall1Color: '#000000',
            eyeBall2Color: '#000000',
            eyeBall3Color: '#000000',
            gradientType: 'linear',
            gradientOnEyes: 'true',
            ...(logoFile ? { logo: logoFile, logoMode: 'default' } : {})
        },
        size: 1000,
        download: 'imageUrl',
        file: 'png'
    }

    const { data } = await axios.post(
        'https://api.qrcode-monkey.com/qr/custom',
        JSON.stringify(payload),
        {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Content-Type': 'text/plain;charset=UTF-8',
                origin: 'https://www.qrcode-monkey.com',
                referer: 'https://www.qrcode-monkey.com/'
            }
        }
    )

    if (!data.imageUrl) throw new Error('Gagal membuat QR')
    return 'https:' + data.imageUrl
}

export default async function qrHandler(req: Request, res: Response) {
    const text = (req.query.text || req.body.text) as string
    const logo = (req.query.logo || req.body.logo) as string | undefined

    if (!text) {
        return res.status(400).json({
            status: false,
            message: "Parameter 'text' diperlukan"
        })
    }

    try {
        const imageUrl = await generateQR(text, logo)
        const img = await axios.get(imageUrl, { responseType: 'arraybuffer' })
        const buffer = Buffer.from(img.data)

        res.set('Content-Type', 'image/png')
        res.send(buffer)

    } catch (e: any) {
        res.status(500).json({
            status: false,
            message: e.message
        })
    }
}