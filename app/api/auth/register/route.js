import { hashPassword } from "../../../../utils/auth"; // Hashing utility
import connect from "../../../../utils/db"; // MongoClient utility
import { ObjectId } from "mongodb";

export async function POST(req) {
  const { name, email, password, role } = await req.json();

  // Connect to MongoDB
  const client = await connect();
  const usersCollection = client.collection("users");

  // Check if user already exists
  const existingUser = await usersCollection.findOne({ email });
  if (existingUser) {
    return new Response(JSON.stringify({ message: "User already exists" }), {
      status: 400,
    });
  }

  // Hash the password before storing
  const hashedPassword = await hashPassword(password);

  // Insert the new user into the database
  await usersCollection.insertOne({
    _id: new ObjectId(),
    name,
    email,
    password: hashedPassword,
    role,
    createdAt: new Date(),
  });

  return new Response(
    JSON.stringify({ message: "User created successfully" }),
    {
      status: 201,
    }
  );
}
