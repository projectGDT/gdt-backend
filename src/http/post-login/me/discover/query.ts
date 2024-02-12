import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {Request} from "express-jwt";
import {jsonValidate} from "../../../../utils/json-schema-middleware";

module.exports = (app: Express, prisma: PrismaClient) => app.post(
    "/post-login/me/discover/query",
    jsonValidate({
        type: "array",
        items: {
            type: "number"
        },
        uniqueItems: true,
        maxItems: 10
    }),
    async (req: Request, res) => {
        const includeRemote = Boolean(req.query.includeRemote)
        const body = <number[]>req.body

        prisma.server.findMany({
            where: {
                id: {
                    in: body
                }
            },
            include: {
                javaRemote: true,
                bedrockRemote: true
            }
        }).then(result => result.map(server => ({
            id: server.id,
            name: server.name,
            logoLink: server.logoLink,
            coverLink: server.coverLink,
            ...includeRemote ? {
                ...server.javaRemote ? {
                    javaRemote: {
                        address: server.javaRemote.address,
                        port: server.javaRemote.port
                    }
                } : {},
                ...server.bedrockRemote ? {
                    bedrockRemote: {
                        address: server.bedrockRemote.address,
                        port: server.bedrockRemote.port
                    }
                } : {}
            } : {},
            applyingPolicy: server.applyingPolicy
        }))).then(result => result.sort(
            (a, b) => body.indexOf(a.id) - body.indexOf(b.id) )
        ).then(body => res.json(body))
    }
)