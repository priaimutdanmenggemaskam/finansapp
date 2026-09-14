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

type Account = {
  id: string;
  user_id: string;
  name: string;
  type: string;
  balance: number;
};

type SavingsTransaction = {
  id: string;
  user_id: string;
  saving_goal_id: string | null;
  account_id: string | null;
  type: "deposit" | "withdrawal";
  amount: number;
  transaction_date: string;
  notes: string | null;
  created_at: string;
};

export default function Tabungan({ user }: { user: User }) {
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [savingsTransactions, setSavingsTransactions] = useState<
    SavingsTransaction[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  const [savingGoalId, setSavingGoalId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [transactionType, setTransactionType] = useState<
    "deposit" | "withdrawal"
  >("deposit");

  const formatRupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);

  const formatTanggalIndonesia = (value: string) => {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(value + "T00:00:00")
      : new Date(value);

    if (Number.isNaN(d.getTime())) return value;

    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  async function loadData() {
    setLoading(true);
    setError("");

    const { data: goalData, error: goalError } = await supabase
      .from("saving_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (goalError) {
      setError(goalError.message);
    }

    const { data: accountData, error: accountError } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (accountError) {
      setError(accountError.message);
    }

    const { data: savingsData, error: savingsError } = await supabase
      .from("savings_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (savingsError) {
      setError(savingsError.message);
    }

    setGoals((goalData || []) as SavingGoal[]);
    setAccounts((accountData || []) as Account[]);
    setSavingsTransactions((savingsData || []) as SavingsTransaction[]);

    setLoading(false);
  }

  useEffect(() => {
    loadData();

    const refresh = () => {
      loadData();
    };

    window.addEventListener("transactions-changed", refresh);

    return () => {
      window.removeEventListener("transactions-changed", refresh);
    };
  }, [user.id]);

  async function handleAddGoal(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Nama tabungan wajib diisi.");
      return;
    }

    const target = Number(targetAmount);

    if (!targetAmount || target <= 0) {
      setError("Target tabungan harus lebih dari Rp 0.");
      return;
    }

    setSaving(true);

    const { error: insertError } = await supabase
      .from("saving_goals")
      .insert({
        user_id: user.id,
        name: name.trim(),
        target_amount: target,
        current_amount: 0,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setName("");
      setTargetAmount("");
      await loadData();
      window.dispatchEvent(new Event("transactions-changed"));
    }

    setSaving(false);
  }

  async function handleDeleteGoal(id: string) {
    const goal = goals.find((item) => item.id === id);

    if (!goal) return;

    if (Number(goal.current_amount) > 0) {
      setError(
        "Target tidak dapat dihapus karena masih memiliki saldo tabungan. Tarik seluruh saldo terlebih dahulu."
      );
      return;
    }

    if (!window.confirm("Hapus target tabungan ini?")) {
      return;
    }

    const { error: deleteError } = await supabase
      .from("saving_goals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadData();
    window.dispatchEvent(new Event("transactions-changed"));
  }

  async function handleSavingsTransaction(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (!savingGoalId) {
      setError("Pilih target tabungan terlebih dahulu.");
      return;
    }

    if (!accountId) {
      setError("Pilih dompet terlebih dahulu.");
      return;
    }

    const amount = Number(transactionAmount);

    if (!transactionAmount || amount <= 0) {
      setError("Nominal harus lebih dari Rp 0.");
      return;
    }

    if (!transactionDate) {
      setError("Tanggal transaksi wajib diisi.");
      return;
    }

    const goal = goals.find((item) => item.id === savingGoalId);

    if (!goal) {
      setError("Target tabungan tidak ditemukan.");
      return;
    }

    if (transactionType === "deposit") {
      const remainingTarget =
        Number(goal.target_amount) - Number(goal.current_amount);

      if (amount > remainingTarget) {
        setError(
          `Nominal melebihi sisa target. Sisa target ${formatRupiah(
            remainingTarget
          )}.`
        );
        return;
      }
    }

    if (
      transactionType === "withdrawal" &&
      amount > Number(goal.current_amount)
    ) {
      setError(
        `Nominal melebihi saldo tabungan. Saldo tersedia ${formatRupiah(
          Number(goal.current_amount)
        )}.`
      );
      return;
    }

    setSaving(true);

    const rpcName =
      transactionType === "deposit"
        ? "deposit_to_savings"
        : "withdraw_from_savings";

    const { error: rpcError } = await supabase.rpc(rpcName, {
      p_saving_goal_id: savingGoalId,
      p_account_id: accountId,
      p_amount: amount,
      p_transaction_date: transactionDate,
      p_notes: notes.trim() || null,
    });

    if (rpcError) {
      setError(rpcError.message);
    } else {
      setTransactionAmount("");
      setNotes("");
      setTransactionDate(new Date().toISOString().slice(0, 10));

      await loadData();

      window.dispatchEvent(new Event("transactions-changed"));
    }

    setSaving(false);
  }

  const totalTarget = goals.reduce(
    (sum, item) => sum + Number(item.target_amount),
    0
  );

  const totalSaved = goals.reduce(
    (sum, item) => sum + Number(item.current_amount),
    0
  );

  const totalDeposit = savingsTransactions
    .filter((item) => item.type === "deposit")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalWithdrawal = savingsTransactions
    .filter((item) => item.type === "withdrawal")
    .reduce((sum, item) => sum + Number(item.amount), 0);

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
          Kelola target, setor tabungan, tarik tabungan, dan lihat riwayat
          pergerakan saldo tabungan.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Target</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">
              {formatRupiah(totalTarget)}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Saldo Khusus Tabungan
            </p>
            <p className="mt-2 text-2xl font-bold text-green-600">
              {formatRupiah(totalSaved)}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Menabung</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">
              {formatRupiah(totalDeposit)}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Ambil</p>
            <p className="mt-2 text-2xl font-bold text-orange-600">
              {formatRupiah(totalWithdrawal)}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              Tambah Target Tabungan
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Target baru selalu dimulai dari Rp 0. Dana masuk melalui fitur
              Menabung.
            </p>

            <form onSubmit={handleAddGoal} className="mt-5 space-y-4">
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
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="Contoh 10000000"
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
            <h2 className="text-xl font-bold">Menabung / Ambil Tabungan</h2>

            <form
              onSubmit={handleSavingsTransaction}
              className="mt-5 space-y-4"
            >
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTransactionType("deposit")}
                  className={`rounded-xl p-3 font-semibold ${
                    transactionType === "deposit"
                      ? "bg-blue-600 text-white"
                      : "border bg-white text-slate-600"
                  }`}
                >
                  Menabung
                </button>

                <button
                  type="button"
                  onClick={() => setTransactionType("withdrawal")}
                  className={`rounded-xl p-3 font-semibold ${
                    transactionType === "withdrawal"
                      ? "bg-orange-500 text-white"
                      : "border bg-white text-slate-600"
                  }`}
                >
                  Ambil Tabungan
                </button>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Target Tabungan
                </label>

                <select
                  value={savingGoalId}
                  onChange={(e) => setSavingGoalId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3"
                >
                  <option value="">Pilih target</option>

                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.name} — {formatRupiah(goal.current_amount)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  {transactionType === "deposit"
                    ? "Dompet Sumber"
                    : "Dompet Tujuan"}
                </label>

                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3"
                >
                  <option value="">Pilih dompet</option>

                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Nominal
                </label>

                <input
                  type="number"
                  min="0"
                  value={transactionAmount}
                  onChange={(e) =>
                    setTransactionAmount(e.target.value)
                  }
                  placeholder="Contoh 500000"
                  className="w-full rounded-xl border border-slate-300 p-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Tanggal
                </label>

                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) =>
                    setTransactionDate(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 p-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Catatan
                </label>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Opsional"
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 p-3"
                />
              </div>

              <button
                disabled={saving}
                className={`w-full rounded-xl p-3 font-semibold text-white disabled:opacity-60 ${
                  transactionType === "deposit"
                    ? "bg-blue-600"
                    : "bg-orange-500"
                }`}
              >
                {saving
                  ? "Memproses..."
                  : transactionType === "deposit"
                  ? "Simpan Menabung"
                  : "Simpan Ambil Tabungan"}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Target Tabungan</h2>

          <div className="mt-5 space-y-4">
            {loading ? (
              <p className="text-slate-500">Memuat tabungan...</p>
            ) : goals.length === 0 ? (
              <p className="text-slate-500">
                Belum ada target tabungan.
              </p>
            ) : (
              goals.map((goal) => {
                const target = Number(goal.target_amount);
                const saved = Number(goal.current_amount);
                const remaining = Math.max(target - saved, 0);

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
                        <h3 className="font-bold">{goal.name}</h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {formatRupiah(saved)} dari{" "}
                          {formatRupiah(target)}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Sisa target: {formatRupiah(remaining)}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
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

        <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Riwayat Tabungan</h2>

          <div className="mt-5 overflow-x-auto">
            {loading ? (
              <p className="text-slate-500">Memuat riwayat...</p>
            ) : savingsTransactions.length === 0 ? (
              <p className="text-slate-500">
                Belum ada transaksi tabungan.
              </p>
            ) : (
              <div className="space-y-3">
                {savingsTransactions.map((item) => {
                  const goal = goals.find(
                    (x) => x.id === item.saving_goal_id
                  );

                  const account = accounts.find(
                    (x) => x.id === item.account_id
                  );

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold">
                            {item.type === "deposit"
                              ? "Menabung"
                              : "Ambil Tabungan"}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {formatTanggalIndonesia(
                              item.transaction_date
                            )}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Target: {goal?.name || "Target dihapus"}
                          </p>

                          <p className="text-sm text-slate-500">
                            Dompet: {account?.name || "Dompet dihapus"}
                          </p>

                          {item.notes && (
                            <p className="mt-1 text-sm text-slate-500">
                              Catatan: {item.notes}
                            </p>
                          )}
                        </div>

                        <p
                          className={`text-lg font-bold ${
                            item.type === "deposit"
                              ? "text-blue-600"
                              : "text-orange-500"
                          }`}
                        >
                          {item.type === "deposit" ? "+" : "-"}
                          {formatRupiah(Number(item.amount))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
