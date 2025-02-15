export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import connect from "../../../utils/db"; // Assuming you have a utility function to connect to your database

export async function GET(request) {
  try {
    // Connect to the database
    const db = await connect();

    // Define the collection from which to fetch records
    const collection = db.collection("item_master"); // Use your actual collection name

    // Fetch all records from the collection
    const records = await collection.find({}).toArray();

    // Return the records as JSON
    const response = NextResponse.json(records, { status: 200 });
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    console.error("Error fetching records:", error);

    // Return an error response if something goes wrong
    return NextResponse.json(
      { message: "Failed to fetch records." },
      { status: 500 }
    );
  }
}
