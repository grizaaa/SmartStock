// utils/db.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URL; // MongoDB connection string from environment variables
const options = {
  maxPoolSize: 10, // Set max pool size
  connectTimeoutMS: 10000, // Set connection timeout to 10 seconds
  socketTimeoutMS: 45000, // Set socket timeout to 45 seconds
  readPreference: "primary",
};

let client;
let clientPromise;

if (!process.env.MONGO_URL) {
  throw new Error("Please add your Mongo URI to .env");
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the MongoClient is not repeatedly created
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable
  client = new MongoClient(uri, options);
  clientPromise = client.connect().catch((error) => {
    console.error("Failed to connect to MongoDB in production:", error);
  });
}

export default async function connect() {
  try {
    const client = await clientPromise;
    const db = client.db("printec"); // Specify the database name here
    return db;
  } catch (error) {
    console.error("Error getting MongoDB connection:", error);
    throw new Error("Database connection failed");
  }
}
