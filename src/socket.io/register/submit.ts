import { PrismaClient } from "@prisma/client";
import { digest } from "../../utils/digest";
import { qidExists } from "../../http/register/check-qid";
import { usernameExists } from "../../http/register/check-username";
import { randomUUID } from "node:crypto";
import {validator} from "@exodus/schemasafe";
import {Server} from "socket.io";
import {EventEmitter} from "node:events";
import {trueOrReject, verifyResponse} from "../../utils/captcha-verify";

const validityPeriod = 10 * 60 * 1000; // 10 minutes
const emailAddr = "rc@gdt.pub";

export const preRegistries = new EventEmitter()

async function invitationCodeNullOrExists(code: any, prisma: PrismaClient) {
    return (!code) || await prisma.invitationCode.findUnique({
        where: {
            value: code
        }
    }) !== null
}

const submitValidator = validator({
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

module.exports = (io: Server, prisma: PrismaClient) => io.of("/register/submit").on("connection", socket => {
    socket.once("payload", payload => {
        if (!submitValidator(payload)) {
            socket.emit("error", {
                reason: "invalid-payload"
            })
            socket.disconnect()
            return
        }

        const {qid, username, password, invitationCode, ["cf-turnstile-response"]: cfTurnstileResponse} = payload
        Promise.all([
            verifyResponse(cfTurnstileResponse),
            qidExists(qid, prisma).then(res => !res), // true means qid exists -> fail
            usernameExists(username, prisma).then(res => !res),
            invitationCodeNullOrExists(invitationCode, prisma)
        ].map(trueOrReject)).then(_res => {
            // send response
            const passkey = randomUUID()
            socket.emit("pre-registered", {
                emailAddr: emailAddr,
                passkey: passkey
            })

            // add callback
            const eventName = `${qid}.${passkey}`
            preRegistries.once(eventName, (success: boolean) => {
                if (success) {
                    prisma.player.create({
                        data: {
                            qid: qid,
                            username: username,
                            pwDigested: digest(password)
                        }
                    })
                    socket.emit("registered")
                } else {
                    socket.emit("error", {
                        reason: "timeout"
                    })
                }
                socket.disconnect()
            })

            // handle expiration
            setTimeout(() => preRegistries.emit(eventName, false), validityPeriod);
        }).catch(_err => {
            socket.emit("error", {
                reason: "invalid-payload"
            })
            socket.disconnect()
        })
    })
})