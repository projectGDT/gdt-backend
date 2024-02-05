import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {Request} from "express-jwt";
import {xbl} from "@xboxreplay/xboxlive-auth";
import {jsonValidate} from "../../../../utils/json-schema-middleware";

module.exports = (app: Express, prisma: PrismaClient) => app.post(
    "/post-login/profile/bind/java-microsoft",
    jsonValidate({
        type: "object",
        properties: {
            userToken: {type: "string"}
        }
    }),
    (req: Request, res) => {
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
    }
)