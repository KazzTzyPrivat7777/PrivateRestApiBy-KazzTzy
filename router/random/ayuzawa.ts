import { Request, Response } from 'express';

export default async function blueArchiveHandler(req: Request, res: Response) {
    try {
        // Ambil list link gambar
        const apiResponse = await fetch(
            'https://raw.githubusercontent.com/Leoo7z/Image-Source/main/image/ayuzawa.json'
        );
        if (!apiResponse.ok) throw new Error('Gagal mengambil list gambar');

        const links: string[] = await apiResponse.json();

        // Pilih random image
        const randomUrl = links[Math.floor(Math.random() * links.length)];

        // Fetch gambar
        const imageResponse = await fetch(randomUrl);
        if (!imageResponse.ok) throw new Error('Gagal mengambil gambar');

        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Kirim sebagai image
        res.set('Content-Type', 'image/png');
        res.send(buffer);

    } catch (error: any) {
        console.error('Error AyuZawa', error);
        res.status(500).json({
            status: false,
            message: 'Internal Server Error'
        });
    }
}