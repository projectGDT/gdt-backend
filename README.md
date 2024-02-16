<!-- common contents -->

<div style="text-align: center">
    <img width="160" src="logo.svg" alt="logo"><br/>
    projectGDT - for a more connected Minecraft world!<br/>
    QQ Group:
    <a href="https://qm.qq.com/cgi-bin/qm/qr?k=jNFTovEpc0WDFtbSbUMrbQ0NyUgDpnCu&jump_from=webapi&authKey=6oBQQeoeB6gA7+AljJK7AV1IUEjkk/HpkvxrBNgAQtpxPtw230h4GQrp56nTw81I">
        162779544
    </a>
</div>

---

# gdt-backend

projectGDT 的子项目之一，也是最为基础的子项目。

承担了维护玩家与服务器数据、认证、响应 HTTP 请求、与 QQ Bot 通讯，以及分发文件的任务。

## 开发环境调试

### 数据库配置

参照 [此处](https://www.prisma.io/docs/orm/overview/databases) 选择数据库种类并配置。

你应当创建 `/.env` 文件，其中包含 `DATABASE_URL` 属性。

你可能还需要更改 `/prisma/schema.prisma` 中的 `db.provider`。

此项目使用的是 MySQL 8.1。其他数据库的兼容性未经测试。

### 生成 Prisma Client

运行以下命令以生成 Prisma Client，并在数据库中生成结构:
```shell
npx prisma db push
```

### 密钥配置
在 `.env` 文件中添加以下三行:
```
CAPTCHA_SITE_SECRET="{1}"
CLIENT_SECRET="{2}"
PBKDF2_SALT="{3}"
```

- 将从 Cloudflare Turnstile 中获取的 `site secret` 填入 `{1}` 处。
- 其余属性请自行生成，务必保密。
- 请妥善保管 `PBKDF2_SALT`。一旦丢失，则用户无法正常登录。

### Cloudflare Email Worker 部署

请参照 [此处](https://github.com/projectGDT/gdt-cloudflare-worker) 的说明以及 [Cloudflare 文档](https://developers.cloudflare.com/workers/) 完成部署。

部署过程中需要更改 `/src/register/submit.ts` 中的 `emailAddr` 常量。

### ...在一切完成后

运行命令
```shell
npm dev
```
以编译和开启后端。

## 生产环境部署

首先，按照“开发环境调试”中的说明进行环境配置。

### 网络参数配置

在 `.env` 文件中添加以下三行:
```
IP="{1}"
PORT="{2}"
FRONTEND_ORIGIN="{3}"
```

- `IP` 指服务将要绑定的网卡 IP。如果不清楚此项，请留空。默认值 `0.0.0.0`。
- `PORT` 是服务监听的端口。默认值 `14590`。
- `FRONTEND_ORIGIN` 是前端服务的地址，必须提供，格式为 `[http|https]://[IP/domain]`。最后无需加斜杠 `/`。

### ...在一切完成后

运行
```shell
npm build
```
构建后的文件位于 `dist` 目录内。运行
```shell
node --env-file [env-file-path] index.js
```
来启动后端。其中 `[env-file-path]` 指 `.env` 文件的路径。

**一定要将 `--env-file [env-file-path]` 参数置于 `index.js` 之前！**