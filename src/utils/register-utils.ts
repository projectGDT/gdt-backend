import {PrismaClient} from "@prisma/client";

export async function usernameExists(username: string, prisma: PrismaClient) {
    return prisma.player.findUnique({
        where: {username}
    }).then(result => result != null)
}

export async function qidExists(qid: number, prisma: PrismaClient) {
    return prisma.player.findUnique({
        where: {qid}
    }).then(result => result != null)
}