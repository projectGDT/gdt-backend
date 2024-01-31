import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {validator} from "@exodus/schemasafe";
import {Request} from "express-jwt";

const profileBindMicrosoftValidator = validator({
    type: "object",
    properties: {
        accessToken: {type: "string"}
    }
})

module.exports = (app: Express, prisma: PrismaClient) => app.post("/post-login/profile/bind/java-microsoft", async (req: Request, res) => {
    if (!profileBindMicrosoftValidator(req.body)) {
        res.status(400).end()
        return
    }

    // ref: Microsoft Authentication Scheme - https://wiki.vg/Microsoft_Authentication_Scheme

    const {accessToken} = req.body

    await fetch("https://api.minecraftservices.com/minecraft/profile", {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/json"
        }
    })
        .then(response => response.json())
        .then(async json => {
            if (!(json.id && json.name)) {
                return Promise.reject()
            }

            const idStr = json.id as string
            // the returned UUID is without "-".

            const uuid =
                `${idStr.slice(0, 8)}-${idStr.slice(8, 12)}-${idStr.slice(12, 16)}-${idStr.slice(16, 20)}-${idStr.slice(20, /* towards the end */)}`
            const playerName = json.name

            await prisma.profile.create({
                data: {
                    uniqueIdProvider: -1, // Java Microsoft
                    uniqueId: uuid,
                    playerId: req.auth.id,
                    cachedPlayerName: playerName
                }
            })

            res.json({
                uuid: uuid,
                playerName: playerName
            })
        }).catch(_err => res.status(502).end())
})