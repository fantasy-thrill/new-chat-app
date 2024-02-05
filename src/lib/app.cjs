const express = require("express")
const { MongoClient } = require("mongodb")
const app = express()
require("dotenv").config()

const mongoURI = process.env.CONNECTION_STRING
const dbName = process.env.DB_NAME // Replace with your actual database name
const port = process.env.PORT

// Middleware to parse incoming JSON requests
app.use(express.json())

// Connect to MongoDB Atlas
MongoClient.connect(mongoURI, (err, client) => {
    if (err) {
      console.error("Error connecting to MongoDB: ", err)
      return
    }

    console.log("Connected to MongoDB Atlas")

    const db = client.db(dbName)

    // Your routes and other Express configurations go here

    // Example route
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

    // Start the Express server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`)
    })
  }
)
