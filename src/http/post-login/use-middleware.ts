import {Express, NextFunction, Response} from "express"
import {jwtSecret} from "../../app"
import {expressjwt, Request as JWTRequest} from "express-jwt";

module.exports = (app: Express) => {
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