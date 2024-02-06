// cf worker回调函数
import { Express } from "express";
import { unverifiedPasskeysCallback } from "../../ws/register/submit";

module.exports = (app: Express) => app.get("/register/worker-callback", async (req, res) => {
    const passkey = req.query.passkey;
    if (!passkey) {
        res.status(400).end();
        return;
    }
    const callback = unverifiedPasskeysCallback.get(passkey);
    if (!callback) {
        res.status(400).end();
        return;
    }
    callback();
    res.status(200).end();
});