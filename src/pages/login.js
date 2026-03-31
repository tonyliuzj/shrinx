import Link from "next/link"
import { useRouter } from "next/router"
import { useState } from "react"
import { ArrowRight, KeyRound, Link2, Loader2, ShieldCheck, User } from "lucide-react"

import { withSessionSsr } from "../lib/session"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export const getServerSideProps = withSessionSsr(async ({ req }) => {
  const user = req.session.get("user")

  if (user?.isLoggedIn) {
    return { redirect: { destination: "/admin", permanent: false } }
  }

  return { props: {} }
})

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.message || "Login failed")
        setIsLoading(false)
        return
      }

      router.push("/admin")
    } catch {
      setError("An unexpected error occurred")
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[34px] border-border/70 bg-slate-950 text-white shadow-[0_32px_120px_-60px_rgba(15,23,42,0.75)]">
          <CardHeader className="space-y-4">
            <Badge className="w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
              Admin
            </Badge>
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10">
              <Link2 className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-4xl leading-tight tracking-tight text-white">
                Sign in.
              </CardTitle>
              <CardDescription className="max-w-xl text-base leading-7 text-slate-300">
                Manage redirects, domains, and settings.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              Secure admin access
            </div>
          </CardContent>
        </Card>

        <Card className="flex rounded-[34px] border-border/70 bg-card/92 shadow-[0_28px_90px_-52px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="flex flex-1 flex-col justify-center">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Admin
                  </p>
                  <CardTitle className="mt-1 text-3xl tracking-tight">
                    Login
                  </CardTitle>
                </div>
              </div>
              <CardDescription className="text-sm leading-6">
                Use your admin credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {error ? (
                <Alert
                  variant="destructive"
                  className="rounded-[24px] border-destructive/20 bg-destructive/5"
                >
                  <AlertTitle>Login failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      required
                      placeholder="Enter your username"
                      className="rounded-2xl pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      placeholder="Enter your password"
                      className="rounded-2xl pl-10"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-2xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <Button asChild variant="ghost" className="w-full rounded-2xl">
                <Link href="/">Back to homepage</Link>
              </Button>
            </CardContent>
          </div>
        </Card>
      </div>
    </main>
  )
}
