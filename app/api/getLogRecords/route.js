export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import connect from "../../../utils/db";

export async function GET(req) {
  try {
    const db = await connect();

    // Fetch all log entries and group by record_id in one query
    const logGroups = await db
      .collection("printec_wh_log")
      .aggregate([
        {
          $group: {
            _id: "$record_id",
            logs: { $push: "$$ROOT" },
          },
        },
      ])
      .toArray();

    // Map the grouped logs to an array of details
    const logWithDetails = logGroups.flatMap((group) => {
      return group.logs.map((log) => ({
        ...log,
      }));
    });

    return NextResponse.json(logWithDetails, { status: 200 });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { message: "Failed to fetch logs." },
      { status: 500 }
    );
  }
}
