import {createServer} from "node:http";
import {Server} from "socket.io";
import express from "express";

const app = express() // add socket.io support
const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_ORIGIN, // for tests
        methods: ["GET", "POST"],
        credentials: true
    }
});
const port = parseInt(process.env.PORT ?? "14590")

import cors from "cors";

import {PrismaClient} from "@prisma/client"
const prisma = new PrismaClient()

import {randomBytes} from "node:crypto"
export const jwtSecret = randomBytes(256)

import {GDTEventEmitter} from "./event-base"
import {useAuthMiddleware} from "./utils/auth-middleware";
export const emitter = new GDTEventEmitter()

app.use(cors({
    origin: process.env.FRONTEND_ORIGIN, // for tests
    credentials: true
}))

app.use(express.json())

require("./http/register/check-qid")(app, prisma)
require("./http/register/check-username")(app, prisma)
require("./socket.io/register/submit")(io, prisma)
require("./http/register/worker-callback")(app)

require("./http/login")(app, prisma)

require("./http/server-meta")(app, prisma)

useAuthMiddleware(app, "/post-login")

require("./http/post-login/profile/fetch")(app, prisma)
require("./http/post-login/profile/delete")(app, prisma)
require("./socket.io/post-login/profile/bind/java-microsoft")(io, prisma)
require("./http/post-login/profile/bind/xbox")(app, prisma)

require("./http/post-login/me/servers")(app, prisma)
require("./http/post-login/me/discover/list")(app, prisma)
require("./http/post-login/me/discover/query")(app, prisma)

require("./http/post-login/people/server-players")(app, prisma)
require("./http/post-login/people/shared-servers")(app, prisma)

httpServer.listen(port, process.env.IP ?? "0.0.0.0", () => {
    console.log(`Start Listening on port ${port}`)
})