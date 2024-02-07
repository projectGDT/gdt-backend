import { PrismaClient } from "@prisma/client";
import { digest } from "../../utils/digest";
import { qidExists } from "../../http/register/check-qid";
import { usernameExists } from "../../http/register/check-username";
import { randomUUID } from "node:crypto";
import {validator} from "@exodus/schemasafe";
import {Server} from "socket.io";
import {EventEmitter} from "node:events";

const validityPeriod = 10 * 60 * 1000; // 10 minutes
const emailAddr = "rc@gdt.pub";

export const preRegistries = new EventEmitter()

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
    socket.once("register-info", async payload => {
        if (!submitValidator(payload)) {
            socket.emit("error", {
                reason: "bad-captcha-response"
            })
            socket.disconnect()
            return
        }

        const {qid, username, password, invitationCode, ["cf-turnstile-response"]: cfTurnstileResponse} = payload

        if (!await require("../../utils/captcha-verify")(cfTurnstileResponse)) {
            socket.emit("error", {
                reason: "bad-captcha-response"
            })
            socket.disconnect()
            return
        }

        // QQ号已被注册
        if (await qidExists(qid, prisma)) {
            socket.emit("error", {
                reason: "qid-exists"
            })
            socket.disconnect()
            return
        }

        // 用户名已被注册
        if (await usernameExists(username, prisma)) {
            socket.emit("error", {
                reason: "username-exists"
            })
            socket.disconnect()
            return
        }

        // 邀请码无效
        if (invitationCode != null) {
            if (await prisma.invitationCode.findUnique({
                where: {
                    value: invitationCode
                }
            }) == null) {
                socket.emit("error", {
                    reason: "wrong-invitation-code"
                })
                socket.disconnect()
                return
            }
        }

        // 发回验证信息
        const passkey = randomUUID()

        socket.emit("pre-registered", {
            emailAddr: emailAddr,
            passkey: passkey
        })

        // 添加回调函数，被调用时说明验证成功
        const eventName = `${qid}.${passkey}`

        preRegistries.once(eventName, (success: boolean) => {
            if (success) {
                prisma.player.create({
                    data: {
                        qid: qid,
                        username: username,
                        pwDigested: digest(password),
                        isSiteAdmin: false
                    }
                })
                socket.emit("registered")
                socket.disconnect()
            } else {
                socket.emit("error", {
                    reason: "verify-timeout"
                })
                socket.disconnect()
            }
        })

        // validityPeriod后超时失败
        setTimeout(() => preRegistries.emit(eventName, false), validityPeriod);
    })
})