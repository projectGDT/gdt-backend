import * as fs from "fs";

const captchaSiteSecret = fs.readFileSync(`${__dirname}/captcha-site-secret.secret`).toString()
const siteVerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

module.exports = async (cfTurnstileResponse: string): Promise<boolean> => {
    const siteVerifyData = new FormData()
    siteVerifyData.append("secret", captchaSiteSecret)
    siteVerifyData.append("response", cfTurnstileResponse)
    return fetch(siteVerifyUrl, {
        method: "POST",
        body: siteVerifyData
    }).then(response => response.json()).then(json => json.success)
}