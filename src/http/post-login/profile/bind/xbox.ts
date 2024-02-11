import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {Request} from "express-jwt";
import {live, xbl} from "@xboxreplay/xboxlive-auth";
import {jsonValidate} from "../../../../utils/json-schema-middleware";
import {string} from "random-js";

const clientId = "9e474b67-edcd-4d23-b2fc-6dc8db5e08f7" // projectGDT
const scope = "XboxLive.signin"
const redirectUri = "http://localhost:3000/settings/profile/xbox"

module.exports = (app: Express, prisma: PrismaClient) => app.post(
    "/post-login/profile/bind/xbox",
    jsonValidate({
        type: "object",
        properties: {
            code: {type: "string"}
        },
        required: ["code"]
    }),
    (req: Request, res) => {
        const {code} = req.body
        live.exchangeCodeForAccessToken(code, clientId, scope, redirectUri)
        .then(response => xbl.exchangeRpsTicketForUserToken(response.access_token, "d"))
        .then(response => xbl.exchangeTokenForXSTSToken(response.Token))
        .then(response => ({
            xuid: response.DisplayClaims.xui[0].xid,
            xboxGamerTag: response.DisplayClaims.xui[0].gtg
        })).catch(_err => {
            throw "internal-error"
        }).then(({xuid, xboxGamerTag}) => prisma.profile.create({
            data: {
                uniqueIdProvider: -3, // Xbox
                uniqueId: xuid!,
                playerId: req.auth!.id,
                cachedPlayerName: xboxGamerTag
            }
        })).catch(err => {
            throw err instanceof string ? err : "already-exists"
        }).then(({uniqueId, cachedPlayerName}) => res.json({
            xuid: uniqueId,
            xboxGamerTag: cachedPlayerName
        })).catch(errMsg => res.status(500).json({
            reason: errMsg
        }))
    }
)