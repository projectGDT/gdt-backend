import {Express} from "express";
import {PrismaClient} from "@prisma/client";
import {Request} from "express-jwt";
import {Authflow, Titles} from "prismarine-auth";
import {clearTimeout} from "node:timers";

class EmptyCache {
    async getCached () {}
    async setCached (_value: any) {}
    async setCachedPartial (_value: any) {}
}

function emptyCacheFactory(_object: any) {
    return new EmptyCache()
}

const sessionLifetime = 300 * 1000

module.exports = (app: Express, prisma: PrismaClient) => app.get("/post-login/profile/bind/java-microsoft", async (req: Request, res) => {
    res.writeHead(200, {
        "Connection": "keep-alive",
        "Cache-Control": "no-cache",
        "Content-Type": "text/event-stream" // this indicates a Server-Side Event connection
    })

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
                res.write(`data: ${JSON.stringify({
                    userCode: codeResponse.user_code,
                    verificationUri: codeResponse.verification_uri
                })}\n\n`) // \n\n indicates that a data chunk ends
                codeWritten = true
            }
        }
        // retried 2 times (done 3 times in total)
        // but we do not want the code to be written twice
    )

    let timeoutRef: NodeJS.Timeout

    const result = await Promise.race([
        authFlow.getMinecraftJavaToken({
            fetchProfile: true
        }).then(tokenResponse => {
            const idStr = tokenResponse.profile.id
            return {
                success: true,
                uuid: `${idStr.slice(0, 8)}-${idStr.slice(8, 12)}-${idStr.slice(12, 16)}-${idStr.slice(16, 20)}-${idStr.slice(20, /* towards the end */)}`,
                playerName: tokenResponse.profile.name
            }
        }).catch(_err => {
            return {
                success: false,
                reason: "internal-error"
            }
        }),
        new Promise<{ success: boolean, reason: string }>((resolve, _reject) => {
            timeoutRef = setTimeout(() => {
                resolve({
                    success: false,
                    reason: "timeout"
                })
            }, sessionLifetime)
        })
    ])
    // the original lifetime, 900 seconds, is too long

    if (result.success) {
        clearTimeout(timeoutRef)
        const {uuid, playerName} = <{
            success: boolean
            uuid: string,
            playerName: string
        }>result
        await prisma.profile.create({
            data: {
                uniqueIdProvider: -1, // Java Microsoft
                uniqueId: uuid,
                playerId: req.auth.id,
                cachedPlayerName: playerName
            }
        })
    }

    res.write(`data: ${JSON.stringify(result)}`)
    res.end()
})