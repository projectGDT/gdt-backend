import { Express } from "express";
import { PrismaClient } from "@prisma/client";
import { digest } from "../../utils/digest";
import { qidExists } from "../../http/register/check-qid";
import { usernameExists } from "../../http/register/check-username";
import { randomUUID } from "node:crypto";
import { validator } from "@exodus/schemasafe";

const validityPeriod = 10 * 60 * 1000; // 10 minutes
const emailAddr = "rc@gdt.pub";

// 键：passkey  值：由/register/confirm进行回调的函数
export const unverifiedPasskeysCallback = new Map();

module.exports = (app: any, prisma: PrismaClient) => app.ws("/register/submit", async (ws, req) => {
    // 检查输入内容是否符合格式要求
    const jsonValidator = validator({
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
    });
    if (!jsonValidator(req.body)) {
        ws.send(JSON.stringify({
            reason: "info-invalid"
        }));
        ws.close(400);
        return;
    }

    const {qid, username, password, invitationCode, ["cf-turnstile-response"]: cfTurnstileResponse} = req.body

    // 验证码无效
    if (!await require("../../utils/captcha-verify")(cfTurnstileResponse)) {
        ws.send(JSON.stringify({
            reason: "bad-captcha-response"
        }));
        ws.close(400);
        return;
    }

    // QQ号已被注册
    if (await qidExists(qid, prisma)) {
        ws.send(JSON.stringify({
            reason: "qid-exists"
        }));
        ws.close(400);
        return;
    }

    // 用户名已被注册
    if (await usernameExists(username, prisma)) {
        ws.send(JSON.stringify({
            reason: "username-exists"
        }));
        ws.close(400);
        return;
    }

    // 邀请码无效
    if (invitationCode != null) {
        if (await prisma.invitationCode.findUnique({
            where: {
                value: invitationCode
            }
        }) == null) {
            ws.send(JSON.stringify({
                reason: "wrong-invitation-code"
            }));
            ws.close(400);
            return;
        }
    }

    // 发回验证信息
    const passkey = randomUUID()

    ws.send(JSON.stringify({
        emailAddr: emailAddr,
        passkey: passkey
    }));

    // 添加回调函数，被调用时说明验证成功
    unverifiedPasskeysCallback.set(passkey, () => {
        // 添加player到数据库
        prisma.player.create({
            data: {
                qid: qid,
                username: username,
                pwDigested: digest(password),
                isSiteAdmin: false
            }
        });
        // 完成注册
        unverifiedPasskeysCallback.delete(passkey);
        ws.close(200);
    });

    // validityPeriod后超时失败
    setTimeout(() => {
        unverifiedPasskeysCallback.delete(passkey);
        ws.send(JSON.stringify({
            reason: "verify-timeout"
        }));
        ws.close(400);
    }, validityPeriod);
});