import crypto from "crypto"

const iterations = 1000
const keyLength = 64
const digestAlgorithm = "sha512"

export function digest(secret: string) {
    return crypto.pbkdf2Sync(secret, process.env.PBKDF2_SALT as string, iterations, keyLength, digestAlgorithm)
}

export function matches(secret: string, digested: Buffer) {
    return digest(secret).equals(digested)
}