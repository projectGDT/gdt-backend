import {PrismaClient} from "@prisma/client";
import {Server} from "socket.io";
import {useAuthMiddlewareSocket} from "../../../../utils/auth-middleware";
import {MicrosoftAuthFlow} from "../../../../utils/microsoft-auth-flow";

module.exports = (io: Server, prisma: PrismaClient) => {
    useAuthMiddlewareSocket(io, "/post-login/profile/bind/java-microsoft")
    io.of("/post-login/profile/bind/java-microsoft").on("connection", (socket) => {
        const authFlow = new MicrosoftAuthFlow(
            (userCode, verificationUri) => {
                socket.emit("user-code", {userCode, verificationUri})
            },
            err => {
                if (err === "disconnected") return
                socket.emit(err === "timeout" ? err : "internal-error")
                socket.disconnect()
            },
            async (uuid, playerName) => {
                try {
                    await prisma.profile.create({
                        data: {
                            uniqueIdProvider: -1, // Xbox
                            uniqueId: uuid,
                            playerId: socket.userInfo!.id,
                            cachedPlayerName: playerName
                        }
                    })
                    socket.emit("success", {uuid, playerName})
                    socket.disconnect()
                } catch (_err) {
                    socket.emit("already-exists")
                    socket.disconnect()
                }
            }
        )
        socket.on("disconnect", (_reason, _description) => {
            authFlow.stopPending()
        })
    })
}