import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {Request} from "express-jwt";

module.exports = (app: Express, prisma: PrismaClient) => app.get("/post-login/me/servers", async (req: Request, res) => {
    const includeRemote = Boolean(req.query.includeRemote)

    prisma.playerInServer.findMany({
        where: {
            playerId: req.auth!.id
        },
        include: {
            server: {
                include: {
                    javaRemote: includeRemote,
                    bedrockRemote: includeRemote
                }
            }
        }
    }).then(result => result
        .map(({server, isOperator}) => ({
            server: ((
                {
                    id,
                    name,
                    logoLink,
                    applyingPolicy,
                    javaRemote,
                    bedrockRemote
                }) => ({
                    id, name, logoLink, applyingPolicy,
                    ...includeRemote ? {
                        ...javaRemote ? {
                            javaRemote: {
                                address: javaRemote.address,
                                port: javaRemote.port
                            }
                        } : {},
                        ...bedrockRemote ? {
                            bedrockRemote: {
                                address: bedrockRemote.address,
                                port: bedrockRemote.port
                            }
                        } : {}
                    } : {}
                }))(server),
            isOperator
        }))
    ).then(body => {
        res.json(body)
    })
})