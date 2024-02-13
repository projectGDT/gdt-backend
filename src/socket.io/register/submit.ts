import {PrismaClient} from "@prisma/client";
import {digest} from "../../utils/digest";
import {usernameExists} from "../../utils/register-utils";
import {randomUUID} from "node:crypto";
import {validator} from "@exodus/schemasafe";
import {Server} from "socket.io";
import {EventEmitter} from "node:events";
import {verifyResponse} from "../../utils/captcha-verify";
import {qidExists} from "../../utils/register-utils";
import {trueOrReject} from "../../utils/true-or-reject";

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
        qid: {type: "string", pattern: "^[1-9][0-9]{4,9}$"},
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
        console.log(payload);
        if (!submitValidator(payload)) {
            socket.emit("payload_error")
            socket.disconnect()
            return
        }

        const {qid, username, password, invitationCode, ["cf-turnstile-response"]: cfTurnstileResponse} = payload
        const qidInNumber = parseInt(qid)

        Promise.all([
            verifyResponse(cfTurnstileResponse),
            qidExists(qidInNumber, prisma).then(res => !res), // true means qid exists -> fail
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
                            qid: qidInNumber,
                            username: username,
                            pwDigested: digest(password)
                        }
                    })
                    socket.emit("registered")
                } else {
                    socket.emit("timeout_error")
                }
                socket.disconnect()
            })

            // handle expiration
            setTimeout(() => preRegistries.emit(eventName, false), validityPeriod);
        }).catch(_err => {
            socket.emit("payload_error")
            socket.disconnect()
        })
    })
})