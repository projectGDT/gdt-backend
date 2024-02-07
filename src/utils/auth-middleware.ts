import {Express, NextFunction, Response} from "express"
import {jwtSecret} from "../app"
import {expressjwt, Request as JWTRequest} from "express-jwt";
import {Server, Socket} from "socket.io";
const jwt = require("jsonwebtoken")

export function useAuthMiddlewareSocket(app: Express, path: string) {
    app.use(path, expressjwt({
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

export type AuthedSocket = Socket & {
    userInfo: {
        id: number,
        isSiteAdmin: boolean,
        authorizedServer: number[]
    }
}

export function useAuthMiddleware(io: Server, namespace: RegExp) {
    io.of(namespace).use((socket, next) => {
        const token = socket.handshake.auth.token
        jwt.verify(token, jwtSecret, (err: any, res: any) => {
            if (err) {
                socket.disconnect(true)
            } else {
                socket["userInfo"] = res
                next()
            }
        })
    })
}