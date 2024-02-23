import {Express} from "express";
import {Request} from "express-jwt"
import {PrismaClient} from "@prisma/client";
import {jsonValidate} from "../../../utils/json-schema-middleware";
import {formSchema} from "../../../utils/form-validate";

module.exports = (app: Express, prisma: PrismaClient) => app.post("/post-login/access/submit",
    jsonValidate({
        type: "object",
        required: ["basic", "remote", "applying"],
        properties: {
            basic: {
                type: "object",
                required: ["name", "logoLink", "coverLink", "introduction"],
                properties: {
                    name: {type: "string", minLength: 3, maxLength: 30},
                    logoLink: {
                        type: "string",
                        pattern: "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()!@:%_+.~#?&\\/=]*)$",
                        maxLength: 2083
                    },
                    coverLink: {
                        type: "string",
                        pattern: "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()!@:%_+.~#?&\\/=]*)$",
                        maxLength: 2083
                    },
                    introduction: {
                        type: "string",
                        maxLength: 3000
                    }
                }
            },
            remote: {
                type: "object",
                properties: {
                    java: {
                        type: "object",
                        required: ["address", "port", "compatibleVersions", "coreVersion", "auth"],
                        properties: {
                            address: {
                                type: "string",
                                pattern: "^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$"
                            },
                            port: {
                                type: "integer",
                                minimum: 0,
                                maximum: 65535
                            },
                            compatibleVersions: {
                                type: "array",
                                items: {type: "string", pattern: "^1\\.[0-9]{1,2}\\.[0-9]{1,2}$"}
                            },
                            coreVersion: {type: "string", pattern: "^1\\.[0-9]{1,2}\\.[0-9]{1,2}$"},
                            auth: {type: "string", enum: ["microsoft", "littleSkin", "offline"]},
                            modpackVersionId: {type: "string", pattern: "^[0-9a-zA-Z]{8}$"}
                        }
                    },
                    bedrock: {
                        type: "object",
                        required: ["address", "port", "compatibleVersions", "coreVersion"],
                        properties: {
                            address: {
                                type: "string",
                                pattern: "^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$"
                            },
                            port: {
                                type: "integer",
                                minimum: 0,
                                maximum: 65535
                            },
                            compatibleVersions: {
                                type: "array",
                                items: {type: "string", pattern: "^1\\.[0-9]{1,2}\\.[0-9]{1,3}$"}
                            },
                            coreVersion: {type: "string", pattern: "^1\\.[0-9]{1,2}\\.[0-9]{1,3}$"}
                        }
                    }
                },
            },
            applying: {
                type: "object",
                required: ["policy"],
                properties: {
                    policy: {type: "string", enum: ["allOpen", "byForm"]},
                    form: formSchema
                }
            }
        }
    }),
    (req: Request, res) => {
        // additional validation
        const body = req.body
        if (
            !(body.remote.java || body.remote.bedrock) ||
            (body.applying.policy === "byForm" && !body.applying.form)
        ) {
            res.status(400).end()
            return
        }

        // if all ok then put it into db
        prisma.accessApplyPayload.create({
            data: {
                submittedBy: req.auth!.id!,
                payload: body,
                state: "REVIEWING"
            }
        })
            .then(_result => res.status(204).end())
            .catch(_err => res.status(400).end())
    }
)