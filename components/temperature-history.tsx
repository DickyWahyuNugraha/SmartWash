"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";

interface TemperatureHistoryProps {
  sessionId: string;
  sessionType: "bathing" | "drying";
}

interface TemperatureLogData {
  id: string;
  temperature: number;
  timestamp: string;
}

export function TemperatureHistory({
  sessionId,
  sessionType,
}: TemperatureHistoryProps) {
  const [logs, setLogs] = useState<TemperatureLogData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(
          `/api/user/temperature?sessionId=${encodeURIComponent(sessionId)}&sessionType=${encodeURIComponent(sessionType)}`
        );
        const result = await response.json();

        if (result.success && result.logs) {
          // Sesuaikan format data log untuk chart
          const formattedLogs: TemperatureLogData[] = result.logs.map((log: any) => ({
            id: log.id || Math.random().toString(),
            temperature: typeof log.temperature === "number" ? log.temperature : parseFloat(log.temperature || "0"),
            timestamp: log.timestamp || new Date().toISOString(),
          }));

          // Sort timestamp secara ascending untuk chart
          formattedLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          setLogs(formattedLogs);
        }
      } catch (error) {
        console.error("Error fetching temperature logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();

    // Polling data log setiap 3 detik
    const interval = setInterval(fetchLogs, 3000);

    return () => clearInterval(interval);
  }, [sessionId, sessionType]);

  const displayLogs = logs.slice(-20); // Ambil 20 data pembacaan terakhir

  const chartData = displayLogs.map((log, index) => ({
    time: index + 1,
    temperature: Math.round(log.temperature * 10) / 10,
  }));

  const avgTemp =
    displayLogs.length > 0
      ? (
          displayLogs.reduce((sum, log) => sum + log.temperature, 0) /
          displayLogs.length
        ).toFixed(1)
      : "0";

  const minTemp =
    displayLogs.length > 0
      ? Math.round(Math.min(...displayLogs.map((l) => l.temperature)) * 10) / 10
      : 0;
  const maxTemp =
    displayLogs.length > 0
      ? Math.round(Math.max(...displayLogs.map((l) => l.temperature)) * 10) / 10
      : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
          <span className="ml-2 text-muted-foreground">
            Memuat data suhu...
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-600" />
          <CardTitle>Riwayat Suhu</CardTitle>
        </div>
        <CardDescription>
          Grafik perubahan suhu selama sesi (realtime dari database)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {displayLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Belum ada data suhu
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-600">
                  {avgTemp.replace(".", ",")}°C
                </div>
                <div className="text-xs text-muted-foreground">Rata-rata</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {minTemp.toString().replace(".", ",")}°C
                </div>
                <div className="text-xs text-muted-foreground">Minimum</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {maxTemp.toString().replace(".", ",")}°C
                </div>
                <div className="text-xs text-muted-foreground">Maksimum</div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  label={{
                    value: "Waktu",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis
                  label={{
                    value: "Suhu (°C)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                  domain={["dataMin - 1", "dataMax + 1"]}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}°C`, "Suhu"]}
                  labelFormatter={(label) => `Pembacaan ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#0891b2"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
