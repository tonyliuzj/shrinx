import { useState } from "react"
import { withSessionSsr } from "../../lib/session"
import { openDB } from "@/data/database"
import AdminLayout from "../../components/layout/AdminLayout"
import {
  Copy,
  ExternalLink,
  Globe,
  Link2,
  LockKeyhole,
  Search,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getRedirectAccessOption, REDIRECT_ACCESS_TYPES } from "@/lib/redirectOptions"
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
  const redirects = await db.all("SELECT * FROM paths ORDER BY id DESC")
  await db.close()

  return {
    props: { initialRedirects: redirects },
  }
})

function accessIcon(accessType) {
  if (accessType === REDIRECT_ACCESS_TYPES.CAPTCHA) {
    return ShieldCheck
  }

  if (accessType === REDIRECT_ACCESS_TYPES.PASSWORD) {
    return LockKeyhole
  }

  return Globe
}

function accessBadgeVariant(accessType) {
  if (accessType === REDIRECT_ACCESS_TYPES.PASSWORD) {
    return "default"
  }

  if (accessType === REDIRECT_ACCESS_TYPES.CAPTCHA) {
    return "secondary"
  }

  return "outline"
}

export default function RedirectsPage({ initialRedirects }) {
  const [list, setList] = useState(initialRedirects)
  const [searchTerm, setSearchTerm] = useState("")

  const query = searchTerm.trim().toLowerCase()
  const filteredList = !query
    ? list
    : list.filter((redirect) => {
        const accessLabel = getRedirectAccessOption(redirect.access_type).label

        return (
          redirect.path?.toLowerCase().includes(query) ||
          redirect.redirect_url?.toLowerCase().includes(query) ||
          redirect.domain?.toLowerCase().includes(query) ||
          accessLabel.toLowerCase().includes(query)
        )
      })

  const uniqueDomains = new Set(list.map((redirect) => redirect.domain)).size

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/admin/delete?id=${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        throw new Error(`Delete failed: ${res.status}`)
      }

      setList((prev) => prev.filter((redirect) => redirect.id !== id))
      toast.success("Redirect deleted successfully.")
    } catch (err) {
      console.error("Failed to delete redirect:", err)
      toast.error("Failed to delete redirect.")
    }
  }

  const handleCopy = async (redirect) => {
    const shortUrl = `${redirect.domain}/url/${redirect.path}`

    try {
      await navigator.clipboard.writeText(shortUrl)
      toast.success("Short URL copied.")
    } catch {
      toast.error("Unable to copy the short URL.")
    }
  }

  const stats = [
    {
      label: "Redirects",
      value: String(list.length).padStart(2, "0"),
    },
    {
      label: "Filtered",
      value: String(filteredList.length).padStart(2, "0"),
    },
    {
      label: "Domains",
      value: String(uniqueDomains).padStart(2, "0"),
    },
  ]

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="rounded-[28px] border-border/70 bg-card/95 shadow-sm">
            <CardHeader className="space-y-2">
              <Badge className="w-fit rounded-full px-3 py-1">Redirects</Badge>
              <CardTitle className="text-3xl tracking-tight">
                Redirect library
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm leading-6">
                Search and manage redirects.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {stats.map((item) => (
              <Card
                key={item.label}
                className="rounded-[24px] border-border/70 bg-card/95 shadow-sm"
              >
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                    {item.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="rounded-[28px] border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Redirect table</CardTitle>
              <CardDescription>Alias, domain, destination.</CardDescription>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search redirects"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="rounded-2xl pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-[24px] border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Route</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead className="w-[220px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((redirect) => {
                    const access = getRedirectAccessOption(redirect.access_type)
                    const Icon = accessIcon(redirect.access_type)

                    return (
                      <TableRow key={redirect.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">
                              /{redirect.path}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {redirect.domain}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[420px] truncate text-sm text-muted-foreground">
                            {redirect.redirect_url}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={accessBadgeVariant(redirect.access_type)}
                            className="inline-flex rounded-full px-3 py-1"
                          >
                            <Icon className="mr-1 h-3.5 w-3.5" />
                            {access.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="rounded-xl"
                              onClick={() => handleCopy(redirect)}
                            >
                              <Copy className="h-4 w-4" />
                              <span className="sr-only">Copy short URL</span>
                            </Button>

                            <Button
                              asChild
                              type="button"
                              variant="outline"
                              size="icon"
                              className="rounded-xl"
                            >
                              <a
                                href={redirect.redirect_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                                <span className="sr-only">Open destination</span>
                              </a>
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete redirect</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-[28px]">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete /{redirect.path}?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This permanently removes the redirect from{" "}
                                    {redirect.domain}. The alias will become
                                    available again after deletion.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(redirect.id)}
                                    className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete redirect
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}

                  {!filteredList.length ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                            <Link2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {searchTerm
                                ? "No redirects match this search."
                                : "No redirects created yet."}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {searchTerm
                                ? "Try a different term or clear the filter."
                                : "New redirects created in the dashboard will appear here."}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
