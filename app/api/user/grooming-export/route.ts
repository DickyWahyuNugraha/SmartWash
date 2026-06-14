import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdStr = searchParams.get("userId");
    if (!userIdStr) {
      return new NextResponse("Missing userId", { status: 400 });
    }

    const userId = parseInt(userIdStr);
    if (isNaN(userId)) {
      return new NextResponse("Invalid userId", { status: 400 });
    }

    // 1. Ambil data user/kucing dari PostgreSQL
    const userResult = await query(
      "SELECT email, cat_name, cat_type, age, age_unit, weight FROM users WHERE id = $1",
      [userId]
    );
    const user = userResult.rows[0] || null;

    if (!user) {
      return new NextResponse("User tidak ditemukan", { status: 404 });
    }

    // 2. Ambil data bathing sessions yang selesai
    const bathingResult = await query(
      `SELECT id, cat_name, temperature, status, start_time, end_time 
       FROM bathing_sessions 
       WHERE user_id = $1 AND status = 'completed' 
       ORDER BY start_time DESC`,
      [userId]
    );
    const bathingSessions = bathingResult.rows.map((row) => ({
      id: row.id.toString(),
      catName: row.cat_name,
      temperature: row.temperature,
      status: row.status,
      startTime: row.start_time ? new Date(row.start_time).toLocaleString("id-ID") : "-",
      endTime: row.end_time ? new Date(row.end_time).toLocaleString("id-ID") : "-",
    }));

    // 3. Ambil data drying sessions yang selesai
    const dryingResult = await query(
      `SELECT id, cat_name, temperature, status, start_time, end_time 
       FROM drying_sessions 
       WHERE user_id = $1 AND status = 'completed' 
       ORDER BY start_time DESC`,
      [userId]
    );
    const dryingSessions = dryingResult.rows.map((row) => ({
      id: row.id.toString(),
      catName: row.cat_name,
      temperature: row.temperature,
      status: row.status,
      startTime: row.start_time ? new Date(row.start_time).toLocaleString("id-ID") : "-",
      endTime: row.end_time ? new Date(row.end_time).toLocaleString("id-ID") : "-",
    }));

    // 4. Ambil data monitoring suhu
    const monitoringResult = await query(
      `SELECT id, suhu_air, suhu_ruangan, created_at 
       FROM monitoring 
       WHERE user_id = $1 
       ORDER BY created_at ASC`,
      [userId]
    );
    const logs = monitoringResult.rows.map((row) => ({
      id: row.id.toString(),
      timestamp: row.created_at ? new Date(row.created_at).toLocaleString("id-ID") : "-",
      suhuAir: row.suhu_air !== null ? `${parseFloat(row.suhu_air)}°C` : "-",
      suhuRuangan: row.suhu_ruangan !== null ? `${parseFloat(row.suhu_ruangan)}°C` : "-",
    }));

    // Buat PDF
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait (72 dpi)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 11;
    const lineHeight = 14;
    const margin = 40;
    let y = page.getHeight() - margin;

    const sanitize = (text: string) => {
      if (!text) return "";
      return String(text)
        .replace(/→/g, "->")
        .replace(/–/g, "-")
        .replace(/—/g, "-")
        .replace(/•/g, "-")
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/[^\x00-\x7F]/g, "?");
    };

    const drawText = (text: string, options?: { bold?: boolean; color?: { r: number; g: number; b: number } }) => {
      const usedFont = options?.bold ? fontBold : font;
      const color = options?.color ? rgb(options.color.r, options.color.g, options.color.b) : rgb(0, 0, 0);
      page.drawText(sanitize(text), { x: margin, y, size: fontSize, font: usedFont, color });
      y -= lineHeight;
    };

    const drawWrapped = (text: string, maxWidth: number) => {
      const words = sanitize(text).split(" ");
      let line = "";
      for (const w of words) {
        const test = line.length ? `${line} ${w}` : w;
        const width = font.widthOfTextAtSize(test, fontSize);
        if (width > maxWidth) {
          if (y < margin + lineHeight) {
            page = pdfDoc.addPage([595.28, 841.89]);
            y = page.getHeight() - margin;
          }
          page.drawText(line, { x: margin, y, size: fontSize, font });
          y -= lineHeight;
          line = w;
        } else {
          line = test;
        }
      }
      if (line) {
        if (y < margin + lineHeight) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = page.getHeight() - margin;
        }
        page.drawText(line, { x: margin, y, size: fontSize, font });
        y -= lineHeight;
      }
    };

    // Header
    drawText("Laporan Data Grooming", { bold: true });
    drawText(new Date().toLocaleString("id-ID"));
    y -= 6;

    // Profil kucing
    drawText("Profil Kucing", { bold: true, color: { r: 0.0, g: 0.4, b: 0.6 } });
    drawText(`Nama: ${user.cat_name ?? "-"}`);
    drawText(`Jenis: ${user.cat_type ?? "-"}`);
    drawText(
      `Umur: ${user.age ?? "-"} ${user.age_unit === "weeks" ? "minggu" : user.age_unit === "months" ? "bulan" : "tahun"}`
    );
    drawText(`Berat: ${user.weight ? (user.weight / 1000).toFixed(2) + " kg" : "-"}`);
    drawText(`Email: ${user.email ?? "-"}`);
    y -= 6;

    // Ringkasan sesi pemandian
    drawText("Sesi Pemandian (selesai)", { bold: true, color: { r: 0.0, g: 0.4, b: 0.6 } });
    if (bathingSessions.length === 0) {
      drawText("- Tidak ada data");
    } else {
      bathingSessions.forEach((s) => {
        drawWrapped(
          `• Sesi ${s.id} | ${s.catName} | Target: ${s.temperature}°C | ${s.startTime} -> ${s.endTime}`,
          page.getWidth() - margin * 2
        );
      });
    }
    y -= 6;

    // Ringkasan sesi pengeringan
    drawText("Sesi Pengeringan (selesai)", { bold: true, color: { r: 0.0, g: 0.4, b: 0.6 } });
    if (dryingSessions.length === 0) {
      drawText("- Tidak ada data");
    } else {
      dryingSessions.forEach((s) => {
        drawWrapped(
          `• Sesi ${s.id} | ${s.catName} | Target: ${s.temperature}°C | ${s.startTime} -> ${s.endTime}`,
          page.getWidth() - margin * 2
        );
      });
    }
    y -= 6;

    // Log suhu
    drawText("Log Telemetry Sensor", { bold: true, color: { r: 0.0, g: 0.4, b: 0.6 } });
    if (logs.length === 0) {
      drawText("- Tidak ada data");
    } else {
      logs.slice(0, 200).forEach((l) => {
        if (y < margin + lineHeight * 2) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = page.getHeight() - margin;
        }
        drawWrapped(
          `• ${l.timestamp} | Suhu Air: ${l.suhuAir} | Suhu Ruangan: ${l.suhuRuangan}`,
          page.getWidth() - margin * 2
        );
      });
    }

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="grooming-data-${userId}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Grooming export error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Export error" },
      { status: 500 }
    );
  }
}
