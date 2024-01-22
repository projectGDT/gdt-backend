import express = require("express")
const app = express()
const port = 14590 // for tests

import cors = require("cors")

import {PrismaClient} from "@prisma/client"
const prisma = new PrismaClient()

import {randomBytes} from "node:crypto"
import authBearerParser from "auth-bearer-parser"
export const jwtSecret = randomBytes(256)

global.appRoot = __dirname

app.use(cors({
    origin: "http://localhost:3000", // for tests
    credentials: true
}))

app.use(express.json())

const rootRouter = express.Router()

require("./register/check-qid")(rootRouter, prisma)
require("./register/check-username")(rootRouter, prisma)
require("./register/submit")(rootRouter, prisma)

require("./login")(rootRouter, prisma)

const postLoginRouter = express.Router()
postLoginRouter.use(authBearerParser())
require("./utils/middleware")(postLoginRouter)

rootRouter.use("/post-login", postLoginRouter)
app.use(rootRouter)

app.listen(port, () => {
    console.log(`Start Listening on port ${port}`)
})