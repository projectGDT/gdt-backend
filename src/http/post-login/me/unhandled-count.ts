import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {Request} from "express-jwt";

module.exports = (app: Express, prisma: PrismaClient) => app.get("/post-login/me/unhandled-count", async (req: Request, res) => {
    prisma.$transaction(async context => {
        const applyCount = await context.applyingSession.count({
            where: {
                playerId: req.auth!.id,
                state: {
                    in: ["ACCEPTED", "REJECTED"]
                }
            }
        })
        const accessCount = await context.accessApplyPayload.count({
            where: {
                submittedBy: req.auth!.id,
                state: {
                    in: ["ACCEPTED", "REJECTED"]
                }
            }
        })
        return applyCount + accessCount
    }).then(count => res.json({count}))
})