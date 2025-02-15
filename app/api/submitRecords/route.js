import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function POST(req) {
  try {
    const records = await req.json(); // Get the records from the request body
    const db = await connect();

    function formatTimestamp() {
      const date = new Date();
      return date.toISOString(); // Returns timestamp in ISO 8601 format
    }

    for (let record of records) {
      const { id, locator, qty, ...rest } = record;
      let _id;

      if (id) {
        _id = id;
      } else {
        console.warn(`Invalid ID: ${id}, already in use.`);
        return NextResponse.json(
          { message: `Invalid ID: ${id}.` },
          { status: 400 }
        );
      }

      // Check if item exists in printec_wh
      const existingRecord = await db.collection("printec_wh").findOne({ _id });

      if (existingRecord) {
        // If item exists, check if it's being moved or removed
        const originalTimeSubmitted =
          existingRecord.timeSubmitted || formatTimestamp(); // Get the original time or current if it's new

        // Get the actual quantity in the warehouse
        const actualQuantity = existingRecord.qty;

        if (existingRecord.locator !== locator) {
          // If the new locator is "OUT", remove the item from printec_wh
          if (locator === "OUT") {
            // Remove the item from printec_wh
            await db.collection("printec_wh").deleteOne({ _id });

            // Log the removal in printec_wh_log
            await db.collection("printec_wh_log").insertOne({
              record_id: _id,
              qty_updated: actualQuantity, // Log the actual quantity, not the scanned quantity
              time_updated: formatTimestamp(), // Time of removal
              loc_updated: `${existingRecord.locator} -> OUT`,
              action: "removed", // Removal action
              timeSubmitted: originalTimeSubmitted, // Preserve the original submission time
              ...rest,
            });

            continue; // Move to the next record
          } else {
            // Move the item to the new locator
            await db
              .collection("printec_wh")
              .updateOne({ _id }, { $set: { locator } });

            // Log the locator change in printec_wh_log
            await db.collection("printec_wh_log").insertOne({
              record_id: _id,
              qty_updated: actualQuantity, // Log the actual quantity, not the scanned quantity
              time_updated: formatTimestamp(), // Time of movement
              loc_updated: `${existingRecord.locator} -> ${locator}`,
              action: "moved", // Move action
              timeSubmitted: originalTimeSubmitted, // Preserve the original submission time
              ...rest,
            });

            continue; // Skip to the next record since the locator was updated
          }
        }

        return NextResponse.json(
          {
            message: `Item with ID ${id} already exists in locator ${locator}.`,
          },
          { status: 400 }
        );
      }

      // If the item is new (not found in printec_wh), insert it and log the new entry
      const timeSubmitted = formatTimestamp(); // Capture the first scan time

      await db.collection("printec_wh").insertOne({
        _id,
        locator,
        qty,
        timeSubmitted, // Store the first scan time in the printec_wh collection
        ...rest,
      });

      // Log the new item submission in printec_wh_log
      await db.collection("printec_wh_log").insertOne({
        record_id: _id,
        qty_updated: qty,
        time_updated: timeSubmitted, // Time of first submission
        loc_updated: locator,
        action: "submitted", // New submission action
        timeSubmitted, // Keep track of the first submission time in the log as well
        ...rest,
      });
    }

    return NextResponse.json(
      { message: "Records submitted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database insertion error:", error);
    return NextResponse.json(
      { message: "Failed to submit records.", error: error.message },
      { status: 500 }
    );
  }
}
