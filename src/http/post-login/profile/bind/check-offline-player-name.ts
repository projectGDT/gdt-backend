import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {jsonValidate} from "../../../../utils/json-schema-middleware";
import {Request} from "express-jwt"

module.exports = (app: Express, prisma: PrismaClient) => app.post(
    "/post-login/profile/bind/check-offline-player-name",
    jsonValidate({
        type: "object",
        properties: {
            uniqueIdProvider: {type: "integer", exclusiveMinimum: 0},
            playerName: {type: "string", pattern: "^[0-9A-Za-z_]{3,16}$", minimum: 3, maximum: 16}
        },
        required: ["uniqueIdProvider", "playerName"]
    }),
    async (req: Request, res) => {
        const {uniqueIdProvider, playerName} = req.body

        prisma.applyingSession.findFirst({
            where: {
                playerId: req.auth!.id,
                state: "ACCEPTED"
            }
        })
            .then(result => result ?? Promise.reject())
            .then(_result => prisma.profile.findUnique({
                where: {
                    uniqueIdProvider_uniqueId: {
                        uniqueIdProvider,
                        uniqueId: playerName
                    }
                }
            }))
            .then(result => res.json({
                exists: Boolean(result)
            }))
            .catch(_err => res.status(403).end())
    }
)