import {createServer} from "node:http";
import {Server} from "socket.io";
import express from "express";
import cors from "cors";

import {PrismaClient} from "@prisma/client"
import {randomBytes} from "node:crypto"
import {useAuthMiddleware, useManageAuthMiddleware} from "./utils/auth-middleware";

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
const prisma = new PrismaClient()

export const jwtSecret = randomBytes(256)

app.use(cors({
    origin: process.env.FRONTEND_ORIGIN, // for tests
    credentials: true
}))

app.use(express.json())

require("./http/register/check-qid")(app, prisma)
require("./http/register/check-username")(app, prisma)
require("./socket.io/register/submit")(io, prisma)
require("./utils/email-verify")

require("./http/login")(app, prisma)

require("./http/server-meta")(app, prisma)

useAuthMiddleware(app)

require("./http/post-login/profile/fetch")(app, prisma)
require("./http/post-login/profile/delete")(app, prisma)
require("./socket.io/post-login/profile/bind/java-microsoft")(io, prisma)
require("./http/post-login/profile/bind/xbox")(app, prisma)

require("./http/post-login/me/servers")(app, prisma)
require("./http/post-login/me/unhandled-count")(app, prisma)
require("./http/post-login/me/read-rejected")(app, prisma)
require("./http/post-login/me/discover/list")(app, prisma)
require("./http/post-login/me/discover/query")(app, prisma)

require("./http/post-login/people/server-players")(app, prisma)
require("./http/post-login/people/shared-servers")(app, prisma)

require("./http/post-login/access/submit")(app, prisma)
require("./http/post-login/access/fetch")(app, prisma)

require("./http/post-login/apply/get-form/by-id")(app, prisma)
require("./http/post-login/apply/get-form/by-server")(app, prisma)
require("./http/post-login/apply/submit")(app, prisma)
require("./http/post-login/apply/fetch-submitted")(app, prisma)
require("./http/post-login/apply/join-by-code")(app, prisma)
require("./http/post-login/apply/leave")(app, prisma)

useManageAuthMiddleware(app)
require("./http/post-login/manage/apply/fetch-received")(app, prisma)

require("./socket.io/plugin")(io, prisma)

httpServer.listen(port, process.env.IP ?? "0.0.0.0", () => {
    console.log(`Start Listening on port ${port}`)
})