export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import connect from "../../../utils/db";
import bcrypt from "bcrypt";

export async function POST(request) {
  try {
    const { password } = await request.json();

    if (!password) {
      console.error("Password is missing from the request.");
      return NextResponse.json(
        { valid: false, message: "Password is required" },
        { status: 400 }
      );
    }

    // Connect to the database
    const db = await connect();
    const collection = db.collection("throw_password");

    // Fetch the password document
    const passwordRecord = await collection.findOne({});

    if (!passwordRecord || !passwordRecord.password) {
      console.error("Password hash is missing in the database.");
      return NextResponse.json(
        { valid: false, message: "Password not set" },
        { status: 404 }
      );
    }

    console.log("Password from request:", password);
    console.log("Stored password hash from DB:", passwordRecord.password);

    // Compare the input password with the hashed password
    const isValid = await bcrypt.compare(password, passwordRecord.password);

    if (isValid) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json(
        { valid: false, message: "Invalid password" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error validating password:", error.message, error.stack);
    return NextResponse.json(
      { message: "Failed to validate password." },
      { status: 500 }
    );
  }
}
