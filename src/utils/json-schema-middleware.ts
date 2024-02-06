import {Schema, validator} from "@exodus/schemasafe";
import {Request, NextFunction, Response} from "express";
import * as WebSocket from "ws"

export function jsonValidate(
    schema: Schema,
    errorAction = (res: Response) => res.status(400).end()
): (req: Request, res: Response, next: NextFunction) => void {
    const jsonValidator = validator(schema)
    return (req, res, next) => {
        if (!jsonValidator(req.body))
            errorAction(res)
        else next()
    }
}

export function jsonValidateWs(
    schema: Schema,
    errorAction = (ws: WebSocket) => ws.close(400)
): (ws: WebSocket, req: Request, next: NextFunction) => void {
    const jsonValidator = validator(schema)
    return (ws, req, next) => {
        if (!jsonValidator(req.body))
            errorAction(ws)
        else next()
    }
}