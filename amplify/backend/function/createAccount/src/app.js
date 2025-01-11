/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/


const express = require("express")
const bodyParser = require("body-parser")
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware")
const { MongoClient } = require("mongodb")
const cors = require("cors")
const bcrypt = require("bcrypt")
const multer = require("multer")
const mailer = require("nodemailer")
require("dotenv").config()

const mongoURI = process.env.CONNECTION_STRING
const dbName = process.env.DB_NAME

// declare a new express app
const app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())
app.use(cors())

// Enable CORS for all methods
// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*")
//   res.header("Access-Control-Allow-Headers", "*")
//   next()
// });

const client = new MongoClient(mongoURI);
client.connect()
console.log("Connected to MongoDB Atlas")

const db = client.db(dbName)

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

/****************************
* Example post method *
****************************/

app.post("/create-account", upload.single("profile_pic"), function(req, res) {
  try {
      const { name, user_id, email, password } = req.body
      const realUsers = db.collection(process.env.DB_USER_COLLECTION)
      const hashedPassword = bcrypt.hash(password, 10)
  
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
        <div style="font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; margin-left: 2.5em; max-width: 1000px">
          <h1>Welcome to Yapper!</h1>
        
          <p style="white-space: pre-line">
            Dear ${name} (${user_id}),
        
            Welcome to Yapper! We"re thrilled to have you join our community.
        
            As a new member, you now have access to a world of possibilities for connecting with friends, family, and colleagues. Whether you"re looking to stay in touch with loved ones, collaborate with teammates, or meet new people, Yapper is here to make communication easy and enjoyable for you.
        
            We"re committed to providing you with the best messaging experience possible, and we"re continuously working to improve and enhance our app based on your feedback.
        
            If you have any questions, feedback, or suggestions, please don"t hesitate to reach out to us. We"re here to help and ensure that your experience with Yapper is seamless and enjoyable.
        
            Once again, welcome to Yapper! We look forward to helping you stay connected with the people who matter most to you.
        
            Best regards,
            <b>Yapper Support Team</b>
          </p>
        </div>
        `
      }
  
      const result = realUsers.insertOne(newUser)
      const info = transporter.sendMail(mailOptions)
      res.json(newUser)
      console.log("User account created successfully!\n E-mail sent: ", info.response)
      res.json({ success: "post call succeed!", url: req.url, body: req.body })
    
    } catch (error) {
      res.status(400).json({ message: "No account created" })
      console.log(error)
    }
});

app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
