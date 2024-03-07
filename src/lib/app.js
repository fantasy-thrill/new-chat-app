const https = require("https")
const fs = require("fs")
const express = require("express")
const { MongoClient, ObjectId } = require("mongodb")
const app = express()
const cors = require("cors")
// const bcrypt = require("bcrypt")
require("dotenv").config()

const mongoURI = process.env.CONNECTION_STRING
const dbName = process.env.DB_NAME
const port = process.env.PORT

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

const client = new MongoClient(mongoURI);
client.connect()
console.log("Connected to MongoDB Atlas")

const db = client.db(dbName)

const options = {
  key: fs.readFileSync("./key.pem"),
  cert: fs.readFileSync("./cert.pem"),
  passphrase: process.env.CERT_PASSPHRASE
}

app.post("/create-account", async (req, res) => {
  try {
    res.json(req.body)
    console.log("Signup form received\n", req.body)
  } catch (error) {
    res.end("Did not receive any info")
    console.log(error)
  }
})

app.get("/data", async (req, res) => {
  try {
    const result = await db
      .collection(process.env.DB_COLLECTION)
      .find()
      .toArray()
    res.json(result)

  } catch (error) {
    console.error("Error executing query: ", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.put("/update/:uid/:authToken/:msgid", async (req, res) => {
  try {
    const users = db.collection(process.env.DB_COLLECTION)
    const usersObj = await users
      .find()
      .toArray()
    const filter = { _id: new ObjectId(process.env.DB_COLLECTION_ID) }
    const userID = req.params.uid
    const updateDoc = {
      $set: {
        [userID]: {
          authToken: req.params.authToken,
          deletedMsgs: [...usersObj[0][userID].deletedMsgs, req.params.msgid]
        }
      }
    }

    const result = await users.updateOne(filter, updateDoc)
    res.json(result)
    console.log("User's deleted messages have been updated.")

  } catch (error) {
    console.error(`Could not update deleted messages: \"${error}\"`)
    res.end("Could not update")
  }
})

https.createServer(options, app).listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})