import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { 
  LayoutDashboard, 
  List, 
  LogOut, 
  Menu, 
  X,
  Settings 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Redirects",
    href: "/admin/redirects",
    icon: List,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 ease-in-out md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-slate-50">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                S
              </div>
              Shrinx
            </div>
            <button 
              className="ml-auto md:hidden text-slate-500"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 md:hidden flex items-center px-4 sticky top-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="mr-2"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <span className="font-semibold text-lg">Shrinx Admin</span>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
