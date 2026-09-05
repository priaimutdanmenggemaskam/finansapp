import { Link } from "react-router-dom";
import { ArrowLeft, WalletCards } from "lucide-react";

export default function Anggaran() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/dashboard" className="text-2xl font-bold text-blue-600">
            FINANSAPP
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600"
        >
          <ArrowLeft size={18} />
          Kembali ke Dashboard
        </Link>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <WalletCards size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold">Anggaran</h1>
              <p className="text-sm text-slate-500">
                Atur batas pengeluaran setiap kategori.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-xl bg-slate-50 p-6 text-center">
            <p className="text-slate-500">
              Fitur anggaran sedang kita bangun.
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Nantinya Anda dapat menentukan anggaran makanan,
              transportasi, tagihan, dan kategori lainnya.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
