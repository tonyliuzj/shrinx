import { useState } from "react"
import { useRouter } from "next/router"
import { withSessionSsr } from "../../lib/session"
import { openDB } from "@/data/database"
import {
  Globe,
  KeyRound,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import AdminLayout from "../../components/layout/AdminLayout"
import { normalizeDomainInput, validatePlainDomain } from "@/lib/domainValidation"
import { toast } from "sonner"

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
  const [settingsRows, domains] = await Promise.all([
    db.all("SELECT key, value FROM settings"),
    db.all("SELECT id, domain FROM domains ORDER BY id"),
  ])
  await db.close()

  return {
    props: {
      initialSettings: Object.fromEntries(
        settingsRows.map((entry) => [entry.key, entry.value])
      ),
      initialDomains: domains,
    },
  }
})

export default function Settings({ initialSettings, initialDomains }) {
  const router = useRouter()

  const [turnstileEnabled, setTurnstileEnabled] = useState(
    initialSettings.turnstile_enabled === "true"
  )
  const [turnstileSiteKey, setTurnstileSiteKey] = useState(
    initialSettings.turnstile_site_key || ""
  )
  const [turnstileSecretKey, setTurnstileSecretKey] = useState(
    initialSettings.turnstile_secret_key || ""
  )
  const [primaryDomain, setPrimaryDomain] = useState(
    initialSettings.primary_domain || ""
  )
  const [domains, setDomains] = useState(initialDomains || [])
  const [newDomain, setNewDomain] = useState("")
  const [savingSettings, setSavingSettings] = useState(false)
  const [addingDomain, setAddingDomain] = useState(false)
  const [deletingDomainId, setDeletingDomainId] = useState(null)
  const [credentialsForm, setCredentialsForm] = useState({
    currentPassword: "",
    newUsername: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [changingCredentials, setChangingCredentials] = useState(false)

  const refreshSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings")

      if (!res.ok) {
        throw new Error("Failed to refresh settings")
      }

      const data = await res.json()
      setTurnstileEnabled(data.settings.turnstile_enabled === "true")
      setTurnstileSiteKey(data.settings.turnstile_site_key || "")
      setTurnstileSecretKey(data.settings.turnstile_secret_key || "")
      setPrimaryDomain(data.settings.primary_domain || "")
      setDomains(data.domains || [])
    } catch (error) {
      console.error("Failed to refresh settings:", error)
      toast.error("Settings were updated, but the local view could not refresh.")
    }
  }

  const handleSaveSecurity = async (event) => {
    event.preventDefault()
    const trimmedPrimaryDomain = primaryDomain.trim()

    if (trimmedPrimaryDomain) {
      const validation = validatePlainDomain(trimmedPrimaryDomain)

      if (!validation.valid) {
        toast.error(validation.error)
        return
      }
    }

    setSavingSettings(true)

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnstile_enabled: turnstileEnabled,
          turnstile_site_key: turnstileSiteKey,
          turnstile_secret_key: turnstileSecretKey,
          primary_domain: trimmedPrimaryDomain
            ? normalizeDomainInput(trimmedPrimaryDomain)
            : "",
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save settings")
      }

      toast.success("Settings saved successfully.")
      await refreshSettings()
    } catch (error) {
      toast.error(error.message || "Failed to save settings.")
    } finally {
      setSavingSettings(false)
    }
  }

  const handleAddDomain = async (event) => {
    event.preventDefault()
    const trimmedDomain = newDomain.trim()

    if (!trimmedDomain) {
      return
    }

    const validation = validatePlainDomain(trimmedDomain)

    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    setAddingDomain(true)

    try {
      const res = await fetch("/api/admin/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: validation.normalized }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to add domain")
      }

      setNewDomain("")
      toast.success("Domain added successfully.")
      await refreshSettings()
    } catch (error) {
      toast.error(error.message || "Failed to add domain.")
    } finally {
      setAddingDomain(false)
    }
  }

  const handleDeleteDomain = async (id) => {
    setDeletingDomainId(id)

    try {
      const res = await fetch("/api/admin/domains", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete domain")
      }

      toast.success("Domain deleted successfully.")
      await refreshSettings()
    } catch (error) {
      toast.error(error.message || "Failed to delete domain.")
    } finally {
      setDeletingDomainId(null)
    }
  }

  const handleChangeCredentials = async (event) => {
    event.preventDefault()

    if (!credentialsForm.currentPassword) {
      toast.error("Current password is required.")
      return
    }

    if (!credentialsForm.newUsername && !credentialsForm.newPassword) {
      toast.error("Provide a new username or a new password.")
      return
    }

    if (
      credentialsForm.newPassword &&
      credentialsForm.newPassword !== credentialsForm.confirmPassword
    ) {
      toast.error("New passwords do not match.")
      return
    }

    if (
      credentialsForm.newPassword &&
      credentialsForm.newPassword.length < 6
    ) {
      toast.error("Password must be at least 6 characters.")
      return
    }

    setChangingCredentials(true)

    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: credentialsForm.currentPassword,
          newUsername: credentialsForm.newUsername || undefined,
          newPassword: credentialsForm.newPassword || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update credentials")
      }

      const updatedUsername = Boolean(credentialsForm.newUsername)
      setCredentialsForm({
        currentPassword: "",
        newUsername: "",
        newPassword: "",
        confirmPassword: "",
      })
      toast.success(
        updatedUsername && credentialsForm.newPassword
          ? "Username and password updated successfully."
          : updatedUsername
            ? "Username updated successfully."
            : "Password updated successfully."
      )

      if (updatedUsername) {
        setTimeout(() => {
          router.push("/login")
        }, 1200)
      }
    } catch (error) {
      toast.error(error.message || "Failed to update credentials.")
    } finally {
      setChangingCredentials(false)
    }
  }

  const summaryCards = [
    {
      label: "Captcha",
      value: turnstileEnabled ? "Enabled" : "Disabled",
    },
    {
      label: "Domains",
      value: String(domains.length).padStart(2, "0"),
    },
    {
      label: "Primary",
      value: primaryDomain || "Flexible",
    },
  ]

  const turnstileMissingKeys =
    turnstileEnabled && (!turnstileSiteKey || !turnstileSecretKey)

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="rounded-[28px] border-border/70 bg-card/95 shadow-sm">
            <CardHeader className="space-y-2">
              <Badge className="w-fit rounded-full px-3 py-1">Settings</Badge>
              <CardTitle className="text-3xl tracking-tight">
                Workspace settings
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm leading-6">
                Domains, security, and admin access.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {summaryCards.map((item) => (
              <Card
                key={item.label}
                className="rounded-[24px] border-border/70 bg-card/95 shadow-sm"
              >
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-3 truncate text-2xl font-semibold tracking-tight text-foreground">
                    {item.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <Card className="rounded-[28px] border-border/70 bg-card/95 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Captcha
                </CardTitle>
                <CardDescription>Turnstile settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {turnstileMissingKeys ? (
                  <Alert className="rounded-[20px] border-amber-200 bg-amber-50 text-amber-950">
                    <AlertTitle>Missing keys</AlertTitle>
                    <AlertDescription>Add both Turnstile keys.</AlertDescription>
                  </Alert>
                ) : null}

                <form onSubmit={handleSaveSecurity} className="space-y-5">
                  <div className="flex items-start gap-3 rounded-[24px] border border-border/70 bg-muted/40 p-4">
                    <Checkbox
                      id="turnstile-enabled"
                      checked={turnstileEnabled}
                      onCheckedChange={(checked) =>
                        setTurnstileEnabled(Boolean(checked))
                      }
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="turnstile-enabled" className="text-sm font-medium">
                        Enable Turnstile
                      </Label>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="site-key">Site key</Label>
                      <Input
                        id="site-key"
                        value={turnstileSiteKey}
                        onChange={(event) => setTurnstileSiteKey(event.target.value)}
                        placeholder="Site key"
                        className="rounded-2xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secret-key">Secret key</Label>
                      <Input
                        id="secret-key"
                        type="password"
                        value={turnstileSecretKey}
                        onChange={(event) =>
                          setTurnstileSecretKey(event.target.value)
                        }
                        placeholder="Secret key"
                        className="rounded-2xl"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="rounded-2xl"
                    disabled={savingSettings}
                  >
                    {savingSettings ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving security
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        Save security
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-border/70 bg-card/95 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Primary domain
                </CardTitle>
                <CardDescription>Optional.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveSecurity} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-domain">Primary domain</Label>
                    <Input
                      id="primary-domain"
                      value={primaryDomain}
                      onChange={(event) => setPrimaryDomain(event.target.value)}
                      placeholder="example.com or staging.example.com:3000"
                      className="rounded-2xl"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="outline"
                    className="rounded-2xl"
                    disabled={savingSettings}
                  >
                    {savingSettings ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving domain rule
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4" />
                        Save domain rule
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-[28px] border-border/70 bg-card/95 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Domains
                </CardTitle>
                <CardDescription>Manage domains.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <form onSubmit={handleAddDomain} className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={newDomain}
                    onChange={(event) => setNewDomain(event.target.value)}
                    placeholder="example.com or staging.example.com:3000"
                    className="rounded-2xl"
                  />
                  <Button
                    type="submit"
                    className="rounded-2xl"
                    disabled={addingDomain}
                  >
                    {addingDomain ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding domain
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add domain
                      </>
                    )}
                  </Button>
                </form>

                <div className="overflow-hidden rounded-[24px] border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead>Domain</TableHead>
                        <TableHead className="w-[110px] text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {domains.length ? (
                        domains.map((domain) => (
                          <TableRow key={domain.id}>
                            <TableCell className="font-mono text-sm">
                              {domain.domain}
                            </TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete domain</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-[28px]">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete {domain.domain}?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This removes the domain from the publishing
                                      inventory. Existing redirects using this
                                      host should be reviewed before deletion.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteDomain(domain.id)}
                                      className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      disabled={deletingDomainId === domain.id}
                                    >
                                      {deletingDomainId === domain.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : null}
                                      Delete domain
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="h-32 text-center">
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">
                                No domains configured
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Add a domain to start publishing redirects.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-border/70 bg-card/95 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  Credentials
                </CardTitle>
                <CardDescription>Update admin login.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangeCredentials} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={credentialsForm.currentPassword}
                      onChange={(event) =>
                        setCredentialsForm((current) => ({
                          ...current,
                          currentPassword: event.target.value,
                        }))
                      }
                      className="rounded-2xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-username">New username</Label>
                    <Input
                      id="new-username"
                      value={credentialsForm.newUsername}
                      onChange={(event) =>
                        setCredentialsForm((current) => ({
                          ...current,
                          newUsername: event.target.value,
                        }))
                      }
                      placeholder="Leave empty to keep the current username"
                      className="rounded-2xl"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={credentialsForm.newPassword}
                        onChange={(event) =>
                          setCredentialsForm((current) => ({
                            ...current,
                            newPassword: event.target.value,
                          }))
                        }
                        placeholder="Leave empty to keep the current password"
                        className="rounded-2xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={credentialsForm.confirmPassword}
                        onChange={(event) =>
                          setCredentialsForm((current) => ({
                            ...current,
                            confirmPassword: event.target.value,
                          }))
                        }
                        disabled={!credentialsForm.newPassword}
                        placeholder="Required when changing the password"
                        className="rounded-2xl"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="rounded-2xl"
                    disabled={changingCredentials}
                  >
                    {changingCredentials ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating credentials
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" />
                        Update credentials
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
