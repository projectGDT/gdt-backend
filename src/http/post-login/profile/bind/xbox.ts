import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {Request} from "express-jwt";
import {live, xbl} from "@xboxreplay/xboxlive-auth";
import {jsonValidate} from "../../../../utils/json-schema-middleware";

const clientId = "9e474b67-edcd-4d23-b2fc-6dc8db5e08f7" // projectGDT
const scope = "XboxLive.signin"
const redirectUri = "http://localhost:3000/post-login/settings/profile/xbox"

module.exports = (app: Express, prisma: PrismaClient) => app.post(
    "/post-login/profile/bind/xbox",
    jsonValidate({
        type: "object",
        properties: {
            code: {type: "string"}
        },
        required: ["code"]
    }),
    async (req: Request, res) => {
        const {code} = req.body
        const playerData = await live.exchangeCodeForAccessToken(code, clientId, scope, redirectUri)
        .then(response => xbl.exchangeRpsTicketForUserToken(response.access_token, "d"))
        .then(response => xbl.exchangeTokenForXSTSToken(response.Token))
        .then(response => ({
            xuid: response.DisplayClaims.xui[0].xid,
            xboxGamerTag: response.DisplayClaims.xui[0].gtg
        })).catch(_err => {
            res.status(500).json({
                reason: "internal-error"
            })
            return null
        })

        if (!playerData) return

        prisma.profile.create({
            data: {
                uniqueIdProvider: -3, // Xbox
                uniqueId: playerData.xuid!,
                playerId: req.auth!.id,
                cachedPlayerName: playerData.xboxGamerTag
            }
        }).then(
            _result => res.json(playerData)
        ).catch(_err => {
            res.status(500).json({
                reason: "already-exists"
            })
        })
    }
)