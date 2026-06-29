"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Wifi,
  WifiOff,
  Search,
  Settings,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Signal,
  SignalZero,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWiFi } from "@/hooks/use-wifi";

export default function WiFiConnection() {
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");

  const { toast } = useToast();
  const {
    isConnected,
    isConnecting,
    isScanning,
    currentNetwork,
    availableNetworks,
    espDevices,
    autoConnect,
    connectToWiFi,
    disconnectWiFi,
    scanWiFiNetworks,
    scanESPDevices,
    connectToESP,
    setAutoConnect,
  } = useWiFi();

  // Handle WiFi connection
  const handleConnectToWiFi = async () => {
    if (!selectedNetwork) {
      toast({
        title: "Error",
        description: "Pilih jaringan WiFi terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const success = await connectToWiFi(selectedNetwork, wifiPassword);

    if (success) {
      toast({
        title: "Berhasil Terhubung",
        description: `Terhubung ke ${selectedNetwork}`,
        variant: "success",
      });
    } else {
      toast({
        title: "Gagal Terhubung",
        description: "Password salah atau jaringan tidak tersedia",
        variant: "destructive",
      });
    }
  };

  // Handle WiFi disconnection
  const handleDisconnectWiFi = () => {
    disconnectWiFi();
    toast({
      title: "WiFi Terputus",
      description: "Koneksi WiFi telah diputus",
      variant: "success",
    });
  };

  // Handle WiFi scanning
  const handleScanWiFi = async () => {
    await scanWiFiNetworks();
    toast({
      title: "Scan Selesai",
      description: `Ditemukan ${availableNetworks.length} jaringan WiFi`,
      variant: "success",
    });
  };

  // Handle ESP device scanning
  const handleScanESP = async () => {
    await scanESPDevices();
    toast({
      title: "ESP Devices Ditemukan",
      description: `${espDevices.length} alat ESP terhubung`,
      variant: "success",
    });
  };

  // Handle ESP device connection
  const handleConnectToESP = async (deviceId: string) => {
    const device = espDevices.find((d) => d.id === deviceId);
    if (!device) return;

    const success = await connectToESP(deviceId);

    if (success) {
      toast({
        title: "ESP Terhubung",
        description: `Berhasil terhubung ke ${device.name}`,
        variant: "success",
      });
    }
  };

  const getSignalIcon = (signal: number) => {
    if (signal >= 75) return <Signal className="w-4 h-4 text-green-500" />;
    if (signal >= 50) return <Signal className="w-4 h-4 text-yellow-500" />;
    return <SignalZero className="w-4 h-4 text-red-500" />;
  };

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      case "disconnected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* WiFi Connection Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Wifi className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Koneksi WiFi</CardTitle>
                <CardDescription>
                  Kelola koneksi WiFi untuk ESP devices
                </CardDescription>
              </div>
            </div>
            <Badge
              className={`${
                isConnected
                  ? "bg-green-500"
                  : isConnecting
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            >
              {isConnected
                ? "Terhubung"
                : isConnecting
                ? "Menghubungkan"
                : "Terputus"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* WiFi Settings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={autoConnect}
                onCheckedChange={setAutoConnect}
                id="auto-connect"
              />
              <Label htmlFor="auto-connect">Auto-scan ESP devices</Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleScanWiFi}
              disabled={isScanning}
            >
              {isScanning ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Scan WiFi
            </Button>
          </div>

          {/* Available Networks */}
          {availableNetworks.length > 0 && (
            <div className="space-y-2">
              <Label>Jaringan WiFi Tersedia</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableNetworks.map((network, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedNetwork === network.ssid
                        ? "border-blue-500 bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedNetwork(network.ssid)}
                  >
                    <div className="flex items-center gap-3">
                      {getSignalIcon(network.signal)}
                      <div>
                        <div className="font-medium">{network.ssid}</div>
                        <div className="text-sm text-muted-foreground">
                          {network.security} • {network.signal}%
                        </div>
                      </div>
                    </div>
                    {selectedNetwork === network.ssid && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Password Input */}
          {selectedNetwork && (
            <div className="space-y-2">
              <Label htmlFor="wifi-password">Password WiFi</Label>
              <Input
                id="wifi-password"
                type="password"
                placeholder="Masukkan password WiFi"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
              />
            </div>
          )}

          {/* Connection Actions */}
          <div className="flex gap-2">
            {!isConnected ? (
              <Button
                onClick={handleConnectToWiFi}
                disabled={isConnecting || !selectedNetwork}
                className="flex-1"
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wifi className="w-4 h-4 mr-2" />
                )}
                {isConnecting ? "Menghubungkan..." : "Hubungkan"}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleDisconnectWiFi}
                className="flex-1"
              >
                <WifiOff className="w-4 h-4 mr-2" />
                Putuskan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ESP Devices Card */}
      {isConnected && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Settings className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>ESP Devices</CardTitle>
                  <CardDescription>Alat ESP yang terhubung</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={`${
                    espDevices.length > 0 ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  {espDevices.length > 0 ? "Online" : "Offline"}
                </Badge>
                <Button variant="outline" size="sm" onClick={handleScanESP}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {espDevices.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Tidak ada ESP devices yang ditemukan. Pastikan perangkat ESP
                  sudah menyala dan terhubung ke jaringan yang sama.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {espDevices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${getConnectionStatusColor(
                          device.status
                        )}`}
                      />
                      <div>
                        <div className="font-medium">{device.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {device.ip}:{device.port}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Terakhir dilihat:{" "}
                          {device.lastSeen.toLocaleTimeString("id-ID")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {device.status === "connected" ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Terhubung
                        </Badge>
                      ) : device.status === "connecting" ? (
                        <Badge className="bg-yellow-500">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Menghubungkan
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleConnectToESP(device.id)}
                          disabled={false}
                        >
                          <Wifi className="w-4 h-4 mr-1" />
                          Hubungkan
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
