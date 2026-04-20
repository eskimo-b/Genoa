const express = require("express")
const app = express()

const bodyParser = require("body-parser")
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

require("dotenv").config()

// CORS - même pattern que le cours
app.use((req, res, next) => {
    res.append('Access-Control-Allow-Origin', ['*'])
    res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS')
    res.append('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    if (req.method === 'OPTIONS') return res.sendStatus(200)
    next()
})

const MongoClient = require('mongodb').MongoClient
const url = process.env.MONGO_URI || 'mongodb://localhost:27017'

MongoClient.connect(url)
    .then(client => client.db("genoa"))
    .then(db => {
        const users      = db.collection("users")
        const members    = db.collection("members")
        const unions     = db.collection("unions")
        const situations = db.collection("situations")

        require("./routes/auth")(app, users)
        require("./routes/users")(app, users)
        require("./routes/members")(app, members)
        require("./routes/relations")(app, unions, situations, members)

        app.get("/", (req, res) => res.json({ message: "Genoa API is running 🌳" }))

        app.listen(3000, () => console.log("Genoa API démarrée sur http://localhost:3000"))
    })
    .catch(err => { throw err })
