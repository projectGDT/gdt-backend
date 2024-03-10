import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {Request} from "express-jwt";

module.exports = (app: Express, prisma: PrismaClient) => app.get("/post-login/access/fetch", async (req: Request, res) => {
    prisma.accessApplyPayload.findMany({
        where: {
            submittedBy: req.auth!.id!
        }
    }).then(result => res.json(result))
})