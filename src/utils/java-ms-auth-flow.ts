// from prismarine-auth
import * as crypto from "crypto";
import {SmartBuffer} from "smart-buffer";

const Endpoints = {
    PCXSTSRelyingParty: 'rp://api.minecraftservices.com/',
    BedrockXSTSRelyingParty: 'https://multiplayer.minecraft.net/',
    XboxAuthRelyingParty: 'http://auth.xboxlive.com/',
    XboxRelyingParty: 'http://xboxlive.com',
    BedrockAuth: 'https://multiplayer.minecraft.net/authentication',
    XboxDeviceAuth: 'https://device.auth.xboxlive.com/device/authenticate',
    XboxTitleAuth: 'https://title.auth.xboxlive.com/title/authenticate',
    XboxUserAuth: 'https://user.auth.xboxlive.com/user/authenticate',
    SisuAuthorize: 'https://sisu.xboxlive.com/authorize',
    XstsAuthorize: 'https://xsts.auth.xboxlive.com/xsts/authorize',
    MinecraftServicesLogWithXbox: 'https://api.minecraftservices.com/authentication/login_with_xbox',
    MinecraftServicesCertificate: 'https://api.minecraftservices.com/player/certificates',
    MinecraftServicesEntitlement: 'https://api.minecraftservices.com/entitlements/mcstore',
    MinecraftServicesProfile: 'https://api.minecraftservices.com/minecraft/profile',
    MinecraftServicesReport: 'https://api.minecraftservices.com/player/report',
    LiveDeviceCodeRequest: 'https://login.live.com/oauth20_connect.srf',
    LiveTokenRequest: 'https://login.live.com/oauth20_token.srf'
}

const minecraftJavaTitle = "00000000402b5328"
const scope = "service::user.auth.xboxlive.com::MBI_SSL"

async function doDeviceCodeAuth() {
    return fetch(Endpoints.LiveDeviceCodeRequest, {
        method: "POST",
        body: new URLSearchParams({
            scope: scope,
            client_id: minecraftJavaTitle,
            response_type: "device_code"
        }).toString(),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        credentials: "include"
    }).then(res => res.json())
}

const alivePeriod = 180 * 1000 // three minutes; the original "expires_in" is 900s (15min)
async function awaitAccessToken(deviceCode: string, interval: number) {
    const expireTime = Date.now() + alivePeriod
    while (Date.now() < expireTime) {
        await new Promise(resolve => setTimeout(resolve,interval * 1000)) // delay {interval} seconds
        const nullOrToken: string | null = await fetch(Endpoints.LiveTokenRequest + '?client_id=' + minecraftJavaTitle, {
            method: "POST",
            body: new URLSearchParams({
                client_id: minecraftJavaTitle,
                device_code: deviceCode,
                grant_type: "urn:ietf:params:oauth:grant-type:device_code"
            }).toString(),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(res => res.json()).then(body => {
            if (body.error) {
                if (body.error !== "authorization_pending")
                    throw "internal-error" // uncaught in this function
                else return null // still waiting
            } else {
                return body["access_token"] as string
            }
        })
        if (nullOrToken) return nullOrToken
    }
    // dang dak ngo fa dou ze liu
    throw "timeout"
}

async function getUserToken(accessToken: string) {
    const body = JSON.stringify({
        RelyingParty: 'http://auth.xboxlive.com',
        TokenType: 'JWT',
        Properties: {
            AuthMethod: 'RPS',
            SiteName: 'user.auth.xboxlive.com',
            RpsTicket: `t=${accessToken}`
        }
    })

    fetch(Endpoints.XboxUserAuth, {
        method: "POST",
        headers: {
            "Signature": sign(Endpoints.XboxUserAuth, "", body).toString("base64"),
            "Content-Type": "application/json",
            "Accept": "application/json",
            "x-xbl-contract-version": "2"
        },
        body
    })
}

async function getXstsToken() {

}

const keyPair = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256'
})

function sign(url: string, authorizationToken: string, payload: any) {
    // Their backend servers use Windows epoch timestamps, account for that. The server is very picky,
    // bad precision or wrong epoch may fail the request.
    const windowsTimestamp = (BigInt((Date.now() / 1000) | 0) + BigInt(11644473600)) * BigInt(10000000)
    // Only the /uri?and-query-string
    const pathAndQuery = new URL(url).pathname

    // Allocate the buffer for signature, TS, path, tokens and payload and NUL termination
    const allocSize = /* sig */ 5 + /* ts */ 9 + /* POST */ 5 + pathAndQuery.length + 1 + authorizationToken.length + 1 + payload.length + 1
    const buf = SmartBuffer.fromSize(allocSize)
    buf.writeInt32BE(1) // Policy Version
    buf.writeUInt8(0)
    buf.writeBigUInt64BE(windowsTimestamp)
    buf.writeUInt8(0) // null term
    buf.writeStringNT('POST')
    buf.writeStringNT(pathAndQuery)
    buf.writeStringNT(authorizationToken)
    buf.writeStringNT(payload)

    // Get the signature from the payload
    const signature = crypto.sign('SHA256', buf.toBuffer(), {
        key: keyPair.privateKey,
        dsaEncoding: 'ieee-p1363'
    })

    const header = SmartBuffer.fromSize(signature.length + 12)
    header.writeInt32BE(1) // Policy Version
    header.writeBigUInt64BE(windowsTimestamp)
    header.writeBuffer(signature) // Add signature at end of header

    return header.toBuffer()
}