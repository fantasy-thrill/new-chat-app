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

function generateAuthKey(id) {
  let authKey = `${id}_`
  const characters = "abcdefghijklm0123456789nopqrstuvwxyz0123456789"
  for (let i = 0; i < 40; i++) {
    authKey += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return authKey
}

app.post("/create-account", async (req, res) => {
  try {
    const { name, user_id, password } = req.body
    const realUsers = db.collection(process.env.DB_USER_COLLECTION)
    const newUser = {
      name: name,
      uid: user_id,
      authKey: generateAuthKey(user_id)
    }
    res.json(req.body)
    console.log("Signup form received\n", req.body)
  } catch (error) {
    res.end("Did not receive any info")
    console.log(error)
  }
})

app.get("/data/:col", async (req, res) => {
  try {
    const collectionName = req.params.col === "test" ? 
      process.env.DB_TEST_COLLECTION : 
      process.env.DB_USER_COLLECTION

    const result = await db
      .collection(collectionName)
      .find()
      .toArray()
    res.json(result)

  } catch (error) {
    console.error("Error executing query: ", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.put("/update/:uid/:msgid", async (req, res) => {
  try {
    const collectionName = /superhero[1-5]/.test(req.params.uid) ? 
      process.env.DB_TEST_COLLECTION : 
      process.env.DB_USER_COLLECTION
    const appUsers = db.collection(collectionName)
    
    const filter = { uid: req.params.uid }
    const user = await appUsers.findOne(filter)
    const updateDoc = {
      $set: {
        deletedMsgs: [...user.deletedMsgs, req.params.msgid]
      }
    }

    const result = await appUsers.updateOne(filter, updateDoc)
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