import {Router} from "express"
import jwt = require("jsonwebtoken")
import {jwtSecret} from "../app"
import {JwtPayload} from "jsonwebtoken";

module.exports = (router: Router) => router.use("/post-login", (req, res, next) => {
    jwt.verify(req.token, jwtSecret, (error, decoded: JwtPayload) => {
        if (error) {
            res.status(401).end()
            return
        }
        res.locals.id = decoded["id"] as number
        res.locals.isSiteAdmin = decoded["isSiteAdmin"] as boolean
        res.locals.authorizedServers = decoded["authorizedServers"]
        next()
    })
})