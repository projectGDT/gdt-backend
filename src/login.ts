import {Express} from "express"
import {matches} from "./utils/digest"
import {validator} from "@exodus/schemasafe"
import {PrismaClient} from "@prisma/client"
import jwt = require("jsonwebtoken")
import {jwtSecret} from "./app"

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
    if (!(await require("./utils/captcha-verify")(cfTurnstileResponse))) {
        res.status(400).end()
        return
    }

    await prisma.player.findUniqueOrThrow({
        where: username.match(qidRegex) ?   // check if "username" is a valid qid
            {qid: parseInt(username)} :     // use qid
            {username: username}            // use username
    })
        .then(async player => {
            if (!matches(password, player.pwDigested))
                return Promise.reject()
            const payload = {
                id: player.id,
                isSiteAdmin: player.isSiteAdmin,
                authorizedServers: await prisma.playersInServers.findMany({
                    where: {
                        playerId: player.id,
                        isOperator: true
                    }
                }).then(result => result.map(entry => entry.serverId))
            }
            res.json({...payload, jwt: jwt.sign(payload, jwtSecret, {expiresIn: "12h"})})
        })
        .catch(error => res.status(400).end())
})