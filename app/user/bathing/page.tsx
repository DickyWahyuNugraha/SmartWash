"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Droplets,
  Square,
  Clock,
  Loader2,
} from "lucide-react";
import { getSession, type User } from "@/lib/auth";
import {
  createBathingSessionFirestore,
  endBathingSessionFirestore,
  addTemperatureLogFirestore,
  getActiveBathingSession,
} from "@/lib/firestore-service";
import { useToast } from "@/hooks/use-toast";
import { useSensorData } from "@/hooks/use-sensor-data";

interface ActiveSession {
  id: string;
  userId: string;
  catName: string;
  temperature: number;
  startTime: string;
  status: string;
}

export default function BathingControlPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    null,
  );
  const [temperature, setTemperature] = useState(35);
  const [duration, setDuration] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const autoContinue = searchParams.get("autoContinue") === "true";

  // Real-time sensor data polling every 5 seconds
  const sensorData = useSensorData({ pollingInterval: 5000 });

  const checkActiveSession = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const active = await getActiveBathingSession(userId);
      if (active) {
        setActiveSession(active as ActiveSession);
        setTemperature(active.temperature || 35);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking active session:", error);
      return false;
    }
  }, []);

  const handleStartAuto = useCallback(async (userData: User) => {
    setIsLoading(true);
    try {
      const sessionId = await createBathingSessionFirestore({
        userId: userData.id,
        catName: userData.catName,
        temperature: 35, // Default temperature
      });

      const newSession: ActiveSession = {
        id: sessionId,
        userId: userData.id,
        catName: userData.catName,
        temperature: 35,
        startTime: new Date().toISOString(),
        status: "active",
      };

      setActiveSession(newSession);

      // Log initial temperature
      await addTemperatureLogFirestore({
        sessionId,
        sessionType: "bathing",
        userId: userData.id,
        catName: userData.catName,
        temperature: 35,
      });

      toast({
        title: "Pemandian Dimulai",
        description: "Sesi pemandian telah dimulai secara otomatis",
        variant: "success",
      });
    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        title: "Error",
        description: "Gagal memulai sesi pemandian",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const session = getSession();
    if (!session || session.type !== "user") {
      router.push("/user/login");
      return;
    }

    // Fetch user data from database
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/user/me?id=${session.id}`);
        const result = await response.json();

        if (result.success && result.user) {
          setUser(result.user as User);
          const hasActiveSession = await checkActiveSession(result.user.id);
          // Auto-start if no active session
          if (!hasActiveSession) {
            handleStartAuto(result.user as User);
          }
        } else {
          router.push("/user/login");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/user/login");
      }
    };

    fetchUser();
  }, [router, checkActiveSession, handleStartAuto]);

  useEffect(() => {
    if (activeSession) {
      const id = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - new Date(activeSession.startTime).getTime()) / 1000,
        );
        setDuration(elapsed);

        // Log temperature every 10 seconds to Firestore (from sensor data)
        if (
          elapsed % 10 === 0 &&
          user &&
          sensorData.waterTemperature !== null
        ) {
          addTemperatureLogFirestore({
            sessionId: activeSession.id,
            sessionType: "bathing",
            userId: user.id,
            catName: user.catName,
            temperature: sensorData.waterTemperature,
          }).catch(console.error);
        }
      }, 1000);

      setIntervalId(id);

      return () => clearInterval(id);
    } else {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      setDuration(0);
    }
  }, [activeSession, user, sensorData.waterTemperature]);


  const handleStart = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const sessionId = await createBathingSessionFirestore({
        userId: user.id,
        catName: user.catName,
        temperature,
      });

      const newSession: ActiveSession = {
        id: sessionId,
        userId: user.id,
        catName: user.catName,
        temperature,
        startTime: new Date().toISOString(),
        status: "active",
      };

      setActiveSession(newSession);

      // Log initial temperature
      await addTemperatureLogFirestore({
        sessionId,
        sessionType: "bathing",
        userId: user.id,
        catName: user.catName,
        temperature,
      });

      toast({
        title: "Pemandian Dimulai",
        description: "Sesi pemandian telah dimulai dan disimpan ke Firestore",
        variant: "success",
      });
    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        title: "Error",
        description: "Gagal memulai sesi pemandian",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (!activeSession) return;

    setIsLoading(true);
    try {
      await endBathingSessionFirestore(activeSession.id);
      setActiveSession(null);

      if (autoContinue) {
        toast({
          title: "Pemandian Selesai",
          description: "Mengalihkan ke halaman pengeringan...",
          variant: "success",
        });
        setTimeout(() => {
          router.push("/user/drying");
        }, 1500);
      } else {
        toast({
          title: "Pemandian Selesai",
          description: "Sesi pemandian telah dihentikan dan disimpan",
          variant: "success",
        });
      }
    } catch (error) {
      console.error("Error stopping session:", error);
      toast({
        title: "Error",
        description: "Gagal menghentikan sesi pemandian",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/user/dashboard")}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center">
              <Droplets className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Kontrol Pemandian</h1>
              <p className="text-sm text-muted-foreground">{user.catName}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {activeSession && (
            <Card className="border-2 border-cyan-500 bg-cyan-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-cyan-600">Aktif</Badge>
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Clock className="w-5 h-5" />
                      {formatDuration(duration)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Kontrol Pemandian</CardTitle>
              <CardDescription>
                {activeSession ? "Proses pemandian sedang berjalan" : "Memulai proses pemandian..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeSession ? (
                <Button
                  onClick={handleStop}
                  variant="destructive"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Square className="w-5 h-5 mr-2" />
                  )}
                  Hentikan Pemandian
                </Button>
              ) : (
                <div className="text-center py-4">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-cyan-600" />
                  <p className="mt-2 text-sm text-muted-foreground">Memulai proses pemandian...</p>
                </div>
              )}

              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <p className="font-medium">Tips Pemandian:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Suhu ideal untuk kucing: 35-38°C</li>
                  <li>Durasi pemandian: 5-10 menit</li>
                  <li>Pastikan air tidak masuk ke telinga kucing</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
