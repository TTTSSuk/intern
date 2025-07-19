// lib/mongodb.ts

import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017"
const options = {}

let client
let clientPromise: Promise<MongoClient>

declare global {
  // ให้ ts รู้ว่าเราจะใช้ global นี้ใน dev
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options)
  global._mongoClientPromise = client.connect()
}

clientPromise = global._mongoClientPromise

export default clientPromise
