import {PrismaClient} from "@prisma/client";
import {Router} from "express";

export const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,15}$/

export async function usernameExists(username: string, prisma: PrismaClient) {
    return prisma.player.findUnique({
        where: {
            username: username
        }
    }).then(result => result != null)
}

module.exports = (router: Router, prisma: PrismaClient) => router.get("/register/check-username/:username", async (req, res) => {
    if (!req.params.username.match(usernameRegex)) {
        res.status(400).end()
        return
    }
    res.json({exists: await usernameExists(req.params.username, prisma)})
})