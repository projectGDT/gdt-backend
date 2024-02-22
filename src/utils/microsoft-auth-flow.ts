// from prismarine-auth
import * as crypto from "crypto";
import {SmartBuffer} from "smart-buffer";
import {randomUUID} from "node:crypto";
import {exportJWK, JWK} from "jose";

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

export class MicrosoftAuthFlow {
    private keyPair: crypto.KeyPairKeyObjectResult
    private jwk: (JWK & { alg: string; use: string; }) | undefined
    private readonly alivePeriod: number
    private pending: boolean = true

    constructor(
        codeCallback: (userCode: string, verificationUri: string) => void | Promise<void>,
        errCallback: (err: any) => void,
        javaProfileCallBack: (uuid: string, playerName: string) => void | Promise<void>,
        alivePeriodInSecond?: number
    ) {
        this.keyPair = crypto.generateKeyPairSync('ec', {
            namedCurve: 'P-256'
        })
        this.alivePeriod = alivePeriodInSecond ? (
            alivePeriodInSecond > 900 ? 900 : alivePeriodInSecond
        ) * 1000 : 180 * 1000
        exportJWK(this.keyPair.publicKey).then(jwk => ({
            ...jwk,
            alg: 'ES256',
            use: 'sig'
        })).then(async result => {
            this.jwk = result
            const deviceCodeInit = await this.doDeviceCodeAuth()
            codeCallback(deviceCodeInit.user_code, deviceCodeInit.verification_uri)
            const msaToken = await this.awaitAccessToken(deviceCodeInit.device_code, 5)
            const deviceToken = await this.getDeviceToken()
            const xstsTokenResp = await this.doSisuAuth(msaToken, deviceToken)
            const mcaToken = await this.getMinecraftAccessToken(xstsTokenResp.Token,xstsTokenResp.DisplayClaims.xui[0].uhs)
            const profile = await this.getProfile(mcaToken)
            javaProfileCallBack(addMinus(profile.id), profile.name)
        }).catch(errCallback)
    }

    stopPending() {
        this.pending = false
    }

    private async doDeviceCodeAuth() {
        return await fetch(Endpoints.LiveDeviceCodeRequest, {
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

    private async awaitAccessToken(deviceCode: string, interval: number) {
        const expireTime = Date.now() + this.alivePeriod
        while (Date.now() < expireTime && this.pending) {
            await new Promise(resolve => setTimeout(resolve, interval * 1000)) // delay {interval} seconds
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
                    return body.access_token as string
                }
            })
            if (nullOrToken) return nullOrToken
        }
        // dang dak ngo fa dou ze liu
        throw this.pending ? "timeout" : "disconnected"
    }

    private async getDeviceToken() {
        const body = JSON.stringify({
            Properties: {
                AuthMethod: 'ProofOfPossession',
                Id: `{${randomUUID()}}`,
                DeviceType: 'Win32',
                SerialNumber: `{${randomUUID()}}`,
                Version: '0.0.0',
                ProofKey: this.jwk
            },
            RelyingParty: 'http://auth.xboxlive.com',
            TokenType: 'JWT'
        })

        return await fetch(Endpoints.XboxDeviceAuth, {
            method: "POST",
            headers: {
                "Cache-Control": "no-store, must-revalidate, no-cache",
                "Signature": this.sign(Endpoints.XboxDeviceAuth, "", body).toString("base64"),
                "Content-Type": "application/json",
                "Accept": "application/json",
                "x-xbl-contract-version": "1"
            },
            body
        }).then(res => res.json()).then(body => body.Token)
    }

    private async doSisuAuth(accessToken: string, deviceToken: string) {
        const body = JSON.stringify({
            AccessToken: `t=${accessToken}`,
            AppId: minecraftJavaTitle,
            DeviceToken: deviceToken,
            Sandbox: 'RETAIL',
            UseModernGamertag: false,
            SiteName: 'user.auth.xboxlive.com',
            RelyingParty: Endpoints.PCXSTSRelyingParty,
            ProofKey: this.jwk
        })

        return await fetch(Endpoints.SisuAuthorize, {
            method: "POST",
            headers: {
                "Signature": this.sign(Endpoints.SisuAuthorize, '', body).toString('base64')
            },
            body
        }).then(res => res.json()).then(body => body.AuthorizationToken)
    }

    private async getMinecraftAccessToken(xstsToken: string, userHash: string) {
        return await fetch(Endpoints.MinecraftServicesLogWithXbox, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'MinecraftLauncher/2.2.10675'
            },
            body: JSON.stringify({
                identityToken: `XBL3.0 x=${userHash};${xstsToken}`
            })
        }).then(res => res.json()).then(body => body.access_token)
    }

    private async getProfile(minecraftAccessToken: string) {
        return await fetch(Endpoints.MinecraftServicesProfile, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${minecraftAccessToken}`,
                "Accept": "application/json"
            }
        }).then(res => res.json())
    }

    sign(url: string, authorizationToken: string, payload: any) {
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
            key: this.keyPair.privateKey,
            dsaEncoding: 'ieee-p1363'
        })

        const header = SmartBuffer.fromSize(signature.length + 12)
        header.writeInt32BE(1) // Policy Version
        header.writeBigUInt64BE(windowsTimestamp)
        header.writeBuffer(signature) // Add signature at end of header

        return header.toBuffer()
    }
}

// 阿米诺斯
function addMinus(uuid: string) {
    return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20, /* towards the end */)}`
}