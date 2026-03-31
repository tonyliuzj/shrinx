import Head from "next/head"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, Link2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function ErrorPage() {
  return (
    <>
      <Head>
        <title>Error · Link Guide</title>
      </Head>

      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl items-center">
          <Card className="w-full rounded-[34px] border-border/70 bg-card/92 shadow-[0_28px_90px_-52px_rgba(15,23,42,0.35)] backdrop-blur">
            <CardHeader className="items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <Badge variant="destructive" className="rounded-full px-3 py-1">
                Route unavailable
              </Badge>
              <div className="space-y-2">
                <CardTitle className="text-4xl tracking-tight">404</CardTitle>
                <CardDescription className="mx-auto max-w-xl text-base leading-7">
                  The link you tried to open does not exist, has been removed,
                  or is no longer attached to an active route.
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
                      Need another route?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Return to the Link Guide homepage to create or access a
                      different redirect.
                    </p>
                  </div>
                </div>
              </div>

              <Button asChild size="lg" className="w-full rounded-2xl">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                  Back to homepage
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}

export async function getServerSideProps() {
  return {
    props: {},
  }
}
