import Head from "next/head";
import dynamic from "next/dynamic";
import { useState } from "react";
import { LinkIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

const Turnstile = dynamic(
  () =>
    import("@marsidev/react-turnstile").then((mod) => mod.Turnstile),
  { ssr: false }
);

export default function Home({ domains: initialDomains }) {
  const [domains] = useState(initialDomains);
  const [form, setForm] = useState({ url: "", domain: "", alias: "" });
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Please complete the captcha.");
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: form.alias.trim(),
          domain: form.domain,
          redirectUrl: form.url.trim(),
          turnstileResponse: token,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.message || "Failed to shorten URL.");
      } else {
        window.location.href = `/success?path=${encodeURIComponent(
          form.alias
        )}&domain=${encodeURIComponent(form.domain)}`;
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Shrinx · Modern URL Shortener</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center p-4">
        {/* Decorative background blobs */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className="w-full max-w-4xl z-10 grid md:grid-cols-2 gap-8 items-center">
          {/* Left Column: Hero Text */}
          <div className="text-center md:text-left space-y-6">
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
              Shorten links, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                expand reach.
              </span>
            </h1>
            <p className="text-lg text-slate-600 max-w-lg mx-auto md:mx-0">
              Transform long, complex URLs into clean, memorable links. 
              Simple, fast, and secure URL shortening for everyone.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <a
                href="https://github.com/tonyliuzj/Shrinx"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition shadow-lg shadow-slate-900/20"
              >
                View on GitHub
              </a>
              <a
                href="https://tony-liu.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-white text-slate-900 border border-slate-200 font-medium hover:bg-slate-50 transition"
              >
                About Developer
              </a>
            </div>
            
            <div className="pt-8 flex items-center justify-center md:justify-start gap-8 text-slate-400">
               <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-green-500"></span>
                 <span className="text-sm font-medium">Fast & Secure</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                 <span className="text-sm font-medium">Analytics Ready</span>
               </div>
            </div>
          </div>

          {/* Right Column: Glassmorphism Form */}
          <div className="w-full">
            <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <LinkIcon className="w-6 h-6 text-blue-600" />
                Shorten a URL
              </h2>
              
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mt-0.5 shrink-0">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="url" className="text-sm font-medium text-slate-700 ml-1">
                    Destination URL
                  </label>
                  <div className="relative">
                    <input
                      id="url"
                      name="url"
                      type="url"
                      placeholder="https://example.com/very/long/url"
                      value={form.url}
                      onChange={handleChange}
                      required
                      className="w-full pl-4 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 ml-1">
                      Domain
                    </label>
                    <div className="relative">
                      <select
                        name="domain"
                        value={form.domain}
                        onChange={handleChange}
                        required
                        className="w-full pl-4 pr-10 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none text-slate-700"
                      >
                        <option value="" disabled>Select domain</option>
                        {domains.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400">
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 ml-1">
                      Custom Alias
                    </label>
                    <input
                      name="alias"
                      type="text"
                      placeholder="e.g. summer-sale"
                      value={form.alias}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex justify-center py-2">
                  <Turnstile
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                    onSuccess={(t) => setToken(t)}
                    onExpire={() => setToken("")}
                    onError={() => setError("Captcha failed, please try again.")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transform transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      Shorten URL <ArrowRightIcon className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps() {
  const domains = process.env.DOMAINS?.split(",") || [];
  return {
    props: {
      domains,
    },
  };
}
