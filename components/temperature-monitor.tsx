"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Thermometer, RefreshCw } from "lucide-react";

interface TemperatureMonitorProps {
  temperature: number | null;
  minTemp?: number;
  maxTemp?: number;
  isLoading?: boolean;
  lastUpdated?: Date | null;
  label?: string;
}

export function TemperatureMonitor({
  temperature,
  minTemp = 20,
  maxTemp = 45,
  isLoading = false,
  lastUpdated = null,
  label = "Suhu air saat ini",
}: TemperatureMonitorProps) {
  const [displayTemp, setDisplayTemp] = useState(temperature ?? 0);

  useEffect(() => {
    if (temperature !== null) {
      setDisplayTemp(temperature);
    }
  }, [temperature]);

  const percentage = ((displayTemp - minTemp) / (maxTemp - minTemp)) * 100;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  const getTemperatureColor = () => {
    if (displayTemp < 30) return "text-blue-600";
    if (displayTemp < 38) return "text-green-600";
    if (displayTemp < 42) return "text-orange-600";
    return "text-red-600";
  };

  const getTemperatureStatus = () => {
    if (displayTemp < 30) return "Dingin";
    if (displayTemp < 38) return "Normal";
    if (displayTemp < 42) return "Hangat";
    return "Panas";
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return null;
    return lastUpdated.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-cyan-600" />
            <CardTitle>Monitor Suhu</CardTitle>
          </div>
          {isLoading && (
            <RefreshCw className="w-4 h-4 text-cyan-600 animate-spin" />
          )}
        </div>
        <CardDescription className="flex items-center justify-between">
          <span>{label}</span>
          {lastUpdated && (
            <span className="text-xs">Update: {formatLastUpdated()}</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            {temperature === null ? (
              <div className="text-2xl text-muted-foreground">
                Tidak ada data
              </div>
            ) : (
              <>
                <div className={`text-6xl font-bold ${getTemperatureColor()}`}>
                  {displayTemp.toString().replace(".", ",")}°C
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {getTemperatureStatus()}
                </div>
              </>
            )}
          </div>

          {temperature !== null && (
            <>
              <div className="relative h-8 bg-gradient-to-r from-blue-200 via-green-200 via-orange-200 to-red-200 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-green-500 via-orange-500 to-red-500 transition-all duration-500"
                  style={{ width: `${clampedPercentage}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-1 h-10 bg-white border-2 border-gray-800 transition-all duration-500"
                  style={{ left: `${clampedPercentage}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{minTemp}°C</span>
                <span>{maxTemp}°C</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
