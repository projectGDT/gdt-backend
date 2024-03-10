import {Express} from "express"
import {matches} from "../utils/digest"
import {PrismaClient} from "@prisma/client"
import jwt from "jsonwebtoken"
import {jwtSecret} from "../app"
import {jsonValidate} from "../utils/json-schema-middleware";
import {verifyResponse} from "../utils/captcha-verify";
import {trueOrReject} from "../utils/true-or-reject";
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
        trueOrReject(
            verifyResponse(cfTurnstileResponse)
        ).then(_result => prisma.player.findUniqueOrThrow({
            where: username.match(qidRegex) ?   // check if "username" is a valid qid
                {qid: parseInt(username)} :     // use qid
                {username: username},           // use username
            include: {
                involvedServers: true
            }
        })).then(player =>
            matches(password, player.pwDigested) ? player : Promise.reject()
        ).then(({id, isSiteAdmin, involvedServers}) => res.json({
            jwt: jwt.sign({
                id, isSiteAdmin,
                authorizedServers: involvedServers
                    .filter(entry => entry.isOperator)
                    .map(entry => entry.serverId)
            }, jwtSecret, {expiresIn: "12h"})
        })).catch(_error => res.status(400).end())
    }
)