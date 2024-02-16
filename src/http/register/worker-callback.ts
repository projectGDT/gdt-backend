import {Express} from "express";
import {jsonValidate} from "../../utils/json-schema-middleware";
import {preRegistries} from "../../socket.io/register/submit";

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
        if (clientSecret !== process.env.CLIENT_SECRET) {
            res.status(401).end()
        }
        preRegistries.emit(`${qid}.${passkey}`, true)
        res.status(204).end()
        // although status code makes no sense...
    }
)