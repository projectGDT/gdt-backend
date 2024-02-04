import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {validator} from "@exodus/schemasafe";
import {Request} from "express-jwt";
import {xbl} from "@xboxreplay/xboxlive-auth";

const profileBindXboxValidator = validator({
    type: "object",
    properties: {
        userToken: {type: "string"}
    }
})

module.exports = (app: Express, prisma: PrismaClient) => app.post("/post-login/profile/bind/java-microsoft", async (req: Request, res) => {
    if (!profileBindXboxValidator(req.body)) {
        res.status(400).end()
        return
    }

    const {userToken} = req.body

    await xbl.exchangeTokenForXSTSToken(userToken)
        .then(async response => {
            const xuid = response.DisplayClaims.xui[0].xid
            const xboxGamerTag = response.DisplayClaims.xui[0].gtg

            await prisma.profile.create({
                data: {
                    uniqueIdProvider: -3, // Xbox
                    uniqueId: xuid,
                    playerId: req.auth.id,
                    cachedPlayerName: xboxGamerTag
                }
            })

            res.json({
                xuid: xuid,
                xboxGamerTag: xboxGamerTag
            })
        }).catch(_err => res.status(502).end())
})