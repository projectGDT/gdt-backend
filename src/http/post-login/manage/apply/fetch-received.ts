import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {Request} from "express-jwt";

module.exports = (app: Express, prisma: PrismaClient) => app.get("/post-login/manage/:id/apply/fetch-received", async (req, res) => {
    prisma.applyingSession.findMany({
        where: {
            serverId: parseInt(req.params.id) // it is guaranteed that the id here is a valid integer!
        }
    }).then(result => res.json(result))
})