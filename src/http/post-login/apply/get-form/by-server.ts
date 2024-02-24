import {Express} from "express";
import {PrismaClient} from "@prisma/client";

module.exports = (app: Express, prisma: PrismaClient) => app.get("/post-login/apply/get-form/by-server/:id", (req, res) => {
    prisma.serverForm.findFirstOrThrow({
        where: {
            serverId: parseInt(req.params.id),
            isLatest: true
        }
    })
        .then(result => res.json(result))
        .catch(_err => res.status(404).end())
})