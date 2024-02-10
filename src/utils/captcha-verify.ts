import * as fs from "fs";
import {dataRoot} from "../app";

const captchaSiteSecret = fs.readFileSync(`${dataRoot}/captcha-site-secret.secret`).toString()
const siteVerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

module.exports = async (cfTurnstileResponse: string): Promise<boolean> => {
    const siteVerifyData = new FormData()
    siteVerifyData.append("secret", captchaSiteSecret)
    siteVerifyData.append("response", cfTurnstileResponse)
    return fetch(siteVerifyUrl, {
        method: "POST",
        body: siteVerifyData
    })
        .then(response => response.json())
        .then(json => json.success)
        .catch(_err => {
            console.log("Cloudflare service is unavailable")
            return true
        })
    // .catch() as an "emergency brake" in case that the service is unavailable
    // FUCK YOU GFW
}