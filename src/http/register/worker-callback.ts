// cf worker回调函数
import { Express } from "express";
import { unverifiedPasskeysCallback } from "../../socket.io/register/submit";
import {jsonValidate} from "../../utils/json-schema-middleware";
import {readFileSync} from "node:fs";
import {dataRoot} from "../../app";

const _clientSecret = readFileSync(`${dataRoot}/client-secret.secret`)

module.exports = (app: Express) => app.post(
    "/register/worker-callback",
    jsonValidate({
        type: "object",
        properties: {
            clientSecret: {type: "string", },
            qid: {type: "integer"},
            passkey: {type: "string"}
        },
        required: ["clientSecret", "qid", "passkey"]
    }),
    (req, res) => {
        const {clientSecret, qid, passkey} = req.body
        if (clientSecret !== _clientSecret) {
            res.status(401).end()
        }
        unverifiedPasskeysCallback.get({
            qid: qid,
            passkey: passkey
        })?.callback()
        res.status(200).end()
    }
)