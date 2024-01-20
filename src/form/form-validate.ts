import { validator } from "@exodus/schemasafe"

export const formValidator = validator({
    type: "object",
    properties: {
        title: {type: "string", minLength: 1, maxLength: 30},
        preface: {type: "string", minLength: 1, maxLength: 200},
        questions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    root: {
                        type: "object",
                        properties: {
                            contents: {type: "string", minLength: 1, maxLength: 60},
                            hint: {type: "string", minLength: 1, maxLength: 60}
                        },
                        required: ["contents"],
                        additionalProperties: false
                    },
                    branches: {
                        oneOf: [
                            {
                                type: "object",
                                properties: {
                                    type: {type: "string", enum: ["choice"]},
                                    choices: {type: "array", items: {type: "string", "minLength": 1, "maxLength": 20}},
                                    allowMultipleChoices: {type: "boolean"},
                                    hasBlank: {type: "boolean"}
                                },
                                required: ["type", "choices", "allowMultipleChoices", "hasBlank"],
                                additionalProperties: false
                            },
                            {
                                type: "object",
                                properties: {
                                    type: {type: "string", enum: ["number"]}
                                },
                                required: ["type"],
                                additionalProperties: false
                            },
                            {
                                type: "object",
                                properties: {
                                    type: {type: "string", enum: ["dateFull"]}
                                },
                                required: ["type"],
                                additionalProperties: false
                            },
                            {
                                type: "object",
                                properties: {
                                    type: {type: "string", enum: ["dateYearMonth"]}
                                },
                                required: ["type"],
                                additionalProperties: false
                            },
                            {
                                type: "object",
                                properties: {
                                    "type": {"type": "string", "enum": ["open"]}
                                },
                                required: ["type"],
                                additionalProperties: false
                            }
                        ]
                    }
                },
                required: ["root", "branches"],
                additionalProperties: false
            }
        }
    },
    required: ["title", "preface", "questions"],
    additionalProperties: false
})

export function generateAnswerSchema(form: {
    title: string,
    preface: string,
    questions: {
        root: any,
        branches: {
            type: string,
            [key: string]: any
        }
    }[]
}): {type: string, items: any[], additionalItems: boolean} {
    // Here we assert that the form is validated.
    // Sorry, TypeScript.
    let ret: {
        type: string,
        items: { type: string, [key: string]: any }[]
        additionalItems: boolean
    } = {
        type: "array",
        items: [],
        additionalItems: false
    }

    for (let question of form.questions) {
        switch (question.branches.type) {
            case "choice":
                let item: {
                    type: string,
                    properties: { [key: string]: any },
                    required: string[],
                    additionalProperties: boolean
                } = {
                    type: "object",
                    properties: [],
                    required: [],
                    additionalProperties: false
                }

                if (question.branches.allowMultipleChoices) {
                    item.properties = {
                        ...item.properties,
                        chosenIndexes: {
                            type: "array",
                            items: {
                                type: "integer",
                                minimum: 0,
                                exclusiveMaximum: question.branches.choices.length
                            },
                            uniqueItems: true
                        }
                    }
                    item.required = [...item.required, "chosenIndexes"]
                } else {
                    item.properties = {
                        ...item.properties,
                        chosenIndex: {
                            type: "integer",
                            minimum: 0,
                            exclusiveMaximum: question.branches.choices.length
                        }
                    }
                    item.required = [...item.required, "chosenIndex"]
                }

                if (question.branches.hasBlank) {
                    item.properties = {
                        ...item.properties,
                        other: {
                            type: "string",
                            minLength: 1,
                            maxLength: 30
                        }
                    }
                }

                ret.items = [ ...ret.items, item ]
                break
            case "number":
                ret.items = [ ...ret.items, {
                    type: "number"
                }]
                break
            case "open":
                ret.items = [ ...ret.items, {
                    type: "string",
                    minLength: 1,
                    maxLength: 100
                }]
                break
            case "dateFull":
                ret.items = [ ...ret.items, {
                    type: "integer" // epoch day
                }]
                break
            case "dateYearMonth":
                ret.items = [ ...ret.items, {
                    type: "integer" // epoch month
                }]
                break
        }
    }

    return ret
}