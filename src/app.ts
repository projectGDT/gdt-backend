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

require("./register/check-qid")(app, prisma)
require("./register/check-username")(app, prisma)
require("./register/submit")(app, prisma)

require("./login")(app, prisma)

require("./post-login/use-middleware")(app)

require("./post-login/profile/bind/java-microsoft")(app, prisma)
require("./post-login/profile/bind/xbox")(app, prisma)

app.listen(port, () => {
    console.log(`Start Listening on port ${port}`)
})