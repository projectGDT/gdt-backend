import {validator} from "@exodus/schemasafe";
import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {digest} from "../../utils/digest";
import {qidExists} from "./check-qid";
import {usernameExists} from "./check-username";
import {randomUUID} from "node:crypto";

const registerSubmitValidator = validator({
    type: "object",
    properties: {
        qid: {type: "integer", minimum: 10001, maximum: 4294967295},
        username: {type: "string", pattern: "^[a-zA-Z][a-zA-Z0-9_]{2,15}$"},
        password: {type: "string", pattern: "^(?=.*[a-zA-Z])(?=.*\\d).{8,}$"},
        invitationCode: {type: "string"},
        "cf-turnstile-response": {type: "string"}
    },
    required: ["qid", "username", "password", "cf-turnstile-response"],
    additionalProperties: false
})

const validityPeriod = 10 * 60 * 1000 // ten minutes

const emailAddr = "rc@gdt.pub"

module.exports = (app: Express, prisma: PrismaClient) => app.post("/register/submit", async (req, res) => {
    if (!registerSubmitValidator(req.body)) {
        res.status(400).json({
            reason: "info-invalid"
        }).end()
        return
    }

    const {qid, username, password, invitationCode, ["cf-turnstile-response"]: cfTurnstileResponse} = req.body

    if (!await require("../../utils/captcha-verify")(cfTurnstileResponse)) {
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

    if (invitationCode != null) {
        if (await prisma.invitationCode.findUnique({
            where: {
                value: invitationCode
            }
        }) == null) {
            res.status(400).json({
                reason: "wrong-invitation-code"
            })
            return
        }
    }

    const passkey = randomUUID()

    prisma.preRegisteredPlayer.create({
        data: {
            passkey: passkey,
            qid: qid,
            username: username,
            pwDigested: digest(password),
            expiresAt: Date.now() + validityPeriod,
            invitationCode: invitationCode as string
        }
    }).then(_player => {
        res.json({
            emailAddr: emailAddr,
            passkey: passkey
        })
    })
})