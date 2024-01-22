import {validator} from "@exodus/schemasafe";
import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {digest} from "../utils/digest";
import {qidExists} from "./check-qid";
import {usernameExists} from "./check-username";

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

module.exports = (app: Express, prisma: PrismaClient) => app.post("/register/submit", async (req, res) => {
    if (!registerSubmitValidator(req.body)) {
        res.status(400).json({
            reason: "info-invalid"
        }).end()
        return
    }

    const {qid, username, password, invitationCode, ["cf-turnstile-response"]: cfTurnstileResponse} = req.body

    if (!await require("../utils/captcha-verify")(cfTurnstileResponse)) {
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
        invitorServerId = codeObject.serverId // for test, currently unused
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