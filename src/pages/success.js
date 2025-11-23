import { useState } from 'react';
import Head from 'next/head';
import { CheckCircleIcon, ClipboardDocumentIcon, ArrowPathIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";

export default function Success({ path, domain }) {
  const shortUrl = `${domain}/url/${path}`;
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Head>
        <title>Success · Shrinx</title>
      </Head>
      
      <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
        {/* Decorative background blobs */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 max-w-md w-full relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6 animate-bounce">
            <CheckCircleIcon className="w-10 h-10" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-2">URL Ready!</h1>
          <p className="text-slate-500 mb-8">
            Your shortened link has been created successfully.
          </p>
          
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-8 shadow-sm relative group">
            <p className="text-lg font-mono font-medium text-slate-700 break-all">{shortUrl}</p>
            <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm rounded-xl cursor-pointer" onClick={copyToClipboard}>
                <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <ClipboardDocumentIcon className="w-4 h-4" /> Click to copy
                </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={copyToClipboard}
              className={`w-full py-3.5 px-4 rounded-xl font-bold transition-all shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2 ${
                copied 
                  ? 'bg-green-600 text-white shadow-green-500/30' 
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
              }`}
            >
              {copied ? (
                  <>
                    <ClipboardDocumentCheckIcon className="w-5 h-5" /> Copied!
                  </>
              ) : (
                  <>
                    <ClipboardDocumentIcon className="w-5 h-5" /> Copy to Clipboard
                  </>
              )}
            </button>
            
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full py-3.5 px-4 bg-white text-slate-700 border border-slate-200 font-bold rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="w-5 h-5" /> Shorten Another
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps({ query }) {
  const { path = "", domain = "" } = query;
  return {
    props: {
      path,
      domain,
    },
  };
}
