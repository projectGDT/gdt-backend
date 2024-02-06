import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {Request} from "express-jwt"

module.exports = (app: Express, prisma: PrismaClient) => app.get("/post-login/people/shared-servers/:id", async (req: Request, res) => {
    let a = req.auth.id, b: number
    try {
        b = parseInt(req.params.id)
    } catch (_err) {
        res.status(404).end()
    }

    prisma.server.findMany({
        where: {
            AND: [
                {
                    players: {
                        some: {
                            playerId: a
                        }
                    }
                },
                {
                    players: {
                        some: {
                            playerId: b
                        }
                    }
                }
            ]
        }
    }).then(result => result.map(entry => ({
        id: entry.id,
        name: entry.name
    }))).then(res.json)
})