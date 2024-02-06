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

        prisma.profile.deleteMany /* why does using delete result in a compile error? */ ({
            where: {
                playerId: req.auth.id,
                uniqueIdProvider: uniqueIdProvider
            }
        }).then(result => {
            if (result.count === 0)
                res.status(404).end()
            else res.status(200).json({}).end()
        })
    }
)