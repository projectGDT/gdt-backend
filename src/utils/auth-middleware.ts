import {Express, NextFunction, Response} from "express"
import {jwtSecret} from "../app"
import {expressjwt, Request as JWTRequest} from "express-jwt";
import {Server, Socket} from "socket.io";
const jwt = require("jsonwebtoken")

export function useAuthMiddleware(app: Express) {
    app.use("/post-login", expressjwt({
        secret: jwtSecret,
        algorithms: ["HS256"]
    }), (err: any, req: JWTRequest, res: Response, next: NextFunction) => {
        if (err.name === "UnauthorizedError") {
            res.status(401).end()
            return
        }
        next()
    })
}

export function useManageAuthMiddleware(app: Express) {
    app.use("/post-login/manage/:id", (req, res, next) => {
        const reqWithJwt = req as JWTRequest
        let serverId: number
        try {
            serverId = parseInt(req.params.id)
        } catch (_err) {
            res.status(400).end()
            return
        }
        if (!(reqWithJwt.auth!.authorizedServers as number[]).includes(serverId)) {
            res.status(401).end()
            return
        }
        next()
    })
}

declare module 'socket.io' {
    interface Socket {
        userInfo: {
            id: number,
            authorizedServer: number[]
        }
    }
}

export function useAuthMiddlewareSocket(io: Server, namespace: string) {
    io.of(namespace).use((socket, next) => {
        const token = socket.handshake.auth.token
        jwt.verify(token, jwtSecret, (err: any, res: any) => {
            if (err) {
                socket.disconnect(true)
            } else {
                socket.userInfo = res
                next()
            }
        })
    })
}