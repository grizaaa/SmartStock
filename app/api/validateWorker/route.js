import connect from "../../../utils/db";
import { NextResponse } from "next/server";

export async function POST(req, res) {
  if (req.method === "POST") {
    try {
      const { workerBarcode } = await req.json();
      const db = await connect();

      const worker = await db
        .collection("workers")
        .findOne({ barcode: workerBarcode });

      if (worker) {
        return NextResponse.json({ valid: true });
      } else {
        return NextResponse.json(
          { valid: false, message: "Worker barcode not found" },
          { status: 404 }
        );
      }
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  } else {
    return NextResponse.json(
      { message: "Method not allowed" },
      { status: 405 }
    );
  }
}
