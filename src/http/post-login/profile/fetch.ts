import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {Request} from "express-jwt";

module.exports = (app: Express, prisma: PrismaClient) => app.get("/post-login/profile/fetch", async (req: Request, res) => {
    prisma.profile.findMany({
        where: {
            playerId: req.auth.id
        }
    }).then(result => result.map(entry => ({
        uniqueIdProvider: entry.uniqueIdProvider,
        uniqueId: entry.uniqueId,
        cachedPlayerName: entry.cachedPlayerName
    }))).then(result => res.json(result))
})