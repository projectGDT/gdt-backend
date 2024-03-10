import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {Request} from "express-jwt";

module.exports = (app: Express, prisma: PrismaClient) => app.get("/post-login/apply/fetch-submitted", async (req: Request, res) => {
    prisma.applyingSession.findMany({
        where: {
            playerId: req.auth!.id
        },
        include: {
            server: true
        }
    }).then(result => result.map(
        ({server: {id, logoLink}, ...others}) => ({
            ...others,
            server: {id, logoLink}
        })
    )).then(result => res.json(result))
})