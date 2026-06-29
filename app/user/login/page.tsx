"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cat, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function UserLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [catName, setCatName] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          catName,
          password,
        }),
      })

      const result = await response.json()

      if (result.success && result.user) {
        // Save session to localStorage
        const session = {
          id: result.user.id,
          type: "user" as const,
          catName: result.user.catName,
        }
        localStorage.setItem("session", JSON.stringify(session))

        toast({
          title: "Login Berhasil",
          description: `Selamat datang, ${catName}!`,
          variant: "success",
        })
        router.push("/user/dashboard")
      } else {
        toast({
          title: "Login Gagal",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Login Gagal",
        description: "Terjadi kesalahan saat menghubungi server",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali
          </Link>
          <div className="mx-auto w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mb-4">
            <Cat className="w-8 h-8 text-cyan-600" />
          </div>
          <CardTitle className="text-2xl">Login Pengguna</CardTitle>
          <CardDescription>Masuk untuk mengontrol perawatan kucing</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
            <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={loading}>
              {loading ? "Memproses..." : "Login"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link href="/user/register" className="text-cyan-600 hover:underline">
                Register
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
