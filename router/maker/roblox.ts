import { Request, Response } from "express"
import * as Canvas from "canvas"
import axios from "axios"
import assets from "@putuofc/assetsku"

Canvas.registerFont(assets.font.get("ARRIAL"), { family: "CustomFont" })

async function getRobloxData(username: string) {
    const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", {
        usernames: [username],
        excludeBannedUsers: false
    })
    const userId = userRes.data?.data?.[0]?.id
    if (!userId) throw new Error("User not found")

    const [basic, friends, followers, headshot] = await Promise.all([
        axios.get(`https://users.roblox.com/v1/users/${userId}`),
        axios.get(`https://friends.roblox.com/v1/users/${userId}/friends/count`),
        axios.get(`https://friends.roblox.com/v1/users/${userId}/followers/count`),
        axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=720x720&format=Png&isCircular=false`)
    ])

    return {
        basic: basic.data,
        friends: friends.data.count,
        followers: followers.data.count,
        avatar: headshot.data.data[0].imageUrl
    }
}

async function drawRobloxCanvas(profile: any) {
    const canvas = Canvas.createCanvas(1000, 500)
    const ctx = canvas.getContext('2d')

    const grad = ctx.createLinearGradient(0, 0, 1000, 500)
    grad.addColorStop(0, '#1a1b20')
    grad.addColorStop(1, '#2d2f36')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1000, 500)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
    ctx.beginPath()
    ctx.moveTo(700, 0)
    ctx.lineTo(1000, 0)
    ctx.lineTo(1000, 500)
    ctx.lineTo(550, 500)
    ctx.fill()

    const avatarImg = await Canvas.loadImage(profile.avatar)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 40
    ctx.drawImage(avatarImg, 20, 20, 460, 460)
    ctx.shadowBlur = 0

    const contentX = 480
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 60px CustomFont'
    ctx.fillText(profile.basic.displayName, contentX, 120)

    ctx.fillStyle = '#999999'
    ctx.font = '25px CustomFont'
    ctx.fillText(`@${profile.basic.name}`, contentX, 160)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 35px CustomFont'
    ctx.fillText(profile.friends.toLocaleString(), contentX, 300)
    ctx.fillText(profile.followers.toLocaleString(), contentX + 200, 300)

    ctx.fillStyle = '#888888'
    ctx.font = '18px CustomFont'
    ctx.fillText('FRIENDS', contentX, 330)
    ctx.fillText('FOLLOWERS', contentX + 200, 330)

    ctx.fillStyle = '#cccccc'
    ctx.font = 'italic 18px CustomFont'
    const bio = profile.basic.description || "No desc provided."
    const truncatedBio = bio.length > 100 ? bio.substring(0, 100) + "..." : bio
    
    let y = 200
    const words = truncatedBio.split(' ')
    let line = ''
    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' '
        if (ctx.measureText(testLine).width > 450) {
            ctx.fillText(line, contentX, y)
            line = words[n] + ' '
            y += 25
        } else { line = testLine }
    }
    ctx.fillText(line, contentX, y)

    const joinDate = new Date(profile.basic.created).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
    ctx.fillStyle = '#555555'
    ctx.font = '16px CustomFont'
    ctx.fillText(`Join from ${joinDate}`, contentX, 460)

    return canvas.toBuffer('image/png')
}

export default async function robloxHandler(req: Request, res: Response) {
    const username = (req.query.username || req.body.username) as string

    if (!username) {
        return res.status(400).json({
            status: false,
            message: "Parameter 'username' diperlukan."
        })
    }

    try {
        const profile = await getRobloxData(username)
        const buffer = await drawRobloxCanvas(profile)
        
        res.set("Content-Type", "image/png")
        res.send(buffer)
    } catch (error: any) {
        res.status(500).json({
            status: false,
            message: error.message
        })
    }
}