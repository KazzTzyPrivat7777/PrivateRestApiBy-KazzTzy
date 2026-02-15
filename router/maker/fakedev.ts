import { Request, Response } from "express"
import { createCanvas, loadImage } from "canvas"
import axios from "axios"
import assets from "@putuofc/assetsku"

export default async function fakedev(req: Request, res: Response) {
const text = req.query.text as string
const verified = (req.query.verified as string)?.toLowerCase() === "true"
const imageUrl = req.query.image as string

if (!text || !imageUrl) {
return res.status(400).json({
status: false,
message: "Parameter 'text' dan 'image' diperlukan"
})
}

try {
const userBuffer = await axios.get(imageUrl, { responseType: "arraybuffer" }).then(r => r.data)
const userImage = await loadImage(userBuffer)
const bg = await loadImage("https://files.catbox.moe/ek8di9.jpg")
const badgeImage = verified ? await loadImage("https://files.catbox.moe/6hkvux.png") : null

const canvas = createCanvas(1080, 1080)
const ctx = canvas.getContext("2d")

ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)

const centerX = canvas.width / 2
const centerY = canvas.height / 2
const radius = 263

ctx.save()
ctx.beginPath()
ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
ctx.closePath()
ctx.clip()
ctx.drawImage(userImage, centerX - radius, centerY - radius, radius * 2, radius * 2)
ctx.restore()

ctx.save()
ctx.font = "bold 60px Arial"
ctx.fillStyle = "#fff"
ctx.textAlign = "center"
ctx.textBaseline = "middle"
drawCircularTextTop(ctx, text.toUpperCase(), centerX, centerY, radius, badgeImage)
ctx.restore()

const buffer = canvas.toBuffer("image/png")
res.setHeader("Content-Type", "image/png")
res.send(buffer)

} catch (err: any) {
res.status(500).json({ status: false, message: err.message })
}
}

const drawCircularTextTop = (ctx: any, text: string, centerX: number, centerY: number, radius: number, badgeImage: any) => {
const fontSize = 72
const strokeWidth = 3
const strokeColor = "#000"
const arcSpan = Math.PI * 0.7
const textRadius = radius + 75
const chars = text.split("")
const n = chars.length
const angleIncrement = n > 1 ? arcSpan / (n - 1) : 0
const start = Math.PI / 2 + arcSpan / 2

for (let i = 0; i < n; i++) {
const char = chars[i]
const angle = start - i * angleIncrement
const x = centerX + Math.cos(angle) * textRadius
const y = centerY + Math.sin(angle) * textRadius

ctx.save()
ctx.translate(x, y)
ctx.rotate(angle - Math.PI / 2)
ctx.lineWidth = strokeWidth
ctx.strokeStyle = strokeColor
ctx.strokeText(char, 0, 0)
ctx.fillText(char, 0, 0)
ctx.restore()
}

if (badgeImage) {
const endAngle = start - (n - 1) * angleIncrement
const badgeAngle = endAngle - angleIncrement
const badgeSize = Math.round(fontSize * 0.9)
const bx = centerX + Math.cos(badgeAngle) * textRadius
const by = centerY + Math.sin(badgeAngle) * textRadius
ctx.drawImage(badgeImage, bx - badgeSize / 2, by - badgeSize / 2, badgeSize, badgeSize)
}
}