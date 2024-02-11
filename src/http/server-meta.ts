import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {Request} from "express-jwt";

module.exports = (app: Express, prisma: PrismaClient) => app.get("/post-login/server-meta/:id", async (req: Request, res) => {
    prisma.server.findUniqueOrThrow({
        where: {
            id: parseInt(req.params.id)
        },
        include: {
            javaRemote: true,
            bedrockRemote: true
        }
    }).then(result => res.json(result))
        .catch(_err => res.status(404).end)
})