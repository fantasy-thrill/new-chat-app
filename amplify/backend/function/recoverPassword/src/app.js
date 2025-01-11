/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/


const express = require('express')
const bodyParser = require('body-parser')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const { MongoClient } = require("mongodb")
const cors = require("cors")
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

app.post("/password-recovery", function(req, res) {
  const { email } = req.body
  let userID;
  const appUsers = db.collection(process.env.DB_USER_COLLECTION)
  const passwordResetRequests = db.collection(process.env.PASSWORD_RESETS)
  const matchedUser = appUsers.findOne({ email: email })
  if (matchedUser) userID = matchedUser.uid

  const recoveryStatus = {
    code: "",
    requestedBy: userID,
    requestTime: new Date().getTime()
  }

  const numbers = "1234567890"
  for (let i = 0; i < 12; i++) {
    recoveryStatus.code += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }

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

      <a href="https://localhost:5173/reset-password/${userID}/${recoveryStatus.code}">
        https://localhost:5173/reset-password/${userID}/${recoveryStatus.code}
      </a>
    `
  }

  try {
    const result = passwordResetRequests.insertOne(recoveryStatus)
    const info = transporter.sendMail(mailOptions)
    console.log("E-mail sent: ", info.response)
    res.sendStatus(200)
    res.json({ success: 'post call succeed!', url: req.url, body: req.body })

  } catch (error) {
    console.error("Error sending e-mail: ", error)
    res.status(500).send("Recovery e-mail was not sent.")
  }
});

app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app