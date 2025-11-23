import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { withSessionSsr } from "../lib/session";
import { openDB } from "../lib/db";
import { 
  PlusIcon, 
  ArrowRightOnRectangleIcon, 
  ListBulletIcon, 
  CheckCircleIcon 
} from "@heroicons/react/24/outline";

export const getServerSideProps = withSessionSsr(async ({ req }) => {
  const user = req.session.get("user");
  if (!user?.isLoggedIn) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const db = await openDB();
  await db.run(`
    CREATE TABLE IF NOT EXISTS paths (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT,
      domain TEXT,
      redirect_url TEXT
    )
  `);
  return { props: {} };
});

export default function Admin() {
  const router = useRouter();
  const [form, setForm] = useState({
    path: "",
    domain: "",
    redirectUrl: "",
  });
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Add failed: ${res.status}`);
      
      setSuccess(true);
      setForm({ path: "", domain: "", redirectUrl: "" });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to add redirect:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    const res = await fetch("/api/admin/logout", { method: "POST" });
    if (res.ok) {
      router.push("/login");
    } else {
      console.error("Logout failed:", await res.text());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
            S
          </div>
          <span className="font-bold text-slate-800 text-lg">Shrinx Admin</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Logout
        </button>
      </nav>

      <main className="max-w-5xl mx-auto p-6 md:p-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage your short links and redirects</p>
          </div>
          <Link 
            href="/admin/redirects" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
          >
            <ListBulletIcon className="w-5 h-5" />
            View All Redirects
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <PlusIcon className="w-5 h-5 text-blue-500" />
                  Create New Redirect
                </h2>
              </div>
              
              <div className="p-6">
                {success && (
                  <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 flex items-center gap-3">
                    <CheckCircleIcon className="w-6 h-6 shrink-0" />
                    <div>
                      <p className="font-medium">Success!</p>
                      <p className="text-sm opacity-90">Redirect has been created successfully.</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleAdd} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Domain</label>
                      <input
                        name="domain"
                        value={form.domain}
                        onChange={handleChange}
                        required
                        placeholder="example.com"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Path (Alias)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">/</span>
                        <input
                          name="path"
                          value={form.path}
                          onChange={handleChange}
                          required
                          placeholder="my-link"
                          className="w-full pl-7 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Destination URL</label>
                    <input
                      name="redirectUrl"
                      value={form.redirectUrl}
                      onChange={handleChange}
                      required
                      placeholder="https://very-long-url.com/destination"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition shadow-lg shadow-slate-900/10 disabled:opacity-70 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          Create Redirect
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar / Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
              <h3 className="font-bold text-lg mb-2">Quick Tips</h3>
              <ul className="space-y-3 text-blue-100 text-sm">
                <li className="flex gap-2">
                  <span className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                  Use clear, memorable aliases for better click-through rates.
                </li>
                <li className="flex gap-2">
                  <span className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                  Double check the destination URL to ensure it works.
                </li>
                <li className="flex gap-2">
                  <span className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                  You can track analytics in the main dashboard (coming soon).
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
