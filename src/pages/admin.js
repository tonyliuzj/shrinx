import { withSessionSsr } from "../lib/session"
import { openDB } from "@/data/database"
import AdminLayout from "../components/layout/AdminLayout"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Globe,
  Link2,
  Loader2,
  LockKeyhole,
  Plus,
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  REDIRECT_ACCESS_OPTIONS,
  REDIRECT_ACCESS_TYPES,
  getRedirectAccessOption,
} from "@/lib/redirectOptions"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const formSchema = z
  .object({
    domain: z.string().min(1, "Select a connected domain"),
    path: z
      .string()
      .min(1, "Path is required")
      .regex(
        /^[a-zA-Z0-9-_]+$/,
        "Only letters, numbers, dashes and underscores allowed"
      ),
    redirectUrl: z.string().url("Must be a valid URL"),
    accessType: z.enum(["simple", "captcha", "password"]),
    accessPassword: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.accessType === REDIRECT_ACCESS_TYPES.PASSWORD) {
      if (!values.accessPassword?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["accessPassword"],
          message: "Password is required for password-protected redirects.",
        })
      } else if (values.accessPassword.length < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["accessPassword"],
          message: "Password must be at least 4 characters.",
        })
      }
    }
  })

export const getServerSideProps = withSessionSsr(async ({ req }) => {
  const user = req.session.get("user")

  if (!user?.isLoggedIn) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    }
  }

  const db = await openDB()
  const [domains, redirectCountRow, primaryDomainRow, turnstileRow] =
    await Promise.all([
      db.all("SELECT id, domain FROM domains ORDER BY id"),
      db.get("SELECT COUNT(*) AS count FROM paths"),
      db.get("SELECT value FROM settings WHERE key = ?", "primary_domain"),
      db.get("SELECT value FROM settings WHERE key = ?", "turnstile_enabled"),
    ])
  await db.close()

  return {
    props: {
      domains,
      redirectCount: redirectCountRow?.count || 0,
      primaryDomain: primaryDomainRow?.value || "",
      turnstileEnabled: turnstileRow?.value === "true",
    },
  }
})

function accessIcon(type) {
  if (type === REDIRECT_ACCESS_TYPES.CAPTCHA) {
    return ShieldCheck
  }

  if (type === REDIRECT_ACCESS_TYPES.PASSWORD) {
    return LockKeyhole
  }

  return Globe
}

export default function Admin({
  domains,
  redirectCount,
  primaryDomain,
  turnstileEnabled,
}) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: domains[0]?.domain || "",
      path: "",
      redirectUrl: "",
      accessType: REDIRECT_ACCESS_TYPES.SIMPLE,
      accessPassword: "",
    },
  })
  const accessType = form.watch("accessType")
  const domain = form.watch("domain")
  const path = form.watch("path")
  const selectedAccess = getRedirectAccessOption(accessType)
  const routePreview = domain
    ? `${domain}/url/${path?.trim() || "launch-q2"}`
    : "Select a connected domain"

  const stats = [
    {
      label: "Domains",
      value: String(domains.length).padStart(2, "0"),
    },
    {
      label: "Redirects",
      value: String(redirectCount).padStart(2, "0"),
    },
    {
      label: "Protection",
      value: turnstileEnabled ? "On" : "Off",
    },
  ]

  const onSubmit = async (values) => {
    try {
      const res = await fetch("/api/admin/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.message || `Add failed: ${res.status}`)
      }

      toast.success("Redirect created successfully.")
      form.reset({
        domain: values.domain,
        path: "",
        redirectUrl: "",
        accessType: REDIRECT_ACCESS_TYPES.SIMPLE,
        accessPassword: "",
      })
    } catch (err) {
      console.error("Failed to add redirect:", err)
      toast.error(err.message || "Failed to create redirect. Please try again.")
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="rounded-[28px] border-border/70 bg-card/95 shadow-sm">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full px-3 py-1">Dashboard</Badge>
                {primaryDomain ? (
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    {primaryDomain}
                  </Badge>
                ) : null}
              </div>
              <div className="space-y-1">
                <CardTitle className="text-3xl tracking-tight">
                  Create redirect
                </CardTitle>
                <CardDescription className="max-w-2xl text-sm leading-6">
                  Publish a short link.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {stats.map((item) => (
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
            </CardContent>
          </Card>
        </div>

        {!domains.length ? (
          <Alert className="rounded-[24px] border-amber-200 bg-amber-50 text-amber-950">
            <AlertTitle>No publishing domains configured</AlertTitle>
            <AlertDescription>
              Add at least one domain in settings before creating redirects from
              the dashboard.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[28px] border-border/70 bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle>Create redirect</CardTitle>
              <CardDescription>
                Choose domain, alias, and access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Connected domain</FormLabel>
                        <FormControl>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {domains.map((item) => {
                              const isActive = field.value === item.domain

                              return (
                                <Button
                                  key={item.id}
                                  type="button"
                                  variant={isActive ? "secondary" : "outline"}
                                  className={cn(
                                    "h-auto justify-start rounded-2xl px-4 py-4 text-left whitespace-normal",
                                    isActive &&
                                      "border-primary/30 bg-primary/10 text-primary hover:bg-primary/10"
                                  )}
                                  onClick={() => field.onChange(item.domain)}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background">
                                      <Globe className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-sm font-medium text-foreground">
                                        {item.domain}
                                      </div>
                                    </div>
                                  </div>
                                </Button>
                              )
                            })}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="path"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alias</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="launch-q2"
                              className="rounded-2xl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="redirectUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destination URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/product/launch"
                              className="rounded-2xl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="accessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Access rule</FormLabel>
                        <FormControl>
                          <div className="grid gap-3 md:grid-cols-3">
                            {REDIRECT_ACCESS_OPTIONS.map((option) => {
                              const Icon = accessIcon(option.value)
                              const isActive = field.value === option.value

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
                                  onClick={() => field.onChange(option.value)}
                                >
                                  <div className="space-y-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background">
                                      <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-foreground">
                                        {option.label}
                                      </div>
                                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                        {option.description}
                                      </p>
                                    </div>
                                  </div>
                                </Button>
                              )
                            })}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {accessType === REDIRECT_ACCESS_TYPES.PASSWORD ? (
                    <FormField
                      control={form.control}
                      name="accessPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Redirect password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Minimum 4 characters"
                              className="rounded-2xl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full rounded-2xl"
                    disabled={form.formState.isSubmitting || !domains.length}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating redirect
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Create redirect
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-border/70 bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle>Live preview</CardTitle>
              <CardDescription>
                Updates as you edit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-[24px] border border-border/70 bg-muted/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Link2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Short URL preview
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {domain ? "Ready to publish" : "Waiting for a domain"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    {selectedAccess.label}
                  </Badge>
                </div>
                <p className="mt-5 break-all rounded-2xl border border-border/70 bg-card px-4 py-3 font-mono text-sm text-foreground shadow-sm">
                  {routePreview}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-border/70 bg-card p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Access
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {selectedAccess.label}
                  </p>
                </div>
                <div className="rounded-[24px] border border-border/70 bg-card p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Status
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {domain ? "Ready" : "Select a domain"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
