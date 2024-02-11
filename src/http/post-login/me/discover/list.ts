import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {Request} from "express-jwt";
import {Engine, integer, MersenneTwister19937} from "random-js";

function stringHash(string: string) {
    let hash = 0, chr: number
    if (string.length === 0) return hash;
    for (let i = 0; i < string.length; i++) {
        chr = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function shuffle<T>(array: T[], engine: Engine) {
    let currentIndex = array.length, randomIndex: number;
    while (currentIndex > 0) {
        randomIndex = integer(0, currentIndex - 1)(engine);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

module.exports = (app: Express, prisma: PrismaClient) => app.get("/post-login/me/discover/list", async (req: Request, res) => {
    const mt = MersenneTwister19937.seed(stringHash(req.header("Authorization")!))
    prisma.server.findMany({
        where: {
            players: {
                none: {
                    playerId: req.auth?.id
                }
            }
        }
    })
        .then(result => result.map(entry => entry.id))
        .then(result => shuffle(result, mt)) // TODO: recommendation
        .then(result => res.json(result))
})