import { validator } from "@exodus/schemasafe"
import fs = require("node:fs")

const formSchema = fs.readFileSync(__dirname + "/form_schema.json").toString()

export const formValidator = validator(JSON.parse(formSchema))

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