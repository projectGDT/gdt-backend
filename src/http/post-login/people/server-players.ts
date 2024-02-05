import {Express} from "express";
import {PrismaClient} from "@prisma/client";

module.exports = (app: Express, prisma: PrismaClient) => app.post("/post-login/people/server-players/:id", async (req, res) => {
    let uniqueIdProviders: number[]
    try {
        uniqueIdProviders = await prisma.server.findUniqueOrThrow({
            where: {
                id: parseInt(req.params.id)
            },
            include: {
                javaRemote: true,
                bedrockRemote: true
            }
        }).then(result => [
            ...result.javaRemote ? [result.javaRemote.uniqueIdProvider] : [],
            ...result.bedrockRemote ? [-3] : []
        ])
    } catch (_err) {
        res.status(404).end()
        return
    }

    prisma.playerInServer.findMany({
        where: {
            serverId: parseInt(req.params.id)
        },
        include: {
            player: {
                include: {
                    profiles: true
                }
            }
        }
    }).then(
        result => result.map(entry => entry.player)
    ).then(
        result => {
            result.forEach(
                entry => entry.profiles = entry.profiles.filter(
                    entry => uniqueIdProviders.includes(entry.uniqueIdProvider)
                )
            )
            return result
        }
    ).then(res.json)
})