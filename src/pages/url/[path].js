import Head from "next/head"
import dynamic from "next/dynamic"
import { useState } from "react"
import {
  ArrowRight,
  CheckCircle2,
  Link2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react"

import { openDB } from "@/data/database"
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
import {
  REDIRECT_ACCESS_TYPES,
  getRedirectAccessOption,
  normalizeRedirectAccessType,
} from "@/lib/redirectOptions"
import {
  getRedirectDomainCandidates,
  shouldRedirectToPrimaryDomain,
} from "@/lib/requestHost"

const Turnstile = dynamic(
  () =>
    import("@marsidev/react-turnstile").then((mod) => mod.Turnstile),
  { ssr: false }
)

export default function UrlRedirect({
  path,
  accessType,
  shortUrl,
  turnstileSiteKey,
  captchaConfigured,
}) {
  const [password, setPassword] = useState("")
  const [token, setToken] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [turnstileRenderKey, setTurnstileRenderKey] = useState(0)
  const accessOption = getRedirectAccessOption(accessType)
  const requiresTurnstile =
    captchaConfigured &&
    (accessType === REDIRECT_ACCESS_TYPES.CAPTCHA ||
      accessType === REDIRECT_ACCESS_TYPES.PASSWORD)
  const passwordRequiresCaptcha =
    accessType === REDIRECT_ACCESS_TYPES.PASSWORD && requiresTurnstile

  const resetTurnstile = () => {
    setToken("")
    setTurnstileRenderKey((current) => current + 1)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (requiresTurnstile && !token) {
      setError("Please complete the captcha before continuing.")
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/url/${encodeURIComponent(path)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          turnstileResponse: token,
        }),
      })

      const body = await res.json()

      if (!res.ok) {
        setError(body.message || "Unable to continue to the destination.")
        if (requiresTurnstile) {
          resetTurnstile()
        }
      } else {
        window.location.href = body.redirectUrl
      }
    } catch {
      setError("Unable to continue to the destination.")
      if (requiresTurnstile) {
        resetTurnstile()
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!accessType || accessType === REDIRECT_ACCESS_TYPES.SIMPLE) {
    return null
  }

  const AccessIcon =
    accessType === REDIRECT_ACCESS_TYPES.PASSWORD ? LockKeyhole : ShieldCheck

  return (
    <>
      <Head>
        <title>Protected Link | Link Guide</title>
      </Head>

      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-[34px] border-border/70 bg-slate-950 text-white shadow-[0_32px_120px_-60px_rgba(15,23,42,0.75)]">
            <CardHeader className="space-y-5">
              <Badge className="w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
                Protected redirect
              </Badge>
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10">
                <Link2 className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <CardTitle className="text-4xl leading-tight tracking-tight text-white">
                  This route needs one more step before redirecting.
                </CardTitle>
                <CardDescription className="text-base leading-7 text-slate-300">
                  Link Guide is protecting this destination with{" "}
                  {accessOption.label.toLowerCase()} access.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Short URL
                </p>
                <p className="mt-3 break-all text-sm text-slate-100">{shortUrl}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Access mode
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  {accessOption.description}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Protection summary
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  {accessType === REDIRECT_ACCESS_TYPES.PASSWORD
                    ? passwordRequiresCaptcha
                      ? "Visitors must enter the password and complete Turnstile."
                      : "Visitors must enter the password to continue."
                    : "Visitors must complete Turnstile before continuing."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex rounded-[34px] border-border/70 bg-card/92 shadow-[0_28px_90px_-52px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="flex flex-1 flex-col justify-center">
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <AccessIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Continue to destination
                    </p>
                    <CardTitle className="mt-1 text-3xl tracking-tight">
                      {accessType === REDIRECT_ACCESS_TYPES.PASSWORD
                        ? "Verify access"
                        : "Complete protection check"}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className="text-sm leading-6">
                  {accessType === REDIRECT_ACCESS_TYPES.PASSWORD
                    ? passwordRequiresCaptcha
                      ? "Enter the password and complete the Turnstile challenge to unlock this redirect."
                      : "Enter the password to unlock this redirect."
                    : "Complete the Turnstile challenge to continue to the destination."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {error ? (
                  <Alert
                    variant="destructive"
                    className="rounded-[24px] border-destructive/20 bg-destructive/5"
                  >
                    <AlertTitle>Access check failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                {!captchaConfigured &&
                accessType === REDIRECT_ACCESS_TYPES.CAPTCHA ? (
                  <Alert className="rounded-[24px] border-amber-200 bg-amber-50 text-amber-950">
                    <AlertTitle>Turnstile is not configured</AlertTitle>
                    <AlertDescription>
                      This redirect requires captcha access, but Turnstile keys
                      are not available for this workspace.
                    </AlertDescription>
                  </Alert>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {accessType === REDIRECT_ACCESS_TYPES.PASSWORD ? (
                    <div className="space-y-2">
                      <Label htmlFor="password">Redirect password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Enter password"
                        required
                        className="rounded-2xl"
                      />
                    </div>
                  ) : null}

                  {requiresTurnstile ? (
                    <div className="flex justify-center rounded-[24px] border border-border/70 bg-muted/40 px-4 py-5">
                      <Turnstile
                        key={turnstileRenderKey}
                        siteKey={turnstileSiteKey}
                        onSuccess={(value) => setToken(value)}
                        onExpire={() => setToken("")}
                        onError={() => {
                          setToken("")
                          setError("Captcha failed, please try again.")
                        }}
                      />
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full rounded-2xl"
                    disabled={submitting}
                  >
                    {submitting ? "Checking access" : "Continue"}
                    {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
                  </Button>
                </form>

                <div className="rounded-[24px] border border-border/70 bg-muted/40 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Protected by Link Guide
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {accessType === REDIRECT_ACCESS_TYPES.PASSWORD
                      ? passwordRequiresCaptcha
                        ? "The destination opens immediately after both checks succeed."
                        : "The destination opens immediately after the password is verified."
                      : "The destination opens immediately after captcha verification."}
                  </p>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      </main>
    </>
  )
}

export async function getServerSideProps({ params, req }) {
  const { path } = params
  const requestHost = req.headers.host
  const db = await openDB()

  try {
    const primaryDomainSetting = await db.get(
      "SELECT value FROM settings WHERE key = ?",
      "primary_domain"
    )

    if (primaryDomainSetting?.value) {
      const primaryDomain = primaryDomainSetting.value

      if (shouldRedirectToPrimaryDomain(requestHost, primaryDomain)) {
        const protocol = req.headers["x-forwarded-proto"] || "http"

        return {
          redirect: {
            destination: `${protocol}://${primaryDomain}${req.url}`,
            permanent: true,
          },
        }
      }
    }

    const primaryDomain = primaryDomainSetting?.value || ""
    const domainCandidates = getRedirectDomainCandidates(requestHost, primaryDomain)
    const domainPlaceholders = domainCandidates.map(() => "?").join(", ")

    const domainExists = await db.get(
      `SELECT id FROM domains WHERE domain IN (${domainPlaceholders})`,
      ...domainCandidates
    )

    if (!domainExists) {
      return { notFound: true }
    }

    const row = await db.get(
      `SELECT redirect_url, access_type FROM paths WHERE path = ? AND domain IN (${domainPlaceholders})`,
      path,
      ...domainCandidates
    )

    if (!row) {
      return { notFound: true }
    }

    const accessType = normalizeRedirectAccessType(row.access_type)

    if (accessType === REDIRECT_ACCESS_TYPES.SIMPLE) {
      return {
        redirect: {
          destination: row.redirect_url,
          permanent: false,
        },
      }
    }

    const requiresTurnstile =
      accessType === REDIRECT_ACCESS_TYPES.CAPTCHA ||
      accessType === REDIRECT_ACCESS_TYPES.PASSWORD
    const turnstileSiteKeyRow = requiresTurnstile
      ? await db.get(
          "SELECT value FROM settings WHERE key = ?",
          "turnstile_site_key"
        )
      : null
    const turnstileSecretKeyRow = requiresTurnstile
      ? await db.get(
          "SELECT value FROM settings WHERE key = ?",
          "turnstile_secret_key"
        )
      : null

    return {
      props: {
        path,
        accessType,
        shortUrl: `${requestHost}/url/${path}`,
        turnstileSiteKey: turnstileSiteKeyRow?.value || "",
        captchaConfigured: Boolean(
          turnstileSiteKeyRow?.value && turnstileSecretKeyRow?.value
        ),
      },
    }
  } finally {
    await db.close()
  }
}
