import * as express from "express"
const app = express()
const port = 14590 // for tests

import * as cors from "cors"

import {PrismaClient} from "@prisma/client"
const prisma = new PrismaClient()

import {randomBytes} from "node:crypto"
export const jwtSecret = randomBytes(256)

global.appRoot = __dirname

app.use(cors({
    origin: "http://localhost:3000", // for tests
    credentials: true
}))

app.use(express.json())

require("./http/register/check-qid")(app, prisma)
require("./http/register/check-username")(app, prisma)
require("./http/register/submit")(app, prisma)

require("./http/login")(app, prisma)

require("./http/post-login/use-middleware")(app)

require("./http/post-login/profile/bind/java-microsoft")(app, prisma)
require("./http/post-login/profile/bind/xbox")(app, prisma)

app.listen(port, () => {
    console.log(`Start Listening on port ${port}`)
})