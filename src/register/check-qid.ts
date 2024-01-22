import {PrismaClient} from "@prisma/client";
import {Router} from "express";

export const qidRegex = /^[1-9][0-9]{4,9}$/

export async function qidExists(qid: number, prisma: PrismaClient) {
    return prisma.player.findUnique({
        where: {
            qid: qid
        }
    }).then(result => result != null)
}

module.exports = (router: Router, prisma: PrismaClient) => router.get("/register/check-qid/:qid", async (req, res) => {
    if (!req.params.qid.match(qidRegex)) {
        res.status(400).end()
        return
    }
    res.json({exists: await qidExists(parseInt(req.params.qid), prisma)})
})