import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {jsonValidate} from "../../../utils/json-schema-middleware";
import {Request} from "express-jwt";

module.exports = (app: Express, prisma: PrismaClient) => app.post(
    "/post-login/apply/join-by-code",
    jsonValidate({
        type: "object",
        properties: {
            code: {type: "string", pattern: "^[0-9a-fA-F]{8}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{12}$"},
        },
        required: ["code"]
    }),
    async (req: Request, res) => {
        const {code} = req.body
        prisma.$transaction(async context => { // why use transaction?
            const wrapper = await context.invitationCode.findUniqueOrThrow({
                where: {value: code}
            })

            if (
                Date.now() > wrapper.issuedAt.getMilliseconds() + wrapper.lifetime ||
                wrapper.reusableTimes === 0 // think about it - why didn't I use "< 0"?
            ) {
                context.invitationCode.delete({
                    where: {value: code}
                })
                throw "expired"
            }

            wrapper.reusableTimes > 0 && context.invitationCode.update({
                where: {value: code},
                data: {reusableTimes: wrapper.reusableTimes - 1}
            })

            context.playerInServer.create({
                data: {
                    playerId: req.auth!.id,
                    serverId: wrapper.serverId,
                    isOperator: false
                }
            }) // if already exists it will throw an error - then caught by catch()
        }).catch(_err => res.status(400).end())
    }
)