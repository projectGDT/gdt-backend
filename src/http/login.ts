import {Express} from "express"
import {matches} from "../utils/digest"
import {PrismaClient} from "@prisma/client"
import jwt = require("jsonwebtoken")
import {jwtSecret} from "../app"
import {jsonValidate} from "../utils/json-schema-middleware";
const qidRegex = /^[1-9][0-9]{4,9}$/

module.exports = (app: Express, prisma: PrismaClient) => app.post(
    "/login",
    jsonValidate({
        type: "object",
        properties: {
            username: {type: "string", pattern: "^.{3,}$"},
            password: {type: "string", pattern: "^.+$"},
            "cf-turnstile-response": {type: "string"}
        },
        required: ["username", "password", "cf-turnstile-response"],
        additionalProperties: false
    }),
    async (req, res) => {
        const {username, password, ["cf-turnstile-response"]: cfTurnstileResponse} = req.body
        if (!(await require("../utils/captcha-verify")(cfTurnstileResponse))) {
            res.status(400).end()
            return
        }

        prisma.player.findUniqueOrThrow({
            where: username.match(qidRegex) ?   // check if "username" is a valid qid
                {qid: parseInt(username)} :     // use qid
                {username: username}            // use username
        }).then(async player => {
            if (!matches(password, player.pwDigested))
                return Promise.reject()
            const payload = {
                id: player.id,
                isSiteAdmin: player.isSiteAdmin,
                authorizedServers: await prisma.playerInServer.findMany({
                    where: {
                        playerId: player.id,
                        isOperator: true
                    }
                }).then(result => result.map(entry => entry.serverId))
            }
            res.json({...payload, jwt: jwt.sign(payload, jwtSecret, {expiresIn: "12h"})})
        }).catch(_error => res.status(400).end())
    }
)