import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query parameter
    const { searchParams } = new URL(request.url);
    const userIdStr = searchParams.get("id");

    if (!userIdStr) {
      return NextResponse.json(
        { success: false, message: "User ID diperlukan" },
        { status: 400 }
      );
    }

    const userId = parseInt(userIdStr);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: "User ID tidak valid" },
        { status: 400 }
      );
    }

    // Find user by ID in PostgreSQL
    const result = await query(
      "SELECT id, email, cat_name, cat_type, age, age_unit, weight, fur_type, created_at, tipe_bulu, gender FROM users WHERE id = $1 LIMIT 1",
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id.toString(), // Convert to string for client compatibility
          email: user.email,
          catName: user.cat_name,
          catType: user.cat_type,
          age: user.age,
          ageUnit: user.age_unit,
          weight: user.weight,
          furType: user.fur_type,
          createdAt: user.created_at,
          tipeBulu: user.tipe_bulu,
          gender: user.gender,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get user error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Terjadi kesalahan saat mengambil data user",
      },
      { status: 500 }
    );
  }
}
