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
    }).then(result => result.map(
        ({server}) => ({
            id: server.id,
            name: server.name,
            logoLink: server.logoLink,
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
        })
    )).then(res.json)
})