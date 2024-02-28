import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {Request} from "express-jwt";
import {jsonValidate} from "../../../utils/json-schema-middleware";

module.exports = (app: Express, prisma: PrismaClient) => app.post(
    "/post-login/profile/delete",
    jsonValidate({
        type: "object",
        properties: {
            uniqueIdProvider: {
                type: "integer",
                maximum: -1,
                minimum: -3
            }
        },
        required: ["uniqueIdProvider"]
    }),
    async (req: Request, res) => {
        const {uniqueIdProvider} = req.body

        prisma.profile.delete({
            where: {
                playerId_uniqueIdProvider: {
                    playerId: req.auth!.id,
                    uniqueIdProvider: uniqueIdProvider
                }
            }
        })
            .then(_result => res.status(204).end())
            .catch(_err => res.status(404).end())
    }
)