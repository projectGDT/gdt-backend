import {Express} from "express"
import {digest, matches} from "./pbkdf2-digest"
import {validator} from "@exodus/schemasafe"
import {PrismaClient} from "@prisma/client"
import jwt = require("jsonwebtoken")
import {jwtSecret} from "../app"

const loginValidator = validator({
    type: "object",
    properties: {
        username: {type: "string", pattern: "^.{3,}$"},
        password: {type: "string", pattern: "^.+$"},
        "cf-turnstile-response": {type: "string"}
    },
    required: ["username", "password", "cf-turnstile-response"],
    additionalProperties: false
})
const qidRegex = /^[1-9][0-9]{4,9}$/

module.exports = (app: Express, prisma: PrismaClient) => app.post("/login", async (req, res) => {
    if (!loginValidator(req.body)) {
        res.status(400).end()
        return
    }

    const {username, password, ["cf-turnstile-response"]: cfTurnstileResponse} = req.body
    if (!(await require("./do-site-verify")(cfTurnstileResponse))) {
        res.status(400).end()
        return
    }

    await prisma.player.findUniqueOrThrow({
        where: username.match(qidRegex) ?   // check if "username" is a valid qid
            {qid: parseInt(username)} :     // use qid
            {username: username}            // use username
    })
        .then(player => {
            if (!matches(password, player.pwFormatted))
                return Promise.reject()
            const payload = {
                id: player.id,
                isSiteAdmin: player.isSiteAdmin,
            }
            res.json({...payload, jwt: jwt.sign(payload, jwtSecret, {expiresIn: "12h"})})
        })
        .catch(error => res.status(400).end())
})