import {Schema, validator} from "@exodus/schemasafe";
import {Request, NextFunction, Response} from "express";

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