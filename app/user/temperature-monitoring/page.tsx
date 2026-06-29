"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Thermometer, RefreshCw, Droplets } from "lucide-react";
import { getSession } from "@/lib/auth";
import { TemperatureMonitor } from "@/components/temperature-monitor";
import { TemperatureHistory } from "@/components/temperature-history";
import { useToast } from "@/hooks/use-toast";

export default function TemperatureMonitoringPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [waterTemperature, setWaterTemperature] = useState<number | null>(null);
  const [roomTemperature, setRoomTemperature] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSessionType, setActiveSessionType] = useState<"bathing" | "drying" | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session || session.type !== "user") {
      router.push("/user/login");
      return;
    }

    fetchTemperatures();
    findActiveSession();

    // Refresh every 3 seconds
    const interval = setInterval(() => {
      fetchTemperatures();
      findActiveSession();
    }, 3000);

    return () => clearInterval(interval);
  }, [router]);

  const findActiveSession = () => {
    // This would need to be implemented based on your session management
    // For now, we'll try to get the latest active session
    try {
      const bathingSessions = JSON.parse(localStorage.getItem("bathingSessions") || "[]");
      const dryingSessions = JSON.parse(localStorage.getItem("dryingSessions") || "[]");
      
      const activeBathing = bathingSessions.find((s: any) => s.status === "active");
      const activeDrying = dryingSessions.find((s: any) => s.status === "active");

      if (activeBathing) {
        setActiveSessionId(activeBathing.id);
        setActiveSessionType("bathing");
      } else if (activeDrying) {
        setActiveSessionId(activeDrying.id);
        setActiveSessionType("drying");
      } else {
        setActiveSessionId(null);
        setActiveSessionType(null);
      }
    } catch (error) {
      console.error("Error finding active session:", error);
    }
  };

  const fetchTemperatures = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/temperature");
      const result = await response.json();

      if (result.success) {
        setWaterTemperature(result.waterTemperature);
        setRoomTemperature(result.roomTemperature);
      }
    } catch (error) {
      console.error("Error fetching temperatures:", error);
      toast({
        title: "Error",
        description: "Gagal mengambil data suhu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/user/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Pemantauan Suhu Lengkap</h1>
          <p className="text-muted-foreground">
            Monitor suhu real-time dengan riwayat lengkap dari temperature_logs
          </p>
        </div>

        {/* Real-time Temperature Display */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-cyan-600" />
                  <CardTitle>Suhu Air</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchTemperatures}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <CardDescription>Data dari sesi pemandian</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-6xl font-bold text-cyan-600 mb-2">
                  {waterTemperature !== null ? `${waterTemperature.toString().replace(".", ",")}°C` : "--"}
                </div>
                {waterTemperature === null && (
                  <p className="text-sm text-muted-foreground">Menunggu data</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-blue-600" />
                  <CardTitle>Suhu Ruangan</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchTemperatures}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <CardDescription>Data dari sesi pengeringan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-6xl font-bold text-blue-600 mb-2">
                  {roomTemperature !== null ? `${roomTemperature.toString().replace(".", ",")}°C` : "--"}
                </div>
                {roomTemperature === null && (
                  <p className="text-sm text-muted-foreground">Menunggu data</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Temperature Monitor and History */}
        {activeSessionId && activeSessionType && (
          <div className="grid md:grid-cols-2 gap-6">
            <TemperatureMonitor
              temperature={activeSessionType === "bathing" ? (waterTemperature || 0) : (roomTemperature || 0)}
            />
            <TemperatureHistory
              sessionId={activeSessionId}
              sessionType={activeSessionType}
            />
          </div>
        )}

        {!activeSessionId && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Thermometer className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada sesi aktif</p>
                <p className="text-sm mt-2">
                  Mulai sesi pemandian atau pengeringan untuk melihat data suhu
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
