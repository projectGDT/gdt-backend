import {PrismaClient} from "@prisma/client";
import {Express} from "express";
import {qidExists} from "../../utils/register-utils";

const qidRegex = /^[1-9][0-9]{4,9}$/

module.exports = (app: Express, prisma: PrismaClient) => app.get("/register/check-qid/:qid", async (req, res) => {
    if (!req.params.qid.match(qidRegex)) {
        res.status(400).end()
        return
    }

    qidExists(parseInt(req.params.qid), prisma).then(exists => res.json({exists}))
})