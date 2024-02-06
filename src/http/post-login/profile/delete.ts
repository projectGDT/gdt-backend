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
        }
    }),
    async (req: Request, res) => {
        const {uniqueIdProvider} = req.body

        prisma.profile.deleteMany /* why does using delete result in a compile error? */ ({
            where: {
                playerId: req.auth.id,
                uniqueIdProvider: uniqueIdProvider
            }
        })
    }
)