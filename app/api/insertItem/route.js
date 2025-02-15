import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function POST(req) {
  try {
    // Get the item details from the request body
    const { part_number, description, quantity, supplier, customer } =
      await req.json();
    const db = await connect();

    // Check if the part_number already exists in the database
    const existingItem = await db
      .collection("item_master")
      .findOne({ part_number: part_number });

    if (existingItem) {
      // part_number already exists, return an error response
      return NextResponse.json({
        success: false,
        message:
          "Part number already exists. Please provide a unique part number.",
      });
    } else {
      // part_number is unique, proceed with insertion
      const newItem = {
        part_number,
        description,
        quantity,
        supplier,
        customer,
      };
      const result = await db.collection("item_master").insertOne(newItem);

      return NextResponse.json({
        success: true,
        message: "Item added successfully.",
        data: result.ops[0],
      });
    }
  } catch (error) {
    // Handle any errors
    return NextResponse.json({
      success: false,
      message: "An error occurred while adding the item.",
      error: error.message,
    });
  }
}
