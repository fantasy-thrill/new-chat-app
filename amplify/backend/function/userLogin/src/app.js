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
const bcrypt = require("bcrypt")
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

/****************************
* Example post method *
****************************/

app.post('/login', function(req, res) {
  try {
    const { user_id, password } = req.body
    const appUsers = db.collection(process.env.DB_USER_COLLECTION)
    const matchedUser = appUsers.findOne({ uid: user_id })

    if (!matchedUser) return res.status(401).json({ error: "User not found" })

    const passwordMatch = bcrypt.compare(password, matchedUser.password)
    if (passwordMatch) {
      if (!matchedUser.authToken) {
        const newToken = generateAuthToken(matchedUser.uid)
        const updatedProp = {
          $set: {
            authToken: newToken,
          },
        }
        const result = appUsers.updateOne({ uid: matchedUser.uid }, updatedProp)
        return res.status(200).json({ ...matchedUser, authToken: newToken })
      }
      res.json({ success: "post call succeed!", url: req.url, body: req.body })
      return res.status(200).json(matchedUser)
    } else {
      return res.status(401).json({ error: "Invalid password" })
    }
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Internal server error" })
  }
});

app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
