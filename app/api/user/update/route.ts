import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

async function handleUpdate(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId: userIdStr, age, ageUnit, weight, gender, catName, catType, password } = body;

    // Validate input
    if (!userIdStr) {
      return NextResponse.json(
        { success: false, message: "User ID diperlukan" },
        { status: 400 }
      );
    }

    if (age === undefined || !ageUnit || weight === undefined || !gender || !catName || !catType) {
      return NextResponse.json(
        { success: false, message: "Semua field profil harus diisi" },
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

    // Check if new catName already exists for another user
    const checkNameResult = await query(
      "SELECT id FROM users WHERE cat_name = $1 AND id != $2 LIMIT 1",
      [catName, userId]
    );
    if (checkNameResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: "Nama kucing sudah terdaftar" },
        { status: 400 }
      );
    }

    // Weight is stored as integer (in grams), so multiply by 1000
    const weightInGrams = Math.round(parseFloat(weight.toString()) * 1000);

    // Check if user exists in PostgreSQL
    const checkResult = await query("SELECT id FROM users WHERE id = $1 LIMIT 1", [userId]);
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Update user in PostgreSQL
    const updateResult = await query(
      `UPDATE users
       SET age = $1, 
           age_unit = $2, 
           weight = $3, 
           gender = $4, 
           cat_name = $5, 
           cat_type = $6, 
           password = COALESCE(NULLIF($7, ''), password)
       WHERE id = $8
       RETURNING id, email, cat_name, cat_type, age, age_unit, weight, fur_type, created_at, tipe_bulu, gender`,
      [
        parseInt(age.toString()), 
        ageUnit, 
        weightInGrams, 
        gender, 
        catName, 
        catType, 
        password || "", 
        userId
      ]
    );

    const updatedUser = updateResult.rows[0];

    console.log("[Update API] Successfully updated user:", updatedUser.cat_name);

    return NextResponse.json(
      {
        success: true,
        message: "Profil berhasil diperbarui",
        user: {
          id: updatedUser.id.toString(), // Convert to string for client compatibility
          email: updatedUser.email,
          catName: updatedUser.cat_name,
          catType: updatedUser.cat_type,
          age: updatedUser.age,
          ageUnit: updatedUser.age_unit,
          weight: updatedUser.weight,
          furType: updatedUser.fur_type,
          createdAt: updatedUser.created_at,
          tipeBulu: updatedUser.tipe_bulu,
          gender: updatedUser.gender,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Terjadi kesalahan saat memperbarui profil",
      },
      { status: 500 }
    );
  }
}

// Support both PUT and POST for robustness
export async function PUT(request: NextRequest) {
  return handleUpdate(request);
}

export async function POST(request: NextRequest) {
  return handleUpdate(request);
}
