import crypto = require("crypto")
import fs = require("node:fs")

const salt = fs.readFileSync("./security/salt.secret").toString()
const iterations = 1000
const keyLength = 64
const digestAlgorithm = "sha512"

export function digestToBase64(secret: string) {
    return crypto.pbkdf2Sync(secret, salt, iterations, keyLength, digestAlgorithm).toString("base64")
}

export function validateFromBase64(secret: string, digested: string) {
    return digestToBase64(secret) === digested
}