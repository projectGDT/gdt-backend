const express = require("express");
const app = express();
const expressWs = require("express-ws")(app);
const port = 14590 // for tests

const cors = require("cors");

import {PrismaClient} from "@prisma/client"
const prisma = new PrismaClient()

import {randomBytes} from "node:crypto"
export const jwtSecret = randomBytes(256)

import {GDTEventEmitter} from "./event-base"
export const emitter = new GDTEventEmitter()

export const appRoot = `${__dirname}/..`
export const dataRoot = `${appRoot}/data`

app.use(cors({
    origin: "http://localhost:3000", // for tests
    credentials: true
}))

app.use(express.json())

require("./http/register/check-qid")(app, prisma)
require("./http/register/check-username")(app, prisma)
require("./ws/register/submit")(app, prisma)
require("./http/register/confirm")(app)

require("./http/login")(app, prisma)

require("./http/server-meta/full")(app, prisma)

require("./utils/auth-middleware")(app)

require("./http/post-login/profile/fetch")(app, prisma)
require("./http/post-login/profile/delete")(app, prisma)
require("./http/post-login/profile/bind/java-microsoft")(app, prisma)
require("./http/post-login/profile/bind/xbox")(app, prisma)

require("./http/post-login/me/servers")(app, prisma)
require("./http/post-login/me/discover/list")(app, prisma)
require("./http/post-login/me/discover/query")(app, prisma)

require("./http/post-login/people/server-players")(app, prisma)
require("./http/post-login/people/shared-servers")(app, prisma)

app.listen(port, () => {
    console.log(`Start Listening on port ${port}`)
})