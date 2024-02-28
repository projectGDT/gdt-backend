import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {jsonValidate} from "../../../../utils/json-schema-middleware";
import {Request} from "express-jwt";

module.exports = (app: Express, prisma: PrismaClient) => app.post(
    "/post-login/profile/bind/offline",
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
            .then(result => result ?? Promise.reject(403))
            .then(_result => prisma.profile.create({
                data: {
                    playerId: req.auth!.id,
                    uniqueIdProvider,
                    uniqueId: playerName,
                    cachedPlayerName: playerName
                }
            }))
            .then(_result => res.status(204).end())
            .catch(err => {
                if (err === 403) res.status(403).end()
                else res.status(400).end() // already exists
            })
    }
)