import Head from "next/head"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useState } from "react"
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  Copy,
  Globe,
  Link2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  getRedirectAccessOption,
  REDIRECT_ACCESS_OPTIONS,
  REDIRECT_ACCESS_TYPES,
} from "@/lib/redirectOptions"
import { cn } from "@/lib/utils"

const Turnstile = dynamic(
  () =>
    import("@marsidev/react-turnstile").then((mod) => mod.Turnstile),
  { ssr: false }
)

function accessIcon(type) {
  if (type === REDIRECT_ACCESS_TYPES.CAPTCHA) {
    return ShieldCheck
  }

  if (type === REDIRECT_ACCESS_TYPES.PASSWORD) {
    return LockKeyhole
  }

  return Globe
}

export default function Home({
  domains: initialDomains,
  turnstileEnabled,
  turnstileSiteKey,
}) {
  const domains = initialDomains
  const [form, setForm] = useState({
    url: "",
    domain: initialDomains.length === 1 ? initialDomains[0] : "",
    alias: "",
    accessType: REDIRECT_ACCESS_TYPES.SIMPLE,
    accessPassword: "",
  })
  const [token, setToken] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [copied, setCopied] = useState(false)
  const [turnstileRenderKey, setTurnstileRenderKey] = useState(0)

  const clearSuccessState = () => {
    setSuccess(null)
    setCopied(false)
  }

  const handleChange = (event) => {
    clearSuccessState()
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSelectDomain = (domain) => {
    clearSuccessState()
    setForm((current) => ({ ...current, domain }))
  }

  const handleAccessTypeChange = (value) => {
    clearSuccessState()
    setForm((current) => ({
      ...current,
      accessType: value,
      accessPassword:
        value === REDIRECT_ACCESS_TYPES.PASSWORD
          ? current.accessPassword
          : "",
    }))
  }

  const handleCopyShortUrl = async () => {
    if (!success?.shortUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(success.shortUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    clearSuccessState()

    if (turnstileEnabled && !token) {
      setError("Please complete the captcha.")
      return
    }

    const alias = form.alias.trim()
    const redirectUrl = form.url.trim()

    setSubmitting(true)

    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: alias,
          domain: form.domain,
          redirectUrl,
          turnstileResponse: token,
          accessType: form.accessType,
          accessPassword: form.accessPassword,
        }),
      })
      const body = await res.json()

      if (!res.ok) {
        setError(body.message || "Failed to shorten URL.")
      } else {
        setSuccess({
          alias,
          domain: form.domain,
          shortUrl: `${form.domain}/url/${alias}`,
          accessType: form.accessType,
        })
        setToken("")
        setTurnstileRenderKey((current) => current + 1)
        setForm((current) => ({
          ...current,
          accessPassword: "",
        }))
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const routePreview =
    form.domain && form.alias.trim()
      ? `${form.domain}/url/${form.alias.trim()}`
      : form.domain
        ? `${form.domain}/url/launch-q2`
        : "your-domain.com/url/launch-q2"

  const selectedAccessOption = getRedirectAccessOption(form.accessType)
  const successAccessOption = success
    ? getRedirectAccessOption(success.accessType)
    : null

  const heroStats = [
    {
      label: "Domains",
      value: String(domains.length).padStart(2, "0"),
    },
    {
      label: "Captcha",
      value: turnstileEnabled ? "On" : "Off",
    },
    {
      label: "Admin",
      value: "Ready",
    },
  ]

  const featureCards = [
    {
      title: "Custom domains",
      icon: Globe,
    },
    {
      title: "Access rules",
      icon: ShieldCheck,
    },
    {
      title: "Admin control",
      icon: BarChart3,
    },
  ]

  const controlPoints = [
    "Manage domains",
    "Set access rules",
    "Review redirects",
  ]

  return (
    <>
      <Head>
        <title>Link Guide | Short Links for Teams</title>
        <meta
          name="description"
          content="Link Guide helps teams create branded short links with custom domains, access rules, and a simple admin workspace."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen">
        <div className="relative isolate overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.98))]" />
          <div className="absolute left-[-4rem] top-[-2rem] -z-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-[-2rem] top-24 -z-10 h-96 w-96 rounded-full bg-sky-200/50 blur-3xl" />

          <div className="mx-auto max-w-7xl space-y-8">
            <Card className="rounded-[32px] border-border/70 bg-card/88 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
              <CardContent className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    <Link2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Redirect platform
                    </p>
                    <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                      Link Guide
                    </h1>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="outline" className="rounded-full">
                    <Link href="/login">
                      Admin
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild className="rounded-full">
                    <a
                      href="https://github.com/tonyliuzj/link-guide"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Source
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
              <Card className="rounded-[38px] border-border/70 bg-card/92 shadow-[0_28px_90px_-52px_rgba(15,23,42,0.38)] backdrop-blur">
                <CardHeader className="space-y-5">
                  <div className="flex flex-wrap gap-3">
                    <Badge className="rounded-full px-3 py-1">Simple short links</Badge>
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      Live demo
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <CardTitle className="max-w-4xl text-4xl leading-tight tracking-tight sm:text-5xl xl:text-6xl">
                      Branded redirects with a clean admin workspace.
                    </CardTitle>
                    <CardDescription className="max-w-2xl text-base leading-7">
                      Create short links, add protection, and manage everything
                      from one place.
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button asChild size="lg" className="rounded-full">
                      <Link href="#builder">
                        Try it
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="rounded-full">
                      <Link href="/login">Open admin</Link>
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {heroStats.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-3xl border border-border/70 bg-muted/40 p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {featureCards.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-3xl border border-border/70 bg-background/70 p-4 shadow-sm"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <p className="mt-4 text-sm font-medium text-foreground">
                          {item.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card
                id="builder"
                className="rounded-[38px] border-border/70 bg-card/94 shadow-[0_32px_120px_-60px_rgba(15,23,42,0.45)] backdrop-blur"
              >
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Badge className="rounded-full px-3 py-1">Live builder</Badge>
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      {selectedAccessOption.label}
                    </Badge>
                  </div>
                  <CardTitle className="text-3xl tracking-tight">
                    Create redirect
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-3xl border border-border/70 bg-muted/40 p-4 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Preview
                      </p>
                      <p className="mt-3 break-all font-mono text-sm text-foreground">
                        {success?.shortUrl || routePreview}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-border/70 bg-muted/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Domains
                      </p>
                      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                        {String(domains.length).padStart(2, "0")}
                      </p>
                    </div>
                  </div>

                  {!domains.length ? (
                    <Alert className="rounded-[24px] border-amber-200 bg-amber-50 text-amber-950">
                      <AlertTitle>No domains</AlertTitle>
                      <AlertDescription>Add one in admin first.</AlertDescription>
                    </Alert>
                  ) : null}

                  {error ? (
                    <Alert
                      variant="destructive"
                      className="rounded-[24px] border-destructive/20 bg-destructive/5"
                    >
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : null}

                  {success ? (
                    <Card className="rounded-[24px] border-emerald-200 bg-emerald-50 shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-emerald-900">
                                Published
                              </p>
                              <p className="mt-1 text-sm text-emerald-800/90">
                                {success.shortUrl}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className="rounded-full border-emerald-200 bg-white px-3 py-1 text-emerald-900"
                          >
                            {successAccessOption?.label}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          className={cn(
                            "mt-4 w-full rounded-2xl",
                            copied && "bg-emerald-600 hover:bg-emerald-600"
                          )}
                          onClick={handleCopyShortUrl}
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
                      </CardContent>
                    </Card>
                  ) : null}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="url">Destination</Label>
                      <Input
                        id="url"
                        name="url"
                        type="url"
                        placeholder="https://example.com/product/launch"
                        value={form.url}
                        onChange={handleChange}
                        required
                        className="rounded-2xl"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                      <div className="space-y-2">
                        <Label htmlFor="domain-trigger">Domain</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              id="domain-trigger"
                              type="button"
                              variant="outline"
                              className="w-full justify-between rounded-2xl"
                            >
                              <span className="truncate">
                                {form.domain || "Select domain"}
                              </span>
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-2xl">
                            <DropdownMenuRadioGroup
                              value={form.domain}
                              onValueChange={handleSelectDomain}
                            >
                              {domains.map((domain) => (
                                <DropdownMenuRadioItem
                                  key={domain}
                                  value={domain}
                                  className="rounded-xl"
                                >
                                  {domain}
                                </DropdownMenuRadioItem>
                              ))}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="alias">Alias</Label>
                        <Input
                          id="alias"
                          name="alias"
                          type="text"
                          placeholder="launch-q2"
                          value={form.alias}
                          onChange={handleChange}
                          required
                          className="rounded-2xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 rounded-[24px] border border-border/70 bg-muted/40 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-foreground">
                          Access
                        </p>
                        <Badge variant="secondary" className="rounded-full px-3 py-1">
                          {selectedAccessOption.label}
                        </Badge>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        {REDIRECT_ACCESS_OPTIONS.map((option) => {
                          const Icon = accessIcon(option.value)
                          const isActive = form.accessType === option.value

                          return (
                            <Button
                              key={option.value}
                              type="button"
                              variant={isActive ? "secondary" : "outline"}
                              className={cn(
                                "h-auto justify-start rounded-2xl px-4 py-4 text-left whitespace-normal",
                                isActive &&
                                  "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10"
                              )}
                              onClick={() => handleAccessTypeChange(option.value)}
                            >
                              <div className="space-y-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="text-sm font-medium text-foreground">
                                  {option.label}
                                </div>
                              </div>
                            </Button>
                          )
                        })}
                      </div>

                      {form.accessType === REDIRECT_ACCESS_TYPES.PASSWORD ? (
                        <div className="space-y-2">
                          <Label htmlFor="accessPassword">Password</Label>
                          <Input
                            id="accessPassword"
                            name="accessPassword"
                            type="password"
                            placeholder="Minimum 4 characters"
                            value={form.accessPassword}
                            onChange={handleChange}
                            required
                            className="rounded-2xl"
                          />
                        </div>
                      ) : null}
                    </div>

                    {turnstileEnabled ? (
                      <div className="flex justify-center rounded-[24px] border border-border/70 bg-muted/40 px-4 py-5">
                        <Turnstile
                          key={turnstileRenderKey}
                          siteKey={turnstileSiteKey}
                          onSuccess={(value) => setToken(value)}
                          onExpire={() => setToken("")}
                          onError={() =>
                            setError("Captcha failed, please try again.")
                          }
                        />
                      </div>
                    ) : null}

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full rounded-2xl"
                      disabled={submitting || !domains.length}
                    >
                      {submitting ? "Publishing" : "Create redirect"}
                      {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
              <Card className="rounded-[34px] border-border/70 bg-slate-950 text-white shadow-[0_32px_120px_-60px_rgba(15,23,42,0.72)]">
                <CardHeader className="space-y-3">
                  <Badge className="w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
                    Admin workspace
                  </Badge>
                  <CardTitle className="text-4xl tracking-tight text-white">
                    Simple control after publish.
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-base leading-7 text-slate-300">
                    Manage domains, settings, and redirects without extra noise.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  {controlPoints.map((item) => (
                    <div
                      key={item}
                      className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
                    >
                      {item}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-[34px] border-border/70 bg-card/94 shadow-[0_28px_90px_-52px_rgba(15,23,42,0.35)] backdrop-blur">
                <CardContent className="flex h-full flex-col justify-center gap-6 px-6 py-8">
                  <div className="space-y-3">
                    <Badge className="rounded-full px-3 py-1">Get started</Badge>
                    <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                      Short links, cleaner.
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button asChild size="lg" className="rounded-full">
                      <Link href="#builder">
                        Try it
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="rounded-full">
                      <Link href="/login">Open admin</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}

export async function getServerSideProps({ req }) {
  const { openDB } = await import("@/data/database")
  const db = await openDB()

  const primaryDomainSetting = await db.get(
    "SELECT value FROM settings WHERE key = ?",
    "primary_domain"
  )

  if (primaryDomainSetting && primaryDomainSetting.value) {
    const primaryDomain = primaryDomainSetting.value
    const requestHost = req.headers.host

    if (
      requestHost !== primaryDomain &&
      !requestHost.startsWith(primaryDomain + ":")
    ) {
      await db.close()
      const protocol = req.headers["x-forwarded-proto"] || "http"
      const redirectUrl = `${protocol}://${primaryDomain}${req.url}`

      return {
        redirect: {
          destination: redirectUrl,
          permanent: false,
        },
      }
    }
  }

  const domainsData = await db.all("SELECT domain FROM domains ORDER BY id")
  const domains = domainsData.map((domain) => domain.domain)

  const turnstileEnabledRow = await db.get(
    "SELECT value FROM settings WHERE key = ?",
    "turnstile_enabled"
  )
  const turnstileSiteKeyRow = await db.get(
    "SELECT value FROM settings WHERE key = ?",
    "turnstile_site_key"
  )

  await db.close()

  return {
    props: {
      domains,
      turnstileEnabled: turnstileEnabledRow?.value === "true",
      turnstileSiteKey: turnstileSiteKeyRow?.value || "",
    },
  }
}
