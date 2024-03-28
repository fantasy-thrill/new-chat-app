const https = require("https")
const fs = require("fs")
const express = require("express")
const { MongoClient } = require("mongodb")
const app = express()
const cors = require("cors")
const bcrypt = require("bcrypt")
const multer = require("multer")
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

const transporter = mailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SERVER_EMAIL,
    pass: process.env.SERVER_EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
})

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/")
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
})

async function generateAuthToken(id) {
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      apikey: process.env.API_KEY,
    },
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

app.post("/create-account", upload.single("profile_pic"), async (req, res) => {
  try {
    const { name, user_id, email, password } = req.body
    const realUsers = db.collection(process.env.DB_USER_COLLECTION)
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = {
      name: name,
      uid: user_id,
      email: email,
      profilePicture: req.file.path,
      password: hashedPassword
    }

    const mailOptions = {
      from: process.env.SERVER_EMAIL,
      to: email,
      subject: "Account creation successful",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <h1>Welcome to Yapper!</h1>
        
          <pre style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            Dear ${name} (${user_id}),
        
            Welcome to Yapper! We're thrilled to have you join our community and embark on this messaging journey with us.
        
            As a new member, you now have access to a world of possibilities for connecting with friends, family, and colleagues. Whether you're looking to stay in touch with loved ones, collaborate with teammates, or meet new people, Yapper is here to make communication easy and enjoyable for you.
        
            We're committed to providing you with the best messaging experience possible, and we're continuously working to improve and enhance our app based on your feedback.
        
            If you have any questions, feedback, or suggestions, please don't hesitate to reach out to our support team. We're here to help and ensure that your experience with Yapper is seamless and enjoyable.
        
            Once again, welcome to Yapper! We look forward to helping you stay connected with the people who matter most to you.
        
            Best regards,
            <b>Yapper Support Team</b>
          </pre>
        </div>
      `
    }

    const result = await realUsers.insertOne(newUser)
    const info = await transporter.sendMail(mailOptions)
    res.json(newUser)
    console.log("User account created successfully!\n E-mail sent: ", info.response)
  
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

app.post("/password-recovery", upload.none(), async (req, res) => {
  const { email } = req.body
  let userID;
  const appUsers = db.collection(process.env.DB_USER_COLLECTION)
  const matchedUser = await appUsers.findOne({ email: email })
  let recoveryCode = ""

  const numbers = "1234567890"
  for (let i = 0; i < 12; i++) {
    recoveryCode += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }

  if (matchedUser) userID = matchedUser.uid

  const mailOptions = {
    from: process.env.SERVER_EMAIL,
    to: email,
    subject: "Reset your password",
    html: `
      <h1>Password Recovery</h1>

      <p>
        Username: <b>${userID}</b>
        <br>
        Please click the following link to reset your password.
      </p>

      <a href="https://localhost:5173/reset-password/${userID}/${recoveryCode}">
        https://localhost:5173/reset-password/${userID}/${recoveryCode}
      </a>
    `
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("E-mail sent: ", info.response)
    res.sendStatus(200)

  } catch (error) {
    console.error("Error sending e-mail: ", error)
    res.status(500).send("Recovery e-mail was not sent.")
  }
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