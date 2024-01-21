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
require("./security/register")(rootRouter, prisma)
require("./security/login")(rootRouter, prisma)

const postLoginRouter = express.Router()
postLoginRouter.use(authBearerParser())
require("./security/middleware")(postLoginRouter)

app.listen(port, () => {
    console.log(`Start Listening on port ${port}`)
})