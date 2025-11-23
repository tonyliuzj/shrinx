import Head from 'next/head';
import { ExclamationTriangleIcon, HomeIcon } from "@heroicons/react/24/outline";

export default function ErrorPage() {
  return (
    <>
      <Head>
        <title>Error · Shrinx</title>
      </Head>

      <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
        {/* Decorative background blobs */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 max-w-sm w-full relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-6">
            <ExclamationTriangleIcon className="w-10 h-10" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">404</h1>
          <h2 className="text-xl font-medium text-slate-700 mb-4">Page Not Found</h2>
          <p className="text-slate-500 mb-8">
            The link you are trying to access does not exist or has been removed.
          </p>

          <button
            onClick={() => (window.location.href = "/")}
            className="w-full py-3.5 px-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <HomeIcon className="w-5 h-5" /> Back to Home
          </button>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  return {
    props: {}
  };
}
