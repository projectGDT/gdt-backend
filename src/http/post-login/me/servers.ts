import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {Request} from "express-jwt";

module.exports = (app: Express, prisma: PrismaClient) => app.get("/post-login/me/servers", async (req: Request, res) => {
    prisma.playerInServer.findMany({
        where: {
            playerId: req.auth.id
        },
        include: {
            server: {
                include: {
                    javaRemote: true,
                    bedrockRemote: true
                }
            }
        }
    }).then(result => result.map(
        ({server, isOperator}) => ({
            server: {
                id: server.id,
                name: server.name,
                logoLink: server.logoLink,
                javaRemote: {
                    address: server.javaRemote.address,
                    port: server.javaRemote.port
                },
                bedrockRemote: {
                    address: server.bedrockRemote.address,
                    port: server.bedrockRemote.port
                },
                applyingPolicy: server.applyingPolicy
            },
            isOperator: isOperator
        })
    )).then(result => res.json(result))
})