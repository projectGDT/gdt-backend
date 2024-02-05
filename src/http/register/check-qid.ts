import {PrismaClient} from "@prisma/client";
import {Express} from "express";

export const qidRegex = /^[1-9][0-9]{4,9}$/

export async function qidExists(qid: number, prisma: PrismaClient) {
    return prisma.player.findUnique({
        where: {
            qid: qid
        }
    }).then(result => result != null)
}

module.exports = (app: Express, prisma: PrismaClient) => app.get("/register/check-qid/:qid", async (req, res) => {
    if (!req.params.qid.match(qidRegex)) {
        res.status(400).end()
        return
    }

    qidExists(parseInt(req.params.qid), prisma)
        .then(exists => res.json({exists: exists}))
})