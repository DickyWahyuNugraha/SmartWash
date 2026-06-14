import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, catName, catType, age, ageUnit, weight, password, gender } = body;

    // Validate input
    if (!email || !catName || !catType || !age || !ageUnit || !weight || !password || !gender) {
      return NextResponse.json(
        { success: false, message: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    // Check if email already exists in SQL users table
    const checkEmailResult = await query("SELECT id FROM users WHERE email = $1 LIMIT 1", [email]);

    if (checkEmailResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Check if cat name already exists in SQL users table
    const checkResult = await query("SELECT id FROM users WHERE cat_name = $1 LIMIT 1", [catName]);

    if (checkResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: "Nama kucing sudah terdaftar" },
        { status: 400 }
      );
    }

    // Convert weight in kg to grams for consistent SQL storage (e.g. 3.5 kg -> 3500 g)
    const weightInGrams = Math.round(parseFloat(weight.toString()) * 1000);

    // Create new user in PostgreSQL
    const insertUserResult = await query(
      `INSERT INTO users (email, password, cat_name, cat_type, age, age_unit, weight, fur_type, created_at, tipe_bulu, gender)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, $9, $10)
       RETURNING id, email, cat_name, cat_type, age, age_unit, weight, fur_type, created_at, tipe_bulu, gender`,
      [
        email,
        password, // stored plain-text as per design
        catName,
        catType,
        parseInt(age.toString()),
        ageUnit,
        weightInGrams,
        "short", // default fur_type
        0,       // default tipe_bulu integer
        gender,
      ]
    );

    const newUser = insertUserResult.rows[0];

    // Seed a corresponding row in the 'control' table for this user
    await query(
      `INSERT INTO control (command, tipe_bulu, user_id, fur_type, updated_at)
       VALUES ('idle', 0, $1, 'short', CURRENT_TIMESTAMP)`,
      [newUser.id]
    );

    console.log("[Register API] Successfully registered user and seeded control:", newUser);

    return NextResponse.json(
      {
        success: true,
        message: "Registrasi berhasil",
        user: {
          id: newUser.id.toString(), // Convert to string for client compatibility
          email: newUser.email,
          catName: newUser.cat_name,
          catType: newUser.cat_type,
          age: newUser.age,
          ageUnit: newUser.age_unit,
          weight: newUser.weight,
          furType: newUser.fur_type,
          createdAt: newUser.created_at,
          tipeBulu: newUser.tipe_bulu,
          gender: newUser.gender,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    
    // Check for PostgreSQL unique constraint violation
    if (error.code === "23505") {
      let duplicateField = "Data";
      if (error.detail && error.detail.includes("email")) {
        duplicateField = "Email";
      } else if (error.detail && error.detail.includes("cat_name")) {
        duplicateField = "Nama kucing";
      }
      return NextResponse.json(
        {
          success: false,
          message: `${duplicateField} sudah terdaftar`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Terjadi kesalahan saat registrasi",
      },
      { status: 500 }
    );
  }
}
