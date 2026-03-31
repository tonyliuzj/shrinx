import Head from "next/head"
import Link from "next/link"
import { useState } from "react"
import { ArrowRight, CheckCheck, CheckCircle2, Copy, Link2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function Success({ path, domain }) {
  const shortUrl = `${domain}/url/${path}`
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <>
      <Head>
        <title>Success · Link Guide</title>
      </Head>

      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl items-center">
          <Card className="w-full rounded-[34px] border-border/70 bg-card/92 shadow-[0_28px_90px_-52px_rgba(15,23,42,0.35)] backdrop-blur">
            <CardHeader className="items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <Badge className="rounded-full px-3 py-1">Redirect created</Badge>
              <div className="space-y-2">
                <CardTitle className="text-4xl tracking-tight">
                  Your short link is ready.
                </CardTitle>
                <CardDescription className="mx-auto max-w-xl text-base leading-7">
                  Link Guide published the route successfully and returned a
                  shareable short URL immediately.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-[24px] border border-border/70 bg-muted/40 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Link2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Published route
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Copy and share this URL.
                    </p>
                  </div>
                </div>
                <p className="mt-4 break-all rounded-2xl border border-border/70 bg-card px-4 py-3 font-mono text-sm text-foreground shadow-sm">
                  {shortUrl}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  size="lg"
                  className={cn(
                    "rounded-2xl",
                    copied && "bg-emerald-600 hover:bg-emerald-600"
                  )}
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <>
                      <CheckCheck className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy short URL
                    </>
                  )}
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-2xl">
                  <Link href="/">
                    Create another
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}

export async function getServerSideProps({ query }) {
  const { path = "", domain = "" } = query

  return {
    props: {
      path,
      domain,
    },
  }
}
