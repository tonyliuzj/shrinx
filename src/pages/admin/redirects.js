import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { withSessionSsr } from "../../lib/session";
import { openDB } from "../../lib/db";
import { 
  TrashIcon, 
  ArrowLeftIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon
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
  const redirects = await db.all("SELECT * FROM paths ORDER BY id DESC");

  return {
    props: { initialRedirects: redirects },
  };
});

export default function RedirectsPage({ initialRedirects }) {
  const router = useRouter();
  const [list, setList] = useState(initialRedirects);
  const [searchTerm, setSearchTerm] = useState("");

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this redirect?")) return;
    
    try {
      const res = await fetch(`/api/admin/delete?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      setList((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to delete redirect:", err);
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

  const filteredList = list.filter(r => 
    r.path?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.redirect_url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <main className="max-w-6xl mx-auto p-6 md:p-8">
        <div className="mb-8">
            <Link 
              href="/admin" 
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-600 mb-4 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" /> Back to Dashboard
            </Link>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Redirect Manager</h1>
                <p className="text-slate-500 mt-1">View and manage all your shortened links</p>
              </div>
              
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <MagnifyingGlassIcon className="w-5 h-5" />
                </div>
                <input 
                    type="text" 
                    placeholder="Search redirects..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full md:w-64 transition-all"
                />
              </div>
            </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Path (Alias)</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Domain</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Destination URL</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-slate-900">/{r.path}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {r.domain}
                    </td>
                    <td className="px-6 py-4">
                        <div className="max-w-xs md:max-w-md truncate text-slate-500 text-sm" title={r.redirect_url}>
                            {r.redirect_url}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                        {searchTerm ? "No redirects matching your search." : "No redirects defined yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
