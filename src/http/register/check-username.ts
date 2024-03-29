import {PrismaClient} from "@prisma/client";
import {Express} from "express";
import {usernameExists} from "../../utils/register-utils";

const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,15}$/

module.exports = (app: Express, prisma: PrismaClient) => app.get("/register/check-username/:username", async (req, res) => {
    if (!req.params.username.match(usernameRegex)) {
        res.status(400).end()
        return
    }

    usernameExists(req.params.username, prisma).then(exists => res.json({exists}))
})