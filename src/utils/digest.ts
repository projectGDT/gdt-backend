import crypto = require("crypto")
import fs = require("node:fs")

const salt = fs.readFileSync(`${__dirname}/salt.secret`).toString()
const iterations = 1000
const keyLength = 64
const digestAlgorithm = "sha512"

export function digest(secret: string) {
    return crypto.pbkdf2Sync(secret, salt, iterations, keyLength, digestAlgorithm)
}

export function matches(secret: string, digested: Buffer) {
    return digest(secret).equals(digested)
}