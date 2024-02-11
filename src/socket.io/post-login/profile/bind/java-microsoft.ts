import {PrismaClient} from "@prisma/client";
import {Authflow, Titles} from "prismarine-auth";
import {clearTimeout} from "node:timers";
import {Server} from "socket.io";
import {useAuthMiddlewareSocket} from "../../../../utils/auth-middleware";

// a minimum cache storage, code from prismarine-auth/docs/API.md

class InMemoryCache {
    private cache = {}
    async getCached () {
        return this.cache
    }
    async setCached (value: any) {
        this.cache = value
    }
    async setCachedPartial (value: any) {
        this.cache = {
            ...this.cache,
            ...value
        }
    }
}

function inMemoryCacheFactory (_param: any) {
    return new InMemoryCache()
}

const sessionLifetime = 300 * 1000 // five minutes

module.exports = (io: Server, prisma: PrismaClient) =>{
    useAuthMiddlewareSocket(io, "/post-login/profile/bind/java-microsoft")

    io.of("/post-login/profile/bind/java-microsoft").on("connection", (socket) => {
        const authedSocket = socket

        let codeWritten = false

        const authFlow = new Authflow(
            "", // left for device code
            inMemoryCacheFactory, // we do not need to store any personal information
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
            }).catch(_err => Promise.reject("internal-error")),
            new Promise((_resolve, reject) => {
                timeoutRef = setTimeout(() => reject("timeout"), sessionLifetime)
                // the original lifetime, 900 seconds, is too long
            })
        ]).then(async result => {
            clearTimeout(timeoutRef)
            const {uuid, playerName} = <{
                success: boolean
                uuid: string,
                playerName: string
            }>result
            try {
                return await prisma.profile.create({
                    data: {
                        uniqueIdProvider: -1, // Java Microsoft
                        uniqueId: uuid,
                        playerId: authedSocket.userInfo.id,
                        cachedPlayerName: playerName
                    }
                });
            } catch (_err) {
                throw "already-exists";
            }
        }).then(profile => {
            socket.emit("success", {
                success: true,
                uuid: profile.uniqueId,
                playerName: profile.cachedPlayerName
            })
            socket.disconnect()
        }).catch((errorType: "internal-error" | "timeout" | "already-exists") => {
            if (!(errorType === "timeout"))
                clearTimeout(timeoutRef)
            socket.emit(errorType)
            socket.disconnect()
        })
    })
}