import {Schema} from "@exodus/schemasafe"

export const formSchema: Schema = {
    type: "object",
    properties: {
        title: {type: "string", minLength: 1, maxLength: 30},
        preface: {type: "string", maxLength: 300},
        questions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    content: {type: "string", minLength: 1, maxLength: 60},
                    hint: {type: "string", maxLength: 300},
                    required: {type: "boolean"},
                    branches: {
                        oneOf: [
                            {
                                type: "object",
                                properties: {
                                    type: {type: "string", enum: ["choice"]},
                                    choices: {
                                        type: "array",
                                        items: {type: "string", "minLength": 1, "maxLength": 20},
                                        maxItems: 10,
                                        minItems: 2
                                    },
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
                                    type: {type: "string", enum: ["open"]},
                                    allowMultipleLines: {type: "boolean"}
                                },
                                required: ["type"],
                                additionalProperties: false
                            }
                        ]
                    }
                },
                maxItems: 20,
                minItems: 1,
                required: ["content", "required", "branches"],
                additionalProperties: false
            }
        }
    },
    required: ["title", "preface", "questions"],
    additionalProperties: false
}

export interface Form {
    title: string
    preface: string
    questions: Question[]
}

export interface Question {
    content: string
    hint?: string
    required: boolean
    branches:
        ChoiceBranches |
        NumberBranches |
        DateFullBranches |
        DateYearMonthBranches |
        OpenBranches
}

export interface ChoiceBranches {
    type: "choice"
    choices: string[]
    allowMultipleChoices: boolean
    hasBlank: boolean
}

export interface NumberBranches {
    type: "number"
}

export interface DateFullBranches {
    type: "dateFull"
}

export interface DateYearMonthBranches {
    type: "dateYearMonth"
}

export interface OpenBranches {
    type: "open"
    allowMultipleLines: boolean
}

export function generateAnswerSchema(form: Form): Schema {
    // Here we assert that the form is validated.
    // Sorry, TypeScript.
    let ret: {
        type: string,
        items: Schema[]
        additionalItems: boolean
    } = {
        type: "array",
        items: [],
        additionalItems: false
    }

    for (let question of form.questions) {
        switch (question.branches.type) {
            case "choice":
                const {choices, allowMultipleChoices, hasBlank} = question.branches
                ret.items.push({
                    type: "object",
                    properties: {
                        chosenIndexes: {
                            type: "array",
                            items: {
                                type: "integer",
                                minimum: 0,
                                exclusiveMaximum: choices.length
                            },
                            uniqueItems: true,
                            minItems: hasBlank ? 0 : 1,
                            ...!allowMultipleChoices && {
                                maxItems: 1
                            }
                        },
                        ...hasBlank ? {
                            other: {
                                type: "string",
                                minLength: 1,
                                maxLength: 30
                            }
                        } : {}
                    },
                    required: ["chosenIndexes", ...hasBlank ? ["other"] : []],
                    additionalProperties: false
                })
                break
            case "number":
                ret.items.push({type: "number"})
                break
            case "open":
                ret.items.push({type: "string", minLength: 1, maxLength: 600})
                break
            case "dateFull":
                ret.items.push({type: "integer"}) // epoch day
                break
            case "dateYearMonth":
                ret.items.push({type: "integer"}) // epoch month
                break
        }
    }

    return ret
}