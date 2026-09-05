import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type SavingGoal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  created_at: string;
};

export default function Tabungan({ user }: { user: User }) {
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");

  const formatRupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);

  async function loadGoals() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("saving_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setGoals((data || []) as SavingGoal[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadGoals();
  }, [user.id]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Nama tabungan wajib diisi.");
      return;
    }

    if (!targetAmount || Number(targetAmount) <= 0) {
      setError("Target tabungan harus lebih dari 0.");
      return;
    }

    if (Number(currentAmount) < 0) {
      setError("Jumlah tabungan tidak boleh negatif.");
      return;
    }

    if (Number(currentAmount) > Number(targetAmount)) {
      setError("Jumlah tabungan tidak boleh melebihi target.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("saving_goals")
      .insert({
        user_id: user.id,
        name: name.trim(),
        target_amount: Number(targetAmount),
        current_amount: Number(currentAmount || 0),
      });

    if (error) {
      setError(error.message);
    } else {
      setName("");
      setTargetAmount("");
      setCurrentAmount("");
      await loadGoals();
    }

    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Hapus target tabungan ini?")) {
      return;
    }

    const { error } = await supabase
      .from("saving_goals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      setError(error.message);
      return;
    }

    await loadGoals();
  }

  const totalTarget = goals.reduce(
    (sum, item) => sum + Number(item.target_amount),
    0
  );

  const totalSaved = goals.reduce(
    (sum, item) => sum + Number(item.current_amount),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link
            to="/dashboard"
            className="text-2xl font-bold text-blue-600"
          >
            FINANSAPP
          </Link>

          <Link
            to="/dashboard"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="text-3xl font-bold">Tabungan</h1>

        <p className="mt-2 text-slate-500">
          Buat dan pantau target tabungan Anda.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Target
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-600">
              {formatRupiah(totalTarget)}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Terkumpul
            </p>
            <p className="mt-2 text-2xl font-bold text-green-600">
              {formatRupiah(totalSaved)}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              Tambah Target Tabungan
            </h2>

            <form
              onSubmit={handleSubmit}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Nama Tabungan
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Dana Darurat"
                  className="w-full rounded-xl border border-slate-300 p-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Target
                </label>

                <input
                  type="number"
                  min="0"
                  value={targetAmount}
                  onChange={(e) =>
                    setTargetAmount(e.target.value)
                  }
                  placeholder="Contoh 10000000"
                  className="w-full rounded-xl border border-slate-300 p-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Sudah Terkumpul
                </label>

                <input
                  type="number"
                  min="0"
                  value={currentAmount}
                  onChange={(e) =>
                    setCurrentAmount(e.target.value)
                  }
                  placeholder="Contoh 2500000"
                  className="w-full rounded-xl border border-slate-300 p-3"
                />
              </div>

              <button
                disabled={saving}
                className="w-full rounded-xl bg-blue-600 p-3 font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan Target"}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              Target Tabungan
            </h2>

            <div className="mt-5 space-y-4">
              {loading ? (
                <p className="text-slate-500">
                  Memuat tabungan...
                </p>
              ) : goals.length === 0 ? (
                <p className="text-slate-500">
                  Belum ada target tabungan.
                </p>
              ) : (
                goals.map((goal) => {
                  const target = Number(goal.target_amount);
                  const saved = Number(goal.current_amount);

                  const percentage =
                    target > 0
                      ? Math.min(
                          100,
                          Math.round((saved / target) * 100)
                        )
                      : 0;

                  return (
                    <div
                      key={goal.id}
                      className="rounded-xl border p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold">
                            {goal.name}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {formatRupiah(saved)} dari{" "}
                            {formatRupiah(target)}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDelete(goal.id)}
                          className="text-sm text-red-500"
                        >
                          Hapus
                        </button>
                      </div>

                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-slate-500">
                          Progress
                        </span>

                        <span className="font-semibold text-blue-600">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
