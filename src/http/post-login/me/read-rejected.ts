import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {Request} from "express-jwt";
import {jsonValidate} from "../../../utils/json-schema-middleware";

module.exports = (app: Express, prisma: PrismaClient) => app.post("/post-login/me/read-rejected",
        jsonValidate({
            type: "array",
            items: {type: "integer"}
        }),
        async (req: Request, res) => {
        prisma.$transaction(async context => {
            await context.applyingSession.updateMany({
                where: {
                    playerId: req.auth!.id,
                    state: "REJECTED"
                },
                data: {
                    state: "REJECTED_READ"
                }
            })
            await context.accessApplyPayload.updateMany({
                where: {
                    submittedBy: req.auth!.id,
                    state: "REJECTED"
                },
                data: {
                    state: "REJECTED_READ"
                }
            })
        }).then(_res => res.status(204).end())
    }
)