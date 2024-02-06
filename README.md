<!-- common contents -->

<div align="center">
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

你应当创建 `.env` 文件，其中包含 `DATABASE_URL` 属性。

你可能还需要更改 `/prisma/schema.prisma` 中的 `db.provider`。

此项目使用是 MySQL 8.1。其他数据库的兼容性未经测试。

### 生成 Prisma Client

运行以下命令以生成 Prisma Client:
```shell
npx prisma generate
npx prisma db push
```

### 密钥配置

在根目录下创建 `/data` 文件夹，创建如下文件：
```
captcha-site-secret.secret
client-secret.secret
salt.secret
```

- 将从 Cloudflare Turnstile 中获取的 `site secret` 填入 `captcha-site-secret.secret`。
- 其余文件的内容请自行生成，务必保密。
- 请妥善保管 `salt.secret`，一旦丢失，则用户无法正常登录。

### Cloudflare Email Worker 部署

请参照 [此处](https://github.com/projectGDT/gdt-cloudflare-worker) 的说明以及 [Cloudflare 文档](https://developers.cloudflare.com/workers/) 完成部署。

部署过程中需要更改 `/src/register/submit.ts` 中的 `emailAddr` 常量。

### ...在一切完成后

运行命令
```shell
node src/app.js
```
以开启后端。