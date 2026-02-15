import { Request, Response } from "express"
import { createCanvas } from "canvas"
import axios from "axios"
import assets from "@putuofc/assetsku"

export default async function pornhubLogo(req: Request, res: Response) {
const text1 = (req.query.text1 as string)?.trim()
const text2 = (req.query.text2 as string)?.trim()

if (!text1 || !text2) {
return res.status(400).json({
status: false,
message: "Parameter 'text1' dan 'text2' diperlukan"
})
}

try {
let fontSize = 100
const maxCanvasWidth = 1000
const tempCanvas = createCanvas(1200, 300)
const tempCtx = tempCanvas.getContext('2d')

const calculateWidth = (size: number) => {
tempCtx.font = `bold ${size}px sans-serif`
return tempCtx.measureText(text1).width + tempCtx.measureText(text2).width + 120
}

let totalWidth = calculateWidth(fontSize)
while (totalWidth > maxCanvasWidth && fontSize > 30) {
fontSize -= 5
totalWidth = calculateWidth(fontSize)
}

const ctx = tempCanvas.getContext('2d')
ctx.font = `bold ${fontSize}px sans-serif`
const width1 = ctx.measureText(text1).width
const width2 = ctx.measureText(text2).width

const padding = fontSize * 0.5
const rectPadding = fontSize * 0.15
const canvasWidth = width1 + width2 + (padding * 2) + (rectPadding * 2) + (fontSize * 0.2)
const canvasHeight = fontSize + (padding * 1.5)

const canvas = createCanvas(canvasWidth, canvasHeight)
const canvasCtx = canvas.getContext('2d')

canvasCtx.fillStyle = '#000000'
canvasCtx.fillRect(0, 0, canvasWidth, canvasHeight)

canvasCtx.font = `bold ${fontSize}px sans-serif`
canvasCtx.textBaseline = 'middle'

const x1 = padding
const y = canvasHeight / 2

canvasCtx.fillStyle = '#ffffff'
canvasCtx.fillText(text1, x1, y)

const x2 = x1 + width1 + (fontSize * 0.15)
const rectWidth = width2 + (rectPadding * 2)
const rectHeight = fontSize + (fontSize * 0.2)
const rectY = (canvasHeight - rectHeight) / 2
const radius = fontSize * 0.15

canvasCtx.fillStyle = '#ff9900'
canvasCtx.beginPath()
canvasCtx.moveTo(x2 + radius, rectY)
canvasCtx.lineTo(x2 + rectWidth - radius, rectY)
canvasCtx.quadraticCurveTo(x2 + rectWidth, rectY, x2 + rectWidth, rectY + radius)
canvasCtx.lineTo(x2 + rectWidth, rectY + rectHeight - radius)
canvasCtx.quadraticCurveTo(x2 + rectWidth, rectY + rectHeight, x2 + rectWidth - radius, rectY + rectHeight)
canvasCtx.lineTo(x2 + radius, rectY + rectHeight)
canvasCtx.quadraticCurveTo(x2, rectY + rectHeight, x2, rectY + rectHeight - radius)
canvasCtx.lineTo(x2, rectY + radius)
canvasCtx.quadraticCurveTo(x2, rectY, x2 + radius, rectY)
canvasCtx.closePath()
canvasCtx.fill()

canvasCtx.fillStyle = '#000000'
canvasCtx.fillText(text2, x2 + rectPadding, y)

const buffer = canvas.toBuffer("image/png")
res.setHeader("Content-Type", "image/png")
res.send(buffer)

} catch (err: any) {
res.status(500).json({
status: false,
message: err.message || "Gagal membuat Pornhub Logo"
})
}
}