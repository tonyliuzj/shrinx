import Link from "next/link"
import { useRouter } from "next/router"
import { type ReactNode, useState } from "react"
import {
  LayoutDashboard,
  Link2,
  Loader2,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Redirects",
    href: "/admin/redirects",
    icon: Link2,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

function SidebarContent({
  pathname,
  onNavigate,
  onLogout,
  loggingOut,
}: {
  pathname: string
  onNavigate?: () => void
  onLogout: () => void
  loggingOut: boolean
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="rounded-[28px] border border-border/70 bg-card/90 p-5 shadow-sm backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Admin
              </p>
              <h1 className="mt-2 text-xl font-semibold tracking-tight">
                Link Guide
              </h1>
            </div>
          </div>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            Live
          </Badge>
        </div>
      </div>

      <div className="mt-6 flex-1 space-y-2">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Button
              key={item.href}
              asChild
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "h-auto w-full justify-start rounded-2xl px-3 py-3 text-left whitespace-normal",
                isActive
                  ? "border border-border/80 bg-card shadow-sm hover:bg-card"
                  : "text-muted-foreground hover:bg-card hover:text-foreground"
              )}
            >
              <Link href={item.href} onClick={onNavigate}>
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                      isActive
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : "border-border/70 bg-background text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 text-sm font-medium text-foreground">
                    {item.title}
                  </div>
                </div>
              </Link>
            </Button>
          )
        })}
      </div>

      <div className="mt-6 rounded-[24px] border border-border/70 bg-card/90 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Secure
        </div>
        <Separator className="my-4" />
        <Button
          variant="outline"
          className="w-full justify-start rounded-xl"
          onClick={onLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Sign out
        </Button>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const activeItem =
    sidebarItems.find((item) => item.href === router.pathname) || sidebarItems[0]

  const handleLogout = async () => {
    setLoggingOut(true)

    try {
      const res = await fetch("/api/admin/logout", { method: "POST" })

      if (!res.ok) {
        throw new Error("Logout failed")
      }

      router.push("/login")
    } catch (error) {
      console.error("Logout error", error)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="hidden w-[320px] shrink-0 lg:block">
          <div className="sticky top-4 h-[calc(100vh-2rem)]">
            <SidebarContent
              pathname={router.pathname}
              onLogout={handleLogout}
              loggingOut={loggingOut}
            />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="rounded-[32px] border border-border/70 bg-card/80 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.3)] backdrop-blur">
            <header className="flex items-center justify-between gap-4 border-b border-border/70 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl lg:hidden"
                    >
                      <Menu className="h-4 w-4" />
                      <span className="sr-only">Open navigation</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[320px] border-r p-5">
                    <SheetHeader className="sr-only">
                      <SheetTitle>Admin navigation</SheetTitle>
                      <SheetDescription>
                        Open a section in the admin console.
                      </SheetDescription>
                    </SheetHeader>
                    <SidebarContent
                      pathname={router.pathname}
                      onNavigate={() => setMobileOpen(false)}
                      onLogout={handleLogout}
                      loggingOut={loggingOut}
                    />
                  </SheetContent>
                </Sheet>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Workspace
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                    {activeItem.title}
                  </h2>
                </div>
              </div>

              <Badge
                variant="secondary"
                className="hidden rounded-full px-3 py-1 text-xs sm:inline-flex"
              >
                Live
              </Badge>
            </header>

            <main className="min-w-0 px-5 py-6 sm:px-6 sm:py-8">{children}</main>
          </div>
        </div>
      </div>
    </div>
  )
}
