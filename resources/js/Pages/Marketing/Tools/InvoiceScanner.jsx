import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';

export default function InvoiceScanner({ turnstileSiteKey }) {
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('email', email);
    if (file) {
      formData.append('file', file);
    }

    try {
      const response = await fetch('/tools/invoice-scanner', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to scan invoice.');
      } else {
        setResult(data.data);
      }
    } catch (err) {
      setError('An error occurred while uploading. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      <Head title="Free AI Invoice & Bill Scanner Tool | VenQore POS" />

      <header className="p-6 border-b border-slate-800 flex justify-between items-center max-w-6xl mx-auto w-full">
        <Link href="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="bg-indigo-600 px-2 py-1 rounded text-sm">VenQore</span>
          <span>Free AI Tools</span>
        </Link>
        <Link href="/register" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition">
          Sign Up Free
        </Link>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 py-12 flex-1">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Free AI Invoice & Receipt Scanner</h1>
          <p className="text-slate-400 text-lg">Instant line-item extraction for supplier bills and paper receipts.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Work Email Address (Required)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Upload Invoice / Receipt File</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files[0] || null)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-400"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-950/60 border border-red-800 text-red-200 text-sm rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-lg transition text-white shadow-lg disabled:opacity-50"
            >
              {loading ? 'Scanning Invoice with AI...' : 'Scan Invoice Free'}
            </button>
          </form>
        </div>

        {result && (
          <div className="bg-slate-900 border border-indigo-950 rounded-xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-indigo-500/5 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
              <span className="text-indigo-400/30 text-2xl font-black rotate-[-12deg] uppercase tracking-widest text-center px-4">
                {result.watermark}
              </span>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{result.vendor_name}</h2>
              <span className="text-xs bg-indigo-900/60 text-indigo-300 px-3 py-1 rounded-full font-medium">
                {result.invoice_no}
              </span>
            </div>

            <table className="w-full text-left text-sm mb-6">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-800/50">
                    <td className="py-2.5 font-medium">{item.item_name}</td>
                    <td className="py-2.5 text-right">{item.qty}</td>
                    <td className="py-2.5 text-right">${item.unit_price.toFixed(2)}</td>
                    <td className="py-2.5 text-right">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="bg-indigo-950/80 border border-indigo-800 rounded-lg p-4 text-center">
              <p className="text-indigo-200 text-sm mb-3">Want clean, unwatermarked AI scanning directly into your inventory ledger?</p>
              <Link href="/register" className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition">
                Create Free VenQore Account
              </Link>
            </div>
          </div>
        )}
      </main>

      <footer className="p-6 border-t border-slate-800 text-center text-xs text-slate-500">
        © 2026 VenQore POS. Free Public Invoice Scanner magnet tool.
      </footer>
    </div>
  );
}
