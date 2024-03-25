const https = require("https")
const fs = require("fs")
const express = require("express")
const { MongoClient } = require("mongodb")
const app = express()
const cors = require("cors")
const bcrypt = require("bcrypt")
const multer = require("multer")
const upload = multer()
const mailer = require("nodemailer")
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

async function generateAuthToken(id) {
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      apikey: process.env.API_KEY
    }
  }

  try {
    const response = await fetch(
      `https://${process.env.APP_ID}.api-us.cometchat.io/v3/users/${id}/auth_tokens`, 
      options
    )
    const result = await response.json()
    if (result) return result.data.authToken

  } catch (error) {
    console.error("Could not generate token: ", error)
    return null
  }
}

app.post("/create-account", upload.any(), async (req, res) => {
  try {
    const { name, user_id, password } = req.body
    const realUsers = db.collection(process.env.DB_USER_COLLECTION)
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = {
      name: name,
      uid: user_id,
      password: hashedPassword
    }

    const result = await realUsers.insertOne(newUser)
    res.json(newUser)
    console.log("User account created successfully!")
  
  } catch (error) {
    res.status(400).json({ message: "No account created" })
    console.log(error)
  }
})

app.post("/login", upload.none(), async (req, res) => {
  try {
    const { user_id, password } = req.body
    const appUsers = db.collection(process.env.DB_USER_COLLECTION)
    const matchedUser = await appUsers.findOne({ uid: user_id })

    if (!matchedUser) return res.status(401).json({ error: "User not found" })

    const passwordMatch = await bcrypt.compare(password, matchedUser.password)
    if (passwordMatch) {
      if (!matchedUser.authToken) {
        const newToken = await generateAuthToken(matchedUser.uid)
        const updatedProp = {
          $set: {
            authToken: newToken
          }
        }
        const result = await appUsers.updateOne({ uid: matchedUser.uid }, updatedProp)
        return res.status(200).json({ ...matchedUser, authToken: newToken })
      }
      return res.status(200).json(matchedUser)
    } else {
      return res.status(401).json({ error: "Invalid password" })
    }
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Internal server error" })
  }
})

app.post("/password-recovery", async (req, res) => {
  const { email } = req.body
  const transporter = mailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SERVER_EMAIL,
      pass: process.env.SERVER_EMAIL_PASSWORD
    }
  })

  // Rest of code for handling outbound emails goes here...
})

app.get("/data/:col?", async (req, res) => {
  try {
    const collectionName = req.params.col ? 
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
  console.log(`Server is running on https://localhost:${port}`)
})