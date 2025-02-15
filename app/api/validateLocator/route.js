import { NextResponse } from "next/server";
import connect from "../../../utils/db"; // Assuming you have a utility function to connect to your database

export async function POST(request) {
  try {
    // Parse the request body to extract the locator
    const { locator } = await request.json();

    if (!locator) {
      return NextResponse.json(
        { message: "Locator is required." },
        { status: 400 }
      );
    }

    // Connect to the database
    const db = await connect();

    // Define the collection to query
    const collection = db.collection("locator_master"); // Use your actual collection name

    // Check if the locator exists in the collection
    const existingLocator = await collection.findOne({ locator });

    if (existingLocator) {
      // If the locator exists, return a valid response
      return NextResponse.json(
        { valid: true, message: "Locator is valid." },
        { status: 200 }
      );
    } else {
      // If the locator does not exist, return an invalid response
      return NextResponse.json(
        { valid: false, message: "Locator is invalid." },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error validating locator:", error);

    // Return an error response if something goes wrong
    return NextResponse.json(
      { message: "Failed to validate locator." },
      { status: 500 }
    );
  }
}
