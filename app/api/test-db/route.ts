import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    connectionHost: process.env.PGHOST || "not set",
    connectionUser: process.env.PGUSER || "not set",
    connectionDatabase: process.env.PGDATABASE || "not set",
    hasPassword: !!process.env.PGPASSWORD,
    sslEnabled: process.env.PGHOST && process.env.PGHOST !== "localhost" && process.env.PGHOST !== "127.0.0.1",
  };

  try {
    // 1. Test basic connectivity
    const timeStart = Date.now();
    const timeRes = await query("SELECT NOW() as db_time");
    debugInfo.pingMs = Date.now() - timeStart;
    debugInfo.dbTime = timeRes.rows[0]?.db_time;
    debugInfo.connectionSuccess = true;

    // 2. Check if tables exist
    const tablesRes = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    debugInfo.tables = tablesRes.rows.map(r => r.table_name);

    // 3. Check users count if table exists
    if (debugInfo.tables.includes("users")) {
      const usersRes = await query("SELECT COUNT(*) as count FROM users");
      debugInfo.usersCount = parseInt(usersRes.rows[0]?.count || "0");
      
      // Let's get the users columns
      const colsRes = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
      `);
      debugInfo.usersColumns = colsRes.rows.map(r => `${r.column_name} (${r.data_type})`);
    }

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      debugInfo
    }, { status: 200 });

  } catch (error: any) {
    console.error("[Test DB API Error]:", error);
    return NextResponse.json({
      success: false,
      message: "Database connection failed",
      error: {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      },
      debugInfo
    }, { status: 500 });
  }
}
