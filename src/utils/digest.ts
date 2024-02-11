import crypto from "crypto"
import fs from "node:fs"
import {dataRoot} from "../app";

const salt = fs.readFileSync(`${dataRoot}/salt.secret`).toString()
const iterations = 1000
const keyLength = 64
const digestAlgorithm = "sha512"

export function digest(secret: string) {
    return crypto.pbkdf2Sync(secret, salt, iterations, keyLength, digestAlgorithm)
}

export function matches(secret: string, digested: Buffer) {
    return digest(secret).equals(digested)
}