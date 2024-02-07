import {PrismaClient} from "@prisma/client";
import {Authflow, Titles} from "prismarine-auth";
import {clearTimeout} from "node:timers";
import {PrismaClientKnownRequestError} from "@prisma/client/runtime/library";
import {Server} from "socket.io";
import {AuthedSocket} from "../../../../utils/auth-middleware";

class EmptyCache {
    async getCached () {}
    async setCached (_value: any) {}
    async setCachedPartial (_value: any) {}
}

function emptyCacheFactory(_object: any) {
    return new EmptyCache()
}

const sessionLifetime = 300 * 1000 // five minutes

module.exports = (io: Server, prisma: PrismaClient) => io.of("/post-login/profile/bind/java-microsoft").on("connection", (socket: AuthedSocket) => {
    let codeWritten = false

    const authFlow = new Authflow(
        undefined,
        emptyCacheFactory, // we do not need to store any personal information
        {
            flow: "sisu",
            authTitle: Titles.MinecraftJava,
            deviceType: "Win32" // for MinecraftJava
        },
        codeResponse => {
            if (!codeWritten) {
                socket.emit("user-code", {
                    userCode: codeResponse.user_code,
                    verificationUri: codeResponse.verification_uri
                })
                codeWritten = true
            }
        }
        // retried 2 times (done 3 times in total)
        // but we do not want the code to be written twice
    )

    let timeoutRef: NodeJS.Timeout

    Promise.race([
        authFlow.getMinecraftJavaToken({
            fetchProfile: true
        }).then(tokenResponse => {
            const idStr = tokenResponse.profile.id
            return {
                uuid: `${idStr.slice(0, 8)}-${idStr.slice(8, 12)}-${idStr.slice(12, 16)}-${idStr.slice(16, 20)}-${idStr.slice(20, /* towards the end */)}`,
                playerName: tokenResponse.profile.name
            }
        }).catch(_err => Promise.reject(new Error("internal-error"))),
        new Promise<{ success: boolean, reason: string }>((_resolve, reject) => {
            timeoutRef = setTimeout(() => reject(new Error("timeout")), sessionLifetime)
            // the original lifetime, 900 seconds, is too long
        })
    ]).then(result => {
        clearTimeout(timeoutRef)
        const {uuid, playerName} = <{
            success: boolean
            uuid: string,
            playerName: string
        }>result
        return prisma.profile.create({
            data: {
                uniqueIdProvider: -1, // Java Microsoft
                uniqueId: uuid,
                playerId: socket.userInfo.id,
                cachedPlayerName: playerName
            }
        })
    }).then(
        profile => ({
            success: true,
            uuid: profile.uniqueId,
            playerName: profile.cachedPlayerName
        })
    ).catch(err => (err instanceof PrismaClientKnownRequestError && err.code === "P2003") ? ({
        success: false,
        reason: "already-exists"
    }) : ({
        success: false,
        reason: (<Error>err).message
    })).then(payload => {
        socket.emit(payload.success ? "bind-successful" : "bind-failed", payload)
        socket.disconnect()
    })
})