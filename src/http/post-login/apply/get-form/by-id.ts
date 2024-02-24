import {Express} from "express";
import {PrismaClient} from "@prisma/client";

module.exports = (app: Express, prisma: PrismaClient) => app.get("/post-login/apply/get-form/by-id/:uuid", (req, res) => {
    prisma.serverForm.findUniqueOrThrow({
        where: {
            uuid: req.params.uuid
        }
    })
        .then(result => res.json(result))
        .catch(_err => res.status(404).end())
})