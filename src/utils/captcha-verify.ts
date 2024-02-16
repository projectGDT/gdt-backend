const siteVerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

export async function verifyResponse(cfTurnstileResponse: string) {
    const siteVerifyData = new FormData()
    siteVerifyData.append("secret", process.env.CAPTCHA_SITE_SECRET as string)
    siteVerifyData.append("response", cfTurnstileResponse)
    try {
        const response = await fetch(siteVerifyUrl, {
            method: "POST",
            body: siteVerifyData
        });
        const json = await response.json();
        return <boolean>json.success;
    } catch (_err) {
        console.log("Cloudflare service is unavailable");
        return true;
    }
    // .catch() as an "emergency brake" in case that the service is unavailable
    // FUCK YOU GFW
}