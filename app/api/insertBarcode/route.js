import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function POST(req) {
  try {
    // Get the item details from the request body
    const { name, barcode } = await req.json();
    const db = await connect();

    // Check if the barcode already exists in the database
    const existingBarcode = await db
      .collection("workers")
      .findOne({ barcode: barcode });

    if (existingBarcode) {
      // barcode already exists, return an error response
      return NextResponse.json({
        success: false,
        message: "Barcode already exists. Please revalidate barcode.",
      });
    } else {
      // barcode is unique, proceed with insertion
      const newBarcode = {
        name,
        barcode,
      };
      const result = await db.collection("workers").insertOne(newBarcode);

      return NextResponse.json({
        success: true,
        message: "Barcode added successfully.",
        data: result.ops[0],
      });
    }
  } catch (error) {
    // Handle any errors
    return NextResponse.json({
      success: false,
      message: "An error occurred while adding the barcode.",
      error: error.message,
    });
  }
}
