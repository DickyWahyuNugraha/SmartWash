"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Cat, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function UserRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState("");
  const [age, setAge] = useState(1);
  const [ageUnit, setAgeUnit] = useState<"weeks" | "months" | "years">(
    "months"
  );
  const [weight, setWeight] = useState(1);
  const [gender, setGender] = useState<"jantan" | "betina">("jantan");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Password tidak cocok",
        variant: "destructive",
      });
      return;
    }

    if (!catType) {
      toast({
        title: "Error",
        description: "Pilih jenis kucing",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          catName,
          catType,
          age,
          ageUnit,
          weight,
          password,
          gender,
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch (e) {
        throw new Error("Respon server tidak valid");
      }

      if (response.ok && result.success) {
        toast({
          title: "Registrasi Berhasil",
          description: "Silakan login dengan akun Anda",
          variant: "success",
        });
        router.push("/user/login");
      } else {
        toast({
          title: "Registrasi Gagal",
          description: result.message || "Terjadi kesalahan saat registrasi",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Registrasi Gagal",
        description: error.message || "Terjadi kesalahan saat menghubungi server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali
          </Link>
          <div className="mx-auto w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mb-4">
            <Cat className="w-8 h-8 text-cyan-600" />
          </div>
          <CardTitle className="text-2xl">Register Pengguna</CardTitle>
          <CardDescription>
            Daftarkan kucing Anda untuk perawatan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catName">Nama Kucing</Label>
              <Input
                id="catName"
                type="text"
                placeholder="Fluffy"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catType">Jenis Kucing</Label>
              <Select value={catType} onValueChange={setCatType}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis kucing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="persia">Persia</SelectItem>
                  <SelectItem value="anggora">Anggora</SelectItem>
                  <SelectItem value="maine-coon">Maine Coon</SelectItem>
                  <SelectItem value="british-shorthair">
                    British Shorthair
                  </SelectItem>
                  <SelectItem value="scottish-fold">Scottish Fold</SelectItem>
                  <SelectItem value="ragdoll">Ragdoll</SelectItem>
                  <SelectItem value="kampung">Kampung</SelectItem>
                  <SelectItem value="lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Jenis Kelamin</Label>
              <Select value={gender} onValueChange={(value: "jantan" | "betina") => setGender(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jantan">Jantan (Cowok)</SelectItem>
                  <SelectItem value="betina">Betina (Cewek)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Umur</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="30"
                  placeholder="1"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 1)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ageUnit">Satuan Umur</Label>
                <Select
                  value={ageUnit}
                  onValueChange={(value: "weeks" | "months" | "years") =>
                    setAgeUnit(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih satuan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weeks">Minggu</SelectItem>
                    <SelectItem value="months">Bulan</SelectItem>
                    <SelectItem value="years">Tahun</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Berat Badan (kg)</Label>
              <Input
                id="weight"
                type="number"
                min="0.1"
                max="20"
                step="0.1"
                placeholder="3.5"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 1)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-700"
              disabled={loading}
            >
              {loading ? "Memproses..." : "Register"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link
                href="/user/login"
                className="text-cyan-600 hover:underline"
              >
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
