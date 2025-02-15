export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import connect from "../../../utils/db";
import bcrypt from "bcrypt";

export async function POST(request) {
  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Both current and new passwords are required",
        },
        { status: 400 }
      );
    }

    // Connect to the database
    const db = await connect();
    const collection = db.collection("throw_password");

    // Fetch the current password record
    const passwordRecord = await collection.findOne({});

    if (!passwordRecord) {
      return NextResponse.json(
        { success: false, message: "Password not set" },
        { status: 404 }
      );
    }

    // Validate the current password
    const isValid = await bcrypt.compare(
      currentPassword,
      passwordRecord.password
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid current password" },
        { status: 401 }
      );
    }

    // Hash the new password and update it in the database
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await collection.updateOne(
      {},
      { $set: { password: hashedPassword } },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { message: "Failed to update password." },
      { status: 500 }
    );
  }
}
