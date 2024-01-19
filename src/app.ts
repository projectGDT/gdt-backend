import express = require('express')
const app = express()
const port = 14590 // for tests

import cors = require("cors")
app.use(cors({
    origin: "http://localhost:3000", // for tests
    credentials: true
}))

app.use(express.json())

app.listen(port, () => {
    console.log(`Start Listening`)
})