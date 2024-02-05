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

module.exports = (app: Express, prisma: PrismaClient) => app.post("/post-login/profile/bind/java-microsoft", (req: Request, res) => {
    if (!profileBindXboxValidator(req.body)) {
        res.status(400).end()
        return
    }

    const {userToken} = req.body

    xbl.exchangeTokenForXSTSToken(userToken).then(response => ({
        xuid: response.DisplayClaims.xui[0].xid,
        xboxGamerTag: response.DisplayClaims.xui[0].gtg
    })).then(({xuid, xboxGamerTag}) => prisma.profile.create({
        data: {
            uniqueIdProvider: -3, // Xbox
            uniqueId: xuid,
            playerId: req.auth.id,
            cachedPlayerName: xboxGamerTag
        }
    })).then(({uniqueId, cachedPlayerName}) => res.json({
        xuid: uniqueId,
        xboxGamerTag: cachedPlayerName
    })).catch(_err => res.status(502).end())
})