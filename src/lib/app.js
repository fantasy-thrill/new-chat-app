const express = require("express")
const { MongoClient } = require("mongodb")
const app = express()
const cors = require("cors")
require("dotenv").config()

const mongoURI = process.env.CONNECTION_STRING
const dbName = process.env.DB_NAME
const port = process.env.PORT

app.use(express.json())
app.use(cors())

// Connect to MongoDB Atlas
const client = new MongoClient(mongoURI);
client.connect()
console.log("Connected to MongoDB Atlas")

const db = client.db(dbName)

app.get("/data", async (req, res) => {
  try {
    // Example query: Find all documents in a collection
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

app.put("/update", async (req, res) => {
  try {
    const users = db.collection(process.env.DB_COLLECTION)
    const filter = { _id: process.env.DB_COLLECTION_ID }
    const updateDoc = {
      $set: {
        // User ID and new deleted messages array goes here
      }
    }

    const result = await users.updateOne(filter, updateDoc)
    console.log("User's deleted messages have been updated.")

  } catch (error) {
    console.error(`Could not update deleted messages: \"${error}\"`)
  }
})

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})