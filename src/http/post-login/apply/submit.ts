import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {jsonValidate} from "../../../utils/json-schema-middleware";
import {Request} from "express-jwt";
import {Validate, validator} from "@exodus/schemasafe";
import {Form, generateAnswerSchema} from "../../../utils/form-validate";

const map = new Map<{
    serverId: number, formId: string
}, Validate>()

async function loadAnswerValidator(prisma: PrismaClient, serverId: number, formId: string) {
    const fetchCache = map.get({serverId, formId})
    if (fetchCache) return fetchCache

    // else
    const wrapper = await prisma.serverForm.findUnique({
        where: {
            uuid: formId
        }
    })
    if (!wrapper || wrapper.serverId !== serverId) return undefined
    const generated = validator(generateAnswerSchema(wrapper.body as unknown as Form))
    map.set({serverId, formId}, generated)
    return generated
}

module.exports = (app: Express, prisma: PrismaClient) => app.post(
    "/post-login/apply/submit",
    jsonValidate({
        type: "object",
        properties: {
            id: {type: "integer"},
            formId: {type: "string", pattern: "^[0-9a-fA-F]{8}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{12}$"},
            payload: {type: "array"}
        },
        required: ["id", "formId", "payload"]
    }),
    async (req: Request, res) => {
        const {id: serverId, formId, payload} = req.body
        const answerValidator = await loadAnswerValidator(prisma, serverId, formId)
        if (!answerValidator || !answerValidator(payload)) {
            res.status(400).end()
            return
        }
        prisma.server.findUnique({
            where: {
                id: serverId
            },
            include: {
                javaRemote: true,
                bedrockRemote: true
            }
        }).then(
            result => result ?? Promise.reject()
        ).then(({javaRemote, bedrockRemote}) => prisma.profile.findFirst({
            where: {
                playerId: req.auth!.id,
                uniqueIdProvider: {
                    in: [
                        ...javaRemote ? [javaRemote.uniqueIdProvider] : [],
                        ...bedrockRemote ? [-3 /* Xbox */] : []
                    ]
                }
            }
        })).then(
            result => result !== null
        ).then(isPresent => prisma.applyingSession.create({
            data: {
                playerId: req.auth!.id,
                serverId, payload,
                profileActivated: isPresent
            }
        })).then(
            _result => res.status(204).end()
        ).catch(
            _err => res.status(400).end()
        )
    }
)