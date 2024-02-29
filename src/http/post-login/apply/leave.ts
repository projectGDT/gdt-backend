import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {jsonValidate} from "../../../utils/json-schema-middleware";
import {Request} from "express-jwt";

module.exports = (app: Express, prisma: PrismaClient) => app.post(
    "/post-login/apply/leave",
    jsonValidate({
        type: "object",
        properties: {
            id: {type: "integer"}
        },
        required: ["id"]
    }),
    async (req: Request, res) => {
        prisma.playerInServer.delete({
            where: {
                playerId_serverId: {
                    playerId: req.auth!.id,
                    serverId: req.body.id
                }
            }
        })
            .then(_result => res.status(204).end())
            .catch(_err => res.status(404).end())
    }
)