import {validator} from "@exodus/schemasafe";
import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {digest} from "./pbkdf2-digest";

const registerSubmitValidator = validator({
    type: "object",
    properties: {
        qid: {type: "integer", minimum: 10001, maximum: 4294967295},
        username: {type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]{2,15}$"},
        password: {type: "string", pattern: "^(?=.*[a-zA-Z])(?=.*\\d).{8,}$"},
        invitationCode: {type: "string"},
        "cf-turnstile-response": {type: "string"}
    },
    required: ["qid", "username", "password", "invitationCode", "cf-turnstile-response"],
    additionalProperties: false
})

const qidRegex = /^[1-9][0-9]{4,9}$/
const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,15}$/

async function qidExists(qid: number, prisma: PrismaClient) {
    return prisma.player.findUnique({
        where: {
            qid: qid
        }
    }).then(result => result != null)
}

async function usernameExists(username: string, prisma: PrismaClient) {
    return prisma.player.findUnique({
        where: {
            username: username
        }
    }).then(result => result != null)
}

module.exports = (app: Express, prisma: PrismaClient) => {
    app.get("/register/check-qid/:qid", async (req, res) => {
        if (!req.params.qid.match(qidRegex)) {
            res.status(400).end()
            return
        }
        res.json({exists: await qidExists(parseInt(req.params.qid), prisma)})
    })

    app.get("/register/check-username/:username", async (req, res) => {
        if (!req.params.username.match(usernameRegex)) {
            res.status(400).end()
            return
        }
        res.json({exists: await usernameExists(req.params.username, prisma)})
    })

    app.post("/register/submit", async (req, res) => {
        if (!registerSubmitValidator(req.body)) {
            res.status(400).json({
                reason: "info-invalid"
            }).end()
            return
        }

        const {qid, username, password, invitationCode, ["cf-turnstile-response"]: cfTurnstileResponse} = req.body

        if (!await require("./do-site-verify")(cfTurnstileResponse)) {
            res.status(400).json({
                reason: "bad-captcha-response"
            })
            return
        }

        if (await qidExists(qid, prisma)) {
            res.status(400).json({
                reason: "qid-exists"
            }).end()
            return
        }

        if (await usernameExists(username, prisma)) {
            res.status(400).json({
                reason: "username-exists"
            }).end()
            return
        }

        let invitorServerId = -1
        if (invitationCode != null) {
            const codeObject = await prisma.invitationCode.findUnique({
                where: {
                    value: invitationCode
                }
            })
            if (codeObject == null) {
                res.status(400).json({
                    reason: "wrong-invitation-code"
                })
                return
            }
            invitorServerId = codeObject.serverId
        }

        // mail api not implemented, just for test, add players without mail verification
        prisma.player.create({
            data: {
                qid: qid,
                username: username,
                pwFormatted: digest(password),
                isSiteAdmin: false
            }
        })
    })
}