import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Wallet,
  PiggyBank,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  Home,
  Receipt,
  Target,
  FileText, HandCoins,
  X,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { jsPDF } from "jspdf";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Debt = {
  id: string;
  user_id: string;
  type: "debt" | "receivable";
  person_name: string;
  initial_amount: number;
  remaining_amount: number;
  paid_amount: number;
  status: string;
  debt_date: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
};

type DebtPayment = {
  id: string;
  user_id: string;
  debt_id: string;
  account_id: string | null;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
};

type Transaction = {
  id: string;
  user_id: string;
  account_id: string | null;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string | null;
  transaction_date: string;
  created_at: string;
};

type Account = {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  type: string;
};

type Budget = {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
};

type SavingGoal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
};

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

function Beranda() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            FINANSAPP
          </Link>

          <div className="flex gap-2">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-100"
            >
              Masuk
            </Link>

            <Link
              to="/daftar"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Daftar
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">
            Kelola Keuangan dengan{" "}
            <span className="text-blue-600">FINANSAPP</span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            Catat pemasukan, pengeluaran, tabungan, anggaran, dompet,
            dan lihat laporan keuangan Anda dalam satu aplikasi.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/daftar"
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white"
            >
              Mulai Sekarang
            </Link>

            <Link
              to="/login"
              className="rounded-xl border bg-white px-6 py-3 font-semibold"
            >
              Saya Sudah Punya Akun
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

type AuthMode = "login" | "daftar";

function HalamanAutentikasi({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isLogin = mode === "login";

  useEffect(() => {
    setEmail("");
    setPassword("");
    setNama("");
    setError("");
    setMessage("");
  }, [location.pathname]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Email wajib diisi.");
      return;
    }

    if (!password) {
      setError("Password wajib diisi.");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    if (!isLogin && !nama.trim()) {
      setError("Nama wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        navigate("/dashboard", { replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: "http://127.0.0.1:5173/login",
            data: {
              nama: nama.trim(),
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          navigate("/dashboard", { replace: true });
        } else {
          setMessage(
            "Pendaftaran berhasil. Silakan cek email untuk konfirmasi akun."
          );
          setPassword("");
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 flex items-center gap-2 text-sm text-slate-600"
        >
          <ArrowLeft size={18} />
          Kembali
        </Link>

        <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              {isLogin ? <Wallet size={27} /> : <Plus size={27} />}
            </div>

            <h1 className="text-2xl font-bold">
              {isLogin ? "Masuk ke FINANSAPP" : "Buat Akun FINANSAPP"}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {isLogin
                ? "Kelola keuangan Anda."
                : "Buat akun gratis untuk memulai."}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Nama
                </label>
                <input
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full rounded-xl border p-3"
                  placeholder="Nama Anda"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border p-3"
                placeholder="nama@email.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border p-3"
                placeholder="Minimal 6 karakter"
              />
            </div>

            <button
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 p-3 font-semibold text-white disabled:opacity-60"
            >
              {loading
                ? "Memproses..."
                : isLogin
                  ? "Masuk"
                  : "Daftar"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? (
              <>
                Belum punya akun?{" "}
                <Link
                  to="/daftar"
                  className="font-semibold text-blue-600"
                >
                  Daftar
                </Link>
              </>
            ) : (
              <>
                Sudah punya akun?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-blue-600"
                >
                  Masuk
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({
  active,
  onClose,
}: {
  active: string;
  onClose?: () => void;
}) {
  const menus = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/transaksi", label: "Transaksi", icon: Receipt },
    { path: "/tabungan", label: "Tabungan", icon: PiggyBank },
    { path: "/laporan", label: "Laporan", icon: BarChart3 },
    { path: "/anggaran", label: "Anggaran", icon: Target },
    { path: "/dompet", label: "Dompet", icon: Wallet },
    { path: "/utang-piutang", label: "Utang & Piutang", icon: HandCoins },
  { path: "/pengaturan", label: "Pengaturan", icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center justify-between border-b px-5">
        <Link to="/dashboard" className="text-xl font-bold text-blue-600">
          FINANSAPP
        </Link>

        {onClose && (
          <button onClick={onClose}>
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {menus.map((menu) => {
          const Icon = menu.icon;
          const isActive = active === menu.path;

          return (
            <Link
              key={menu.path}
              to={menu.path}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={19} />
              {menu.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function Layout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  const displayName =
    user.user_metadata?.nama ||
    user.email?.split("@")[0] ||
    "Pengguna";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="hidden lg:block"><Sidebar active={location.pathname} /></div>

      {mobileMenu && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={() => setMobileMenu(false)}
          />
          <div className="lg:hidden">
            <Sidebar
              active={location.pathname}
              onClose={() => setMobileMenu(false)}
            />
          </div>
        </>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b bg-white">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <button
              className="rounded-lg border p-2 lg:hidden"
              onClick={() => setMobileMenu(true)}
            >
              ☰
            </button>

            <div className="ml-auto flex items-center gap-4">
              <span className="hidden text-sm text-slate-600 sm:block">
                Halo, <b>{displayName}</b>
              </span>

              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function Dashboard({ user }: { user: User }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);

  async function load() {
    setLoading(true);

    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false });
    const { data: accountData } = await supabase.from("accounts").select("*").eq("user_id", user.id);
    setAccounts((accountData || []) as Account[]);

    setTransactions((data || []) as Transaction[]);


    const { data: goals } = await supabase
      .from("saving_goals")
      .select("*")
      .eq("user_id", user.id);

    setSavingGoals((goals || []) as SavingGoal[]);
    setLoading(false);
  }


  useEffect(() => {
    load();
    const refresh = () => { load(); };
    window.addEventListener("transactions-changed", refresh);
    return () => window.removeEventListener("transactions-changed", refresh);
  }, [user.id]);


  const income = transactions
    .filter((x) => x.type === "income")
    .reduce((a, x) => a + Number(x.amount), 0);

  const expense = transactions
    .filter((x) => x.type === "expense")
    .reduce((a, x) => a + Number(x.amount), 0);
  const accountBalance = accounts.reduce((sum, account) => {
    const accountTransactionTotal = transactions
      .filter((x) => x.account_id === account.id)
      .reduce(
        (accountSum, x) =>
          accountSum +
          (x.type === "income" ? Number(x.amount) : -Number(x.amount)),
        0
      );

    return sum + Number(account.balance) + accountTransactionTotal;
  }, 0);

  const unlinkedBalance = transactions
    .filter((x) => !x.account_id)
    .reduce(
      (sum, x) =>
        sum + (x.type === "income" ? Number(x.amount) : -Number(x.amount)),
      0
    );
  const balance = accountBalance + unlinkedBalance;

  const accountBalances = accounts.map((account) => {
    const accountTransactionTotal = transactions
      .filter((x) => x.account_id === account.id)
      .reduce(
        (sum, x) =>
          sum + (x.type === "income" ? Number(x.amount) : -Number(x.amount)),
        0
      );

    return {
      ...account,
      currentBalance: Number(account.balance) + accountTransactionTotal,
    };
  });

  const totalSavingCurrent = savingGoals.reduce(
    (total, goal) => total + Number(goal.current_amount),
    0
  );

  const totalSavingTarget = savingGoals.reduce(
    (total, goal) => total + Number(goal.target_amount),
    0
  );

  const chartData = Array.from({ length: 6 }, (_, index) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - index));

    const month = d.getMonth();
    const year = d.getFullYear();

    const rows = transactions.filter((x) => {
      const date = new Date(x.transaction_date);
      return (
        date.getMonth() === month &&
        date.getFullYear() === year
      );
    });

    return {
      name: d.toLocaleDateString("id-ID", { month: "short" }),
      pemasukan: rows
        .filter((x) => x.type === "income")
        .reduce((a, x) => a + Number(x.amount), 0),
      pengeluaran: rows
        .filter((x) => x.type === "expense")
        .reduce((a, x) => a + Number(x.amount), 0),
    };
  });

  return (
    <Layout user={user}>
      <h1 className="text-2xl font-bold sm:text-3xl">
        Dashboard
      </h1>

      <p className="mt-1 text-slate-500">
        Ringkasan kondisi keuangan Anda.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Saldo"
          value={formatRupiah(balance)}
          icon={<Wallet />}
          className="text-blue-600"
        />

        <SummaryCard
          title="Total Pemasukan"
          value={formatRupiah(income)}
          icon={<Plus />}
          className="text-green-600"
        />

        <SummaryCard
          title="Total Pengeluaran"
          value={formatRupiah(expense)}
          icon={<Receipt />}
          className="text-red-600"
        />

        <SummaryCard
          title="Transaksi"
          value={String(transactions.length)}
          icon={<FileText />}
          className="text-purple-600"
        />

        <SummaryCard
          title="Total Tabungan"
          value={formatRupiah(totalSavingCurrent)}
          icon={<Wallet />}
          className="text-amber-600"
        />

        <SummaryCard
          title="Target Tabungan"
          value={formatRupiah(totalSavingTarget)}
          icon={<Wallet />}
          className="text-indigo-600"
        />
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Rincian Saldo</h2>
            <p className="text-sm text-slate-500">
              Saldo masing-masing dompet dan rekening
            </p>
          </div>
          <Wallet className="text-blue-600" />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-600">Total Saldo</p>
            <p className="mt-1 text-xl font-bold text-blue-700">
              {formatRupiah(balance)}
            </p>
          </div>

          {accountBalances.map((account) => (
            <div
              key={account.id}
              className="rounded-xl border bg-slate-50 p-4"
            >
              <p className="text-sm font-semibold text-slate-600">
                {account.name}
              </p>
              <p className="mt-1 text-xl font-bold text-slate-800">
                {formatRupiah(account.currentBalance)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {account.type}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">
          Grafik Pemasukan & Pengeluaran
        </h2>

        <p className="text-sm text-slate-500">
          Perbandingan 6 bulan terakhir
        </p>

        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                tickFormatter={(value) =>
                  new Intl.NumberFormat("id-ID", {
                    notation: "compact",
                  }).format(value)
                }
              />
              <Tooltip
                formatter={(value) => formatRupiah(Number(value))}
              />
              <Legend />
              <Bar
                dataKey="pemasukan"
                name="Pemasukan"
                fill="#16a34a"
              />
              <Bar
                dataKey="pengeluaran"
                name="Pengeluaran"
                fill="#dc2626"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Transaksi Terbaru</h2>

        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="text-slate-500">Memuat...</p>
          ) : transactions.length === 0 ? (
            <p className="text-slate-500">
              Belum ada transaksi.
            </p>
          ) : (
            transactions.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border p-4"
              >
                <div>
                  <p className="font-semibold">{item.category}</p>
                  <p className="text-sm text-slate-500">
                    {formatTanggalIndonesia(item.transaction_date)}
                  </p>
                </div>

                <span
                  className={
                    item.type === "income"
                      ? "font-bold text-green-600"
                      : "font-bold text-red-600"
                  }
                >
                  {item.type === "income" ? "+" : "-"}
                  {formatRupiah(Number(item.amount))}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  className,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  className: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className={`mb-3 ${className}`}>{icon}</div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-2 text-xl font-bold ${className}`}>{value}</p>
    </div>
  );
}

function Transaksi({ user }: { user: User }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");

  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [editing, setEditing] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) setError(error.message);

    setTransactions((data || []) as Transaction[]);
    const { data: accountData, error: accountError } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (accountError) setError(accountError.message);
    setAccounts((accountData || []) as Account[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const refresh = () => { load(); };
    window.addEventListener("transactions-changed", refresh);
    return () => window.removeEventListener("transactions-changed", refresh);
  }, [user.id]);

  function reset() {
    setEditing(null);
    setAmount("");
    setCategory("");
    setDescription("");
    setType("income");
    setDate(new Date().toISOString().slice(0, 10));
    setAccountId("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!amount || Number(amount) <= 0) {
      setError("Nominal harus lebih dari 0.");
      return;
    }

    if (!category.trim()) {
      setError("Kategori wajib diisi.");
      return;
    }

    setSaving(true);

    const payload = {
      type,
      amount: Number(amount),
      category: category.trim(),
      year: new Date().getFullYear(),
      description: description.trim() || null,
      transaction_date: date,
      account_id: accountId || null,
    };

    const result = editing
      ? await supabase
          .from("transactions")
          .update(payload)
          .eq("id", editing)
          .eq("user_id", user.id)
      : await supabase
          .from("transactions")
          .insert({
            ...payload,
            user_id: user.id,
          });

    if (result.error) {
      setError(result.error.message);
    } else {
      reset();
      await load();
      window.dispatchEvent(new Event("transactions-changed"));
    }

    setSaving(false);
  }

  function edit(item: Transaction) {
    setEditing(item.id);
    setType(item.type);
    setAmount(String(item.amount));
    setCategory(item.category);
    setDescription(item.description || "");
    setDate(item.transaction_date);
    setAccountId(item.account_id || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id: string) {
    if (!confirm("Hapus transaksi ini?")) return;

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) setError(error.message);
    else {
      await load();
      window.dispatchEvent(new Event("transactions-changed"));
    }
  }

  const filtered = transactions.filter((item) => {
    const q = search.toLowerCase().trim();

    return (
      !q ||
      item.category.toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q)
    );
  });

  return (
    <Layout user={user}>
      <h1 className="text-2xl font-bold">Transaksi</h1>
      <p className="mt-1 text-slate-500">
        Kelola semua pemasukan dan pengeluaran.
      </p>

      {error && (
        <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">
            {editing ? "Edit Transaksi" : "Tambah Transaksi"}
          </h2>

          <form onSubmit={save} className="mt-5 space-y-4">
            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as "income" | "expense")
              }
              className="w-full rounded-xl border p-3"
            >
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>

            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-xl border p-3"
            >
              <option value="">Tanpa dompet</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} — {account.type}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Nominal"
              className="w-full rounded-xl border p-3"
            />

            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Kategori"
              className="w-full rounded-xl border p-3"
            />

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border p-3"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Keterangan (opsional)"
              rows={3}
              className="w-full rounded-xl border p-3"
            />

            <div className="flex gap-2">
              <button
                disabled={saving}
                className="flex-1 rounded-xl bg-blue-600 p-3 font-semibold text-white"
              >
                {saving
                  ? "Menyimpan..."
                  : editing
                    ? "Simpan Perubahan"
                    : "Simpan Transaksi"}
              </button>

              {editing && (
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-xl border px-4"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Daftar Transaksi</h2>
            <span className="text-sm text-slate-500">
              {filtered.length} data
            </span>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari transaksi..."
            className="mt-4 w-full rounded-xl border p-3"
          />

          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-slate-500">Memuat...</p>
            ) : filtered.length === 0 ? (
              <p className="text-slate-500">
                Belum ada transaksi.
              </p>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {item.category}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatTanggalIndonesia(item.transaction_date)}
                      </p>
                      {item.description && (
                        <p className="mt-1 text-sm text-slate-400">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <p
                      className={
                        item.type === "income"
                          ? "font-bold text-green-600"
                          : "font-bold text-red-600"
                      }
                    >
                      {item.type === "income" ? "+" : "-"}
                      {formatRupiah(Number(item.amount))}
                    </p>
                  </div>

                  <div className="mt-3 flex gap-4 border-t pt-3">
                    <button
                      onClick={() => edit(item)}
                      className="flex items-center gap-1 text-sm text-blue-600"
                    >
                      <Edit3 size={15} />
                      Edit
                    </button>

                    <button
                      onClick={() => remove(item.id)}
                      className="flex items-center gap-1 text-sm text-red-600"
                    >
                      <Trash2 size={15} />
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Tabungan({ user }: { user: User }) {
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from("saving_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setGoals((data || []) as SavingGoal[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const refresh = () => { load(); };
    window.addEventListener("transactions-changed", refresh);
    return () => window.removeEventListener("transactions-changed", refresh);
  }, [user.id]);

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();

    const targetAmount = Number(target);
    const currentAmount = Number(current) || 0;

    if (!name.trim()) {
      alert("Nama target wajib diisi.");
      return;
    }

    if (targetAmount <= 0) {
      alert("Target tabungan harus lebih dari Rp 0.");
      return;
    }

    if (currentAmount < 0) {
      alert("Tabungan saat ini tidak boleh negatif.");
      return;
    }

    if (currentAmount > targetAmount) {
      alert("Tabungan saat ini tidak boleh lebih besar dari target.");
      return;
    }

    const { error } = await supabase.from("saving_goals").insert({
      user_id: user.id,
      name: name.trim(),
      target_amount: targetAmount,
      current_amount: currentAmount,
    });

    if (error) {
      console.error("Gagal menambah target:", error);
      alert("Gagal menambah target: " + error.message);
      return;
    }

    setName("");
    setTarget("");
    setCurrent("");
    await load();
      window.dispatchEvent(new Event("transactions-changed"));
  }

  async function remove(id: string) {
    if (!confirm("Hapus target tabungan?")) return;

    await supabase
      .from("saving_goals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    await load();
      window.dispatchEvent(new Event("transactions-changed"));
  }

  return (
    <Layout user={user}>
      <h1 className="text-2xl font-bold">Tabungan</h1>
      <p className="mt-1 text-slate-500">
        Buat dan pantau target tabungan Anda.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="font-bold">Target Baru</h2>

          <form onSubmit={addGoal} className="mt-4 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama target"
              className="w-full rounded-xl border p-3"
            />

            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Target Rp"
              className="w-full rounded-xl border p-3"
            />

            <input
              type="number"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Tabungan saat ini Rp"
              className="w-full rounded-xl border p-3"
            />

            <button className="w-full rounded-xl bg-blue-600 p-3 font-semibold text-white">
              Tambah Target
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          {loading ? (
            <p>Memuat...</p>
          ) : goals.length === 0 ? (
            <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">
              Belum ada target tabungan.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {goals.map((goal) => {
                const percent =
                  goal.target_amount > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (goal.current_amount /
                            goal.target_amount) *
                            100
                        )
                      )
                    : 0;

                return (
                  <div
                    key={goal.id}
                    className="rounded-2xl border bg-white p-5 shadow-sm"
                  >
                    <div className="flex justify-between">
                      <h2 className="font-bold">{goal.name}</h2>
                      <button onClick={() => remove(goal.id)}>
                        <Trash2
                          size={18}
                          className="text-red-500"
                        />
                      </button>
                    </div>

                    <p className="mt-3 text-sm text-slate-500">
                      {formatRupiah(goal.current_amount)} dari{" "}
                      {formatRupiah(goal.target_amount)}
                    </p>

                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <p className="mt-2 text-right text-sm font-semibold text-blue-600">
                      {percent}%
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function Laporan({ user }: { user: User }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<"hari" | "minggu" | "bulan" | "tahun">("bulan");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false });

      setTransactions((data || []) as Transaction[]);

    }

    load();
    const refresh = () => { load(); };
    window.addEventListener("transactions-changed", refresh);
    return () => window.removeEventListener("transactions-changed", refresh);
  }, [user.id]);

  const now = new Date();

  const filtered = transactions.filter((x) => {
    const d = new Date(x.transaction_date);

    if (period === "hari") {
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }

    if (period === "minggu") {
      const startOfWeek = new Date(now);
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(now.getDate() - now.getDay());

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return d >= startOfWeek && d <= endOfWeek;
    }

    if (period === "bulan") {
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }

    return d.getFullYear() === now.getFullYear();
  });

  const income = filtered
    .filter((x) => x.type === "income")
    .reduce((a, x) => a + Number(x.amount), 0);

  const expense = filtered
    .filter((x) => x.type === "expense")
    .reduce((a, x) => a + Number(x.amount), 0);

  const categoryData = Array.from(
    filtered
      .filter((x) => x.type === "expense")
      .reduce((map, x) => {
        map.set(
          x.category,
          (map.get(x.category) || 0) + Number(x.amount)
        );
        return map;
      }, new Map<string, number>())
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const difference = income - expense;

  const expensePercentage =
    income > 0
      ? Math.round((expense / income) * 100)
      : 0;

  const largestExpenseCategory =
    categoryData.length > 0
      ? categoryData[0]
      : null;

  const analysisStatus =
    filtered.length === 0
      ? "Belum ada data"
      : difference < 0
      ? "Perlu diperhatikan"
      : expensePercentage <= 70
      ? "Keuangan sehat"
      : "Perlu dikendalikan";

  const analysisMessage =
    filtered.length === 0
      ? "Belum ada transaksi pada periode yang dipilih."
      : difference < 0
      ? "Pengeluaran lebih besar daripada pemasukan. Coba kurangi pengeluaran dan prioritaskan kebutuhan utama."
      : expensePercentage <= 70
      ? "Pemasukan masih lebih besar daripada pengeluaran. Pertahankan pola keuangan yang baik."
      : "Sebagian besar pemasukan sudah digunakan untuk pengeluaran. Pertimbangkan untuk meningkatkan tabungan atau mengurangi pengeluaran.";

  const analysisTips = largestExpenseCategory
    ? "Kategori pengeluaran terbesar adalah " +
      largestExpenseCategory.name +
      " sebesar " +
      formatRupiah(largestExpenseCategory.value) +
      "."
    : "Belum ada kategori pengeluaran untuk dianalisis.";

  function downloadReportPDF() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const periodLabel =
      period === "hari"
        ? "Hari Ini"
        : period === "minggu"
        ? "Minggu Ini"
        : period === "bulan"
        ? "Bulan Ini"
        : "Tahun Ini";

    const formatDate = (value: string) => formatTanggalIndonesia(value);

    const addPageHeader = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("FINANSAPP", margin, 9);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(
        "Rekap Laporan Keuangan - " + periodLabel,
        pageWidth - margin,
        9,
        { align: "right" }
      );

      doc.setDrawColor(210, 214, 220);
      doc.line(margin, 12, pageWidth - margin, 12);
    };

    const ensureSpace = (height: number) => {
      if (y + height > pageHeight - 16) {
        doc.addPage();
        addPageHeader();
        y = 20;
      }
    };

    const drawSectionTitle = (title: string) => {
      ensureSpace(14);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(title, margin, y);

      y += 5;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageWidth - margin, y);
      y += 7;

      doc.setTextColor(0, 0, 0);
    };

    const drawTable = (
      headers: string[],
      rows: string[][],
      widths: number[],
      alignments: ("left" | "center" | "right")[]
    ) => {
      const headerHeight = 9;
      const rowMinHeight = 8;

      const drawHeader = () => {
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, y, contentWidth, headerHeight, "FD");

        let x = margin;

        headers.forEach((header, index) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);

          const cellX = x;
          const cellWidth = widths[index];

          let textX = cellX + 2;

          if (alignments[index] === "center") {
            textX = cellX + cellWidth / 2;
          } else if (alignments[index] === "right") {
            textX = cellX + cellWidth - 2;
          }

          doc.text(header, textX, y + 6, {
            align: alignments[index],
          });

          x += cellWidth;
        });

        y += headerHeight;
      };

      drawHeader();

      rows.forEach((row) => {
        const wrappedCells = row.map((text, index) =>
          doc.splitTextToSize(
            String(text || "-"),
            Math.max(widths[index] - 4, 8)
          )
        );

        const maxLines = Math.max(
          ...wrappedCells.map((lines) => lines.length)
        );

        const rowHeight = Math.max(
          rowMinHeight,
          maxLines * 4.2 + 3.5
        );

        if (y + rowHeight > pageHeight - 16) {
          doc.addPage();
          addPageHeader();
          y = 20;
          drawHeader();
        }

        let x = margin;

        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, y, contentWidth, rowHeight);

        row.forEach((_, index) => {
          const cellWidth = widths[index];

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(51, 65, 85);

          const lines = wrappedCells[index];

          let textX = x + 2;
          let align: "left" | "center" | "right" = "left";

          if (alignments[index] === "center") {
            textX = x + cellWidth / 2;
            align = "center";
          } else if (alignments[index] === "right") {
            textX = x + cellWidth - 2;
            align = "right";
          }

          doc.text(lines, textX, y + 5.5, {
            align,
            lineHeightFactor: 1,
          });

          if (index < row.length - 1) {
            doc.line(x + cellWidth, y, x + cellWidth, y + rowHeight);
          }

          x += cellWidth;
        });

        y += rowHeight;
      });

      y += 5;
    };

    let y = 20;

    addPageHeader();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text("FINANSAPP", margin, y);

    y += 8;

    doc.setFontSize(15);
    doc.text("Rekap Laporan Keuangan", margin, y);

    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Periode laporan: " + periodLabel, margin, y);

    y += 5;
    doc.text(
      "Dibuat: " +
        formatDate(new Date().toISOString()),
      margin,
      y
    );

    y += 10;

    drawSectionTitle("Ringkasan Keuangan");

    drawTable(
      ["Keterangan", "Nilai"],
      [
        ["Pemasukan", formatRupiah(income)],
        ["Pengeluaran", formatRupiah(expense)],
        ["Selisih", formatRupiah(difference)],
        ["Jumlah Transaksi", String(filtered.length)],
        ["Pengeluaran dari Pemasukan", expensePercentage + "%"],
      ],
      [115, contentWidth - 115],
      ["left", "right"]
    );

    drawSectionTitle("Pengeluaran Berdasarkan Kategori");

    if (categoryData.length > 0) {
      const totalExpense = expense;

      drawTable(
        ["No", "Kategori", "Jumlah", "Persentase"],
        categoryData.map((item, index) => [
          String(index + 1),
          item.name,
          formatRupiah(item.value),
          totalExpense > 0
            ? Math.round((item.value / totalExpense) * 100) + "%"
            : "0%",
        ]),
        [14, 76, 58, contentWidth - 148],
        ["center", "left", "right", "right"]
      );
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Belum ada data pengeluaran.", margin, y);
      y += 10;
    }

    drawSectionTitle("Detail Transaksi");

    if (filtered.length > 0) {
      const sortedTransactions = [...filtered].sort(
        (a, b) =>
          new Date(b.transaction_date).getTime() -
          new Date(a.transaction_date).getTime()
      );

      drawTable(
        [
          "No",
          "Tanggal",
          "Jenis",
          "Kategori",
          "Keterangan",
          "Nominal",
        ],
        sortedTransactions.map((item, index) => [
          String(index + 1),
          formatDate(item.transaction_date),
          item.type === "income"
            ? "Pemasukan"
            : "Pengeluaran",
          item.category || "-",
          item.description || "-",
          formatRupiah(Number(item.amount)),
        ]),
        [10, 22, 28, 34, 51, contentWidth - 145],
        ["center", "center", "center", "left", "left", "right"]
      );
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Belum ada transaksi pada periode ini.", margin, y);
      y += 10;
    }

    drawSectionTitle("Analisis Keuangan");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("Status: " + analysisStatus, margin, y);

    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    const analysisLines = doc.splitTextToSize(
      analysisMessage,
      contentWidth
    );

    analysisLines.forEach((line: string) => {
      ensureSpace(5);
      doc.text(line, margin, y);
      y += 5;
    });

    y += 3;

    if (largestExpenseCategory) {
      const largestText =
        "Pengeluaran terbesar: " +
        largestExpenseCategory.name +
        " sebesar " +
        formatRupiah(largestExpenseCategory.value) +
        ".";

      const largestLines = doc.splitTextToSize(
        largestText,
        contentWidth
      );

      largestLines.forEach((line: string) => {
        ensureSpace(5);
        doc.text(line, margin, y);
        y += 5;
      });
    }

    y += 3;

    const recommendationLines = doc.splitTextToSize(
      "Rekomendasi: " + savingRecommendation,
      contentWidth
    );

    recommendationLines.forEach((line: string) => {
      ensureSpace(5);
      doc.text(line, margin, y);
      y += 5;
    });

    const totalPages = doc.getNumberOfPages();

    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);

      doc.setDrawColor(226, 232, 240);
      doc.line(
        margin,
        pageHeight - 11,
        pageWidth - margin,
        pageHeight - 11
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);

      doc.text(
        "FINANSAPP - Rekap Laporan Keuangan",
        margin,
        pageHeight - 6
      );

      doc.text(
        "Halaman " + page + " dari " + totalPages,
        pageWidth - margin,
        pageHeight - 6,
        { align: "right" }
      );
    }

    doc.save(
      "FINANSAPP-Rekap-" +
        periodLabel.replace(/\s+/g, "-") +
        ".pdf"
    );
  }
  const savingRecommendation = largestExpenseCategory
    ? largestExpenseCategory.value > expense * 0.5
      ? "Pertimbangkan mengurangi pengeluaran pada kategori " +
        largestExpenseCategory.name +
        " karena menyumbang lebih dari setengah total pengeluaran."
      : expensePercentage > 70
      ? "Coba tetapkan batas pengeluaran untuk kategori " +
        largestExpenseCategory.name +
        " agar lebih banyak pemasukan dapat dialihkan ke tabungan."
      : "Pertahankan pengeluaran pada kategori " +
        largestExpenseCategory.name +
        " dan sisihkan sebagian selisih pemasukan untuk tabungan."
    : "Mulai mencatat pengeluaran agar rekomendasi penghematan dapat dibuat.";


  return (
    <Layout user={user}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Laporan</h1>
          <p className="mt-1 text-slate-500">
            Analisis keuangan Anda.
          </p>
        </div>

        <select
          value={period}
          onChange={(e) =>
            setPeriod(e.target.value as "hari" | "minggu" | "bulan" | "tahun")
          }
          className="rounded-xl border bg-white p-3"
        >
          <option value="hari">Hari Ini</option>
          <option value="minggu">Minggu Ini</option>
          <option value="bulan">Bulan Ini</option>
          <option value="tahun">Tahun Ini</option>
        </select>

        <button
          type="button"
          onClick={downloadReportPDF}
          className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white"
        >
          📄 Unduh PDF
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Pemasukan"
          value={formatRupiah(income)}
          icon={<Plus />}
          className="text-green-600"
        />

        <SummaryCard
          title="Pengeluaran"
          value={formatRupiah(expense)}
          icon={<Receipt />}
          className="text-red-600"
        />

        <SummaryCard
          title="Selisih"
          value={formatRupiah(difference)}
          icon={<BarChart3 />}
          className={
            difference >= 0
              ? "text-blue-600"
              : "text-red-600"
          }
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Jumlah Transaksi
          </p>
          <p className="mt-2 text-2xl font-bold text-purple-600">
            {filtered.length}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            transaksi pada periode ini
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Pengeluaran dari Pemasukan
          </p>
          <p className="mt-2 text-2xl font-bold text-orange-600">
            {expensePercentage}%
          </p>
          <p className="mt-1 text-sm text-slate-500">
            berdasarkan periode terpilih
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Pengeluaran Terbesar
          </p>

          {largestExpenseCategory ? (
            <>
              <p className="mt-2 truncate text-lg font-bold text-red-600">
                {largestExpenseCategory.name}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {formatRupiah(largestExpenseCategory.value)}
              </p>
            </>
          ) : (
            <p className="mt-2 text-slate-500">
              Belum ada pengeluaran.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Analisis Keuangan</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ringkasan otomatis berdasarkan periode yang dipilih.
            </p>
          </div>
          <span
            className={
              "rounded-full px-3 py-1 text-xs font-semibold " +
              (analysisStatus === "Keuangan sehat"
                ? "bg-green-50 text-green-600"
                : analysisStatus === "Perlu diperhatikan"
                ? "bg-red-50 text-red-600"
                : analysisStatus === "Perlu dikendalikan"
                ? "bg-amber-50 text-amber-600"
                : "bg-slate-100 text-slate-600")
            }
          >
            {analysisStatus}
          </span>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <p className="text-sm leading-6 text-slate-700">
            {analysisMessage}
          </p>
        </div>

        <div className="mt-3 rounded-xl border p-4">
          <p className="text-sm font-semibold text-slate-700">
            💡 Insight
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {analysisTips}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="font-bold">Rekomendasi Penghematan</h2>
        <p className="mt-1 text-sm text-slate-500">
          Saran otomatis untuk membantu mengurangi pengeluaran.
        </p>

        <div className="mt-4 rounded-xl bg-blue-50 p-4">
          <p className="text-sm leading-6 text-blue-700">
            💡 {savingRecommendation}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="font-bold">Pengeluaran Berdasarkan Kategori</h2>

        <div className="mt-4 h-80">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  label
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={
                        [
                          "#2563eb",
                          "#16a34a",
                          "#dc2626",
                          "#f59e0b",
                          "#7c3aed",
                          "#0891b2",
                        ][index % 6]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    formatRupiah(Number(value))
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500">
              Belum ada data pengeluaran.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function Anggaran({ user }: { user: User }) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetTransactions, setBudgetTransactions] = useState<Transaction[]>([]);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");

  const month = new Date().getMonth() + 1;

  async function load() {
    const { data } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", month)
      .eq("year", new Date().getFullYear());

    setBudgets((data || []) as Budget[]);

    const { data: transactionData, error: transactionError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id);

    if (transactionError) {
      console.error("Gagal memuat transaksi untuk anggaran:", transactionError);
      setBudgetTransactions([]);
    } else {
      setBudgetTransactions((transactionData || []) as Transaction[]);
    }
  }

  useEffect(() => {
    load();
    const refresh = () => { load(); };
    window.addEventListener("transactions-changed", refresh);
    return () => window.removeEventListener("transactions-changed", refresh);
  }, [user.id]);

  async function add(e: React.FormEvent) {
    e.preventDefault();

    if (!category.trim() || Number(amount) <= 0) return;

    const { error } = await supabase.from("budgets").insert({
      user_id: user.id,
      category: category.trim(),
      year: new Date().getFullYear(),
      amount: Number(amount),
      month,
    });

    if (error) {
      console.error("Gagal menyimpan anggaran:", error);
      alert("Gagal menyimpan anggaran: " + error.message);
      return;
    }

    alert("Anggaran berhasil disimpan.");
    setCategory("");
    setAmount("");
    await load();
      window.dispatchEvent(new Event("transactions-changed"));
  }

  async function remove(id: string) {
    await supabase
      .from("budgets")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    await load();
      window.dispatchEvent(new Event("transactions-changed"));
  }

  function getBudgetProgress(budget: Budget) {
    const year = new Date().getFullYear();
    const monthKey = year + "-" + String(month).padStart(2, "0");

    const spent = budgetTransactions
      .filter((tx) =>
        tx.type === "expense" &&
        tx.category.trim().toLowerCase() === budget.category.trim().toLowerCase() &&
        tx.transaction_date.slice(0, 7) === monthKey
      )
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const percentage = budget.amount > 0
      ? (spent / Number(budget.amount)) * 100
      : 0;

    const progress = Math.min(percentage, 100);
    const remaining = Number(budget.amount) - spent;

    return {
      spent,
      percentage: Math.round(percentage),
      progress,
      remaining,
    };
  }

  return (
    <Layout user={user}>
      <h1 className="text-2xl font-bold">Anggaran</h1>
      <p className="mt-1 text-slate-500">
        Atur batas pengeluaran berdasarkan kategori.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="font-bold">Tambah Anggaran</h2>

          <form onSubmit={add} className="mt-4 space-y-3">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Kategori"
              className="w-full rounded-xl border p-3"
            />

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Batas anggaran Rp"
              className="w-full rounded-xl border p-3"
            />

            <button className="w-full rounded-xl bg-blue-600 p-3 font-semibold text-white">
              Simpan Anggaran
            </button>
          </form>
        </div>

        <div className="space-y-4 lg:col-span-2">
          {budgets.length === 0 ? (
            <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">
              Belum ada anggaran bulan ini.
            </div>
          ) : (
            budgets.map((budget) => {
              const { spent, percentage, progress, remaining } = getBudgetProgress(budget);
              const isOver = percentage >= 100;
              const isNear = percentage >= 80 && percentage < 100;
              const statusText = isOver ? "Melebihi anggaran" : isNear ? "Mendekati batas" : "Aman";
              const statusClass = isOver ? "bg-red-50 text-red-600" : isNear ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600";
              const progressClass = isOver ? "bg-red-500" : isNear ? "bg-amber-500" : "bg-green-500";

              return (
                <div
                  key={budget.id}
                  className="rounded-2xl border bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold">{budget.category}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Batas: {formatRupiah(budget.amount)}
                      </p>
                    </div>

                    <button onClick={() => remove(budget.id)}>
                      <Trash2 className="text-red-500" size={18} />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-sm text-slate-500">Batas</p>
                      <p className="font-semibold">{formatRupiah(budget.amount)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Terpakai</p>
                      <p className="font-semibold">{formatRupiah(spent)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        {remaining >= 0 ? "Sisa" : "Kelebihan"}
                      </p>
                      <p className={remaining >= 0 ? "font-semibold text-green-600" : "font-semibold text-red-600"}>
                        {formatRupiah(Math.abs(remaining))}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-500">Pemakaian anggaran</span>
                      <span className="font-semibold">{percentage}%</span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={"h-full rounded-full " + progressClass}
                        style={{ width: progress + "%" }}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className={"rounded-full px-3 py-1 text-xs font-semibold " + statusClass}>
                      {statusText}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}

function Dompet({ user }: { user: User }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [type, setType] = useState("Tunai");
  const [accountTransactions, setAccountTransactions] = useState<Pick<Transaction, "account_id" | "type" | "amount">[]>([]);

  async function load() {
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setAccounts((data || []) as Account[]);
    const { data: transactionData } = await supabase.from("transactions").select("account_id, type, amount").eq("user_id", user.id).not("account_id", "is", null);
    setAccountTransactions((transactionData || []) as Pick<Transaction, "account_id" | "type" | "amount">[]);
  }

  useEffect(() => {
    load();
    const refresh = () => { load(); };
    window.addEventListener("transactions-changed", refresh);
    return () => window.removeEventListener("transactions-changed", refresh);
  }, [user.id]);

  async function add(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) return;

    const { error } = await supabase.from("accounts").insert({
      user_id: user.id,
      name: name.trim(),
      balance: Number(balance) || 0,
      type,
    });

    if (!error) {
      setName("");
      setBalance("");
      setType("Tunai");
      await load();
      window.dispatchEvent(new Event("transactions-changed"));
    }
  }

  async function remove(id: string) {
    if (!confirm("Hapus dompet ini?")) return;

    await supabase
      .from("accounts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    await load();
      window.dispatchEvent(new Event("transactions-changed"));
  }

  return (
    <Layout user={user}>
      <h1 className="text-2xl font-bold">Dompet</h1>
      <p className="mt-1 text-slate-500">
        Kelola rekening, e-wallet, dan uang tunai.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="font-bold">Tambah Dompet</h2>

          <form onSubmit={add} className="mt-4 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama dompet"
              className="w-full rounded-xl border p-3"
            />

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border p-3"
            >
              <option>Tunai</option>
              <option>Bank</option>
              <option>E-Wallet</option>
              <option>Lainnya</option>
            </select>

            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="Saldo awal Rp"
              className="w-full rounded-xl border p-3"
            />

            <button className="w-full rounded-xl bg-blue-600 p-3 font-semibold text-white">
              Tambah Dompet
            </button>
          </form>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          {accounts.length === 0 ? (
            <div className="rounded-2xl border bg-white p-8 text-center text-slate-500 sm:col-span-2">
              Belum ada dompet.
            </div>
          ) : (
            accounts.map((account) => (
              <div
                key={account.id}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      {account.type}
                    </p>
                    <h2 className="mt-1 font-bold">
                      {account.name}
                    </h2>
                  </div>

                  <button onClick={() => remove(account.id)}>
                    <Trash2 className="text-red-500" size={18} />
                  </button>
                </div>

                <p className="mt-6 text-xl font-bold text-blue-600">
                  {formatRupiah(Number(account.balance) + accountTransactions.filter((tx) => tx.account_id === account.id).reduce((sum, tx) => sum + (tx.type === "income" ? Number(tx.amount) : -Number(tx.amount)), 0))}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

function UtangPiutang({ user }: { user: User }) {
  const [items, setItems] = useState<Debt[]>([]);
  const [type, setType] = useState<"debt" | "receivable">("debt");
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [debtDate, setDebtDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<DebtPayment[]>([]);
  const [debtSearch, setDebtSearch] = useState("");
  const [debtFilter, setDebtFilter] = useState<
    "all" | "debt" | "receivable" | "active" | "paid" | "overdue"
  >("all");

  async function load() {
    const { data, error } = await supabase.from("debts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) { console.error("Gagal memuat utang piutang:", error); return; }
    setItems((data || []) as Debt[]);

    const { data: accountData, error: accountError } =
      await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (accountError) {
      console.error("Gagal memuat dompet:", accountError);
      return;
    }

    setAccounts((accountData || []) as Account[]);

    const { data: paymentData, error: paymentError } =
      await supabase
        .from("debt_payments")
        .select("*")
        .eq("user_id", user.id)
        .order("payment_date", { ascending: false })
        .order("created_at", { ascending: false });

    if (paymentError) {
      console.error("Gagal memuat riwayat cicilan:", paymentError);
      return;
    }

    setPaymentHistory((paymentData || []) as DebtPayment[]);
  }

  useEffect(() => { load(); }, [user.id]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!personName.trim()) { alert("Nama wajib diisi."); return; }
    if (Number(amount) <= 0) { alert("Jumlah harus lebih dari Rp0."); return; }
    setLoading(true);
    const { error } = await supabase.from("debts").insert({
      user_id: user.id,
      type,
      person_name: personName.trim(),
      amount: Number(amount),
      initial_amount: Number(amount),
      remaining_amount: Number(amount),
      debt_date: debtDate,
      due_date: dueDate || null,
      notes: notes.trim() || null,
    });
    setLoading(false);
    if (error) { console.error("Gagal menyimpan utang piutang:", error); alert("Gagal menyimpan: " + error.message); return; }
    setPersonName("");
    setAmount("");
    setDebtDate(new Date().toISOString().slice(0, 10));
    setDueDate("");
    setNotes("");
    await load();
  }

  async function pay(item: Debt) {
    const value = Number(paymentAmount);

    if (!paymentId || paymentId !== item.id) {
      alert("Pilih data yang akan dibayar terlebih dahulu.");
      return;
    }

    if (!Number.isFinite(value) || value <= 0) {
      alert("Jumlah pembayaran harus lebih dari Rp0.");
      return;
    }

    if (!paymentAccountId) {
      alert("Pilih sumber pembayaran terlebih dahulu.");
      return;
    }

    const currentRemaining = Number(item.remaining_amount);
    const currentPaid = Number((item as Debt & { paid_amount?: number }).paid_amount || 0);

    if (value > currentRemaining) {
      alert("Jumlah pembayaran tidak boleh melebihi sisa.");
      return;
    }

    const newRemaining = currentRemaining - value;
    const newPaid = currentPaid + value;
    const newStatus = newRemaining <= 0 ? "paid" : "active";

    setLoading(true);

    const transactionType =
      item.type === "debt" ? "expense" : "income";

    const transactionCategory =
      item.type === "debt"
        ? "Pembayaran Utang"
        : "Penerimaan Piutang";

    const transactionDescription =
      item.type === "debt"
        ? `Bayar utang kepada ${item.person_name}`
        : `Terima piutang dari ${item.person_name}`;

    const {
      data: transactionData,
      error: transactionError,
    } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        account_id: paymentAccountId === "saldo" ? null : paymentAccountId,
        type: transactionType,
        amount: value,
        category: transactionCategory,
        description: transactionDescription,
        transaction_date: new Date().toISOString().slice(0, 10),
        year: new Date().getFullYear(),
      })
      .select("id")
      .single();

    if (transactionError) {
      setLoading(false);
      alert(
        "Gagal menyimpan transaksi pembayaran: " +
        transactionError.message
      );
      return;
    }

    const {
      data: paymentData,
      error: paymentError,
    } = await supabase
      .from("debt_payments")
      .insert({
        user_id: user.id,
        debt_id: item.id,
        account_id: paymentAccountId === "saldo" ? null : paymentAccountId,
        amount: value,
        payment_date: new Date().toISOString().slice(0, 10),
        notes: transactionDescription,
      })
      .select("id")
      .single();

    if (paymentError) {
      if (transactionData?.id) {
        await supabase
          .from("transactions")
          .delete()
          .eq("id", transactionData.id)
          .eq("user_id", user.id);
      }

      setLoading(false);
      console.error("Gagal menyimpan riwayat cicilan:", paymentError);
      alert("Gagal menyimpan riwayat cicilan: " + paymentError.message);
      return;
    }

    const { error } = await supabase
      .from("debts")
      .update({
        paid_amount: newPaid,
        remaining_amount: newRemaining,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id)
      .eq("user_id", user.id);

    setLoading(false);

    if (error) {
      if (paymentData?.id) {
        await supabase
          .from("debt_payments")
          .delete()
          .eq("id", paymentData.id)
          .eq("user_id", user.id);
      }

      if (transactionData?.id) {
        await supabase
          .from("transactions")
          .delete()
          .eq("id", transactionData.id)
          .eq("user_id", user.id);
      }

      setLoading(false);
      console.error("Gagal menyimpan pembayaran:", error);
      alert("Gagal menyimpan pembayaran: " + error.message);
      return;
    }

    setLoading(false);
    setPaymentId(null);
    setPaymentAmount("");
    setPaymentAccountId("");
    await load();

    window.dispatchEvent(
      new Event("transactions-changed")
    );
  }

  async function remove(id: string) {
    if (!confirm("Hapus data ini?")) return;
    const { error } = await supabase.from("debts").delete().eq("id", id).eq("user_id", user.id);
    if (error) { alert("Gagal menghapus: " + error.message); return; }
    await load();
  }

  const totalDebt = items.filter((item) => item.type === "debt").reduce((sum, item) => sum + Number(item.remaining_amount), 0);
  const totalReceivable = items.filter((item) => item.type === "receivable").reduce((sum, item) => sum + Number(item.remaining_amount), 0);

  const filteredDebtItems = items.filter((item) => {
    const query = debtSearch.trim().toLowerCase();

    const matchesSearch =
      !query ||
      item.person_name.toLowerCase().includes(query) ||
      (item.notes || "").toLowerCase().includes(query) ||
      (item.type === "debt" ? "utang" : "piutang").includes(query) ||
      String(item.initial_amount).includes(query) ||
      String(item.remaining_amount).includes(query);

    if (!matchesSearch) return false;

    if (debtFilter === "all") return true;
    if (debtFilter === "debt") return item.type === "debt";
    if (debtFilter === "receivable") return item.type === "receivable";
    if (debtFilter === "active") return Number(item.remaining_amount) > 0;
    if (debtFilter === "paid") return Number(item.remaining_amount) <= 0;

    if (debtFilter === "overdue") {
      if (Number(item.remaining_amount) <= 0 || !item.due_date) return false;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const due = new Date(item.due_date + "T00:00:00");
      due.setHours(0, 0, 0, 0);

      return due.getTime() < today.getTime();
    }

    return true;
  });

  const dueSummary = items.reduce(
    (summary, item) => {
      if (Number(item.remaining_amount) <= 0 || !item.due_date) return summary;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const due = new Date(item.due_date + "T00:00:00");
      due.setHours(0, 0, 0, 0);

      const diffDays = Math.round(
        (due.getTime() - today.getTime()) / 86400000
      );

      if (diffDays < 0) {
        summary.overdue += 1;
      } else if (diffDays === 0) {
        summary.today += 1;
      } else if (diffDays <= 7) {
        summary.next7Days += 1;
      }

      return summary;
    },
    { overdue: 0, today: 0, next7Days: 0 }
  );

  return (
    <Layout user={user}>
      <div>
        <h1 className="text-2xl font-bold">Utang & Piutang</h1>
        <p className="mt-1 text-slate-500">Kelola utang dan piutang Anda dalam satu tempat.</p>
        
        {(dueSummary.overdue > 0 ||
          dueSummary.today > 0 ||
          dueSummary.next7Days > 0) && (
          <div
            className={
              "mt-4 rounded-2xl border p-4 " +
              (dueSummary.overdue > 0 || dueSummary.today > 0
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-amber-200 bg-amber-50 text-amber-700")
            }
          >
            <p className="font-semibold">
              {dueSummary.overdue > 0
                ? "⚠️ Perhatian: Ada " +
                  dueSummary.overdue +
                  " utang/piutang yang sudah terlambat."
                : dueSummary.today > 0
                ? "⚠️ Perhatian: Ada " +
                  dueSummary.today +
                  " utang/piutang yang jatuh tempo hari ini."
                : "🔔 Ada " +
                  dueSummary.next7Days +
                  " utang/piutang yang akan jatuh tempo dalam 7 hari."}
            </p>
            <p className="mt-1 text-sm opacity-80">
              Segera periksa bagian Detail Jatuh Tempo di bawah.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Total Utang</p><p className="mt-2 text-2xl font-bold text-red-600">{formatRupiah(totalDebt)}</p></div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Total Piutang</p><p className="mt-2 text-2xl font-bold text-green-600">{formatRupiah(totalReceivable)}</p></div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-600">Terlambat</p>
          <p className="mt-1 text-2xl font-bold text-red-700">{dueSummary.overdue}</p>
          <p className="text-xs text-red-600">utang/piutang belum lunas</p>
        </div>

        <div className="rounded-2xl border bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-600">Jatuh Tempo Hari Ini</p>
          <p className="mt-1 text-2xl font-bold text-red-700">{dueSummary.today}</p>
          <p className="text-xs text-red-600">perlu diperhatikan</p>
        </div>

        <div className="rounded-2xl border bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-600">≤ 7 Hari</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{dueSummary.next7Days}</p>
          <p className="text-xs text-amber-600">segera jatuh tempo</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="font-bold">Detail Jatuh Tempo</h2>
        <p className="mt-1 text-sm text-slate-500">
          Daftar utang/piutang yang terlambat atau segera jatuh tempo.
        </p>

        <div className="mt-4 space-y-3">
          {items
            .filter((item) => {
              if (Number(item.remaining_amount) <= 0 || !item.due_date) return false;

              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const due = new Date(item.due_date + "T00:00:00");
              due.setHours(0, 0, 0, 0);

              const diffDays = Math.round(
                (due.getTime() - today.getTime()) / 86400000
              );

              return diffDays <= 7;
            })
            .sort((a, b) => {
              return (
                new Date(a.due_date + "T00:00:00").getTime() -
                new Date(b.due_date + "T00:00:00").getTime()
              );
            })
            .map((item) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const due = new Date(item.due_date + "T00:00:00");
              due.setHours(0, 0, 0, 0);

              const diffDays = Math.round(
                (due.getTime() - today.getTime()) / 86400000
              );

              const isDebt = item.type === "debt";

              let label = "";
              let className = "";

              if (diffDays < 0) {
                label = "Terlambat " + Math.abs(diffDays) + " hari";
                className = "bg-red-50 text-red-600";
              } else if (diffDays === 0) {
                label = "Hari Ini";
                className = "bg-red-50 text-red-600";
              } else {
                label = diffDays + " hari lagi";
                className = "bg-amber-50 text-amber-600";
              }

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={
                          "rounded-full px-2.5 py-1 text-xs font-semibold " +
                          (isDebt
                            ? "bg-red-50 text-red-600"
                            : "bg-green-50 text-green-600")
                        }
                      >
                        {isDebt ? "Utang" : "Piutang"}
                      </span>
                      <span className="font-semibold">{item.person_name}</span>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      Jatuh tempo: {item.due_date ? formatTanggalIndonesia(item.due_date) : "-"}
                    </p>

                    <p className="mt-1 font-semibold">
                      Sisa: {formatRupiah(Number(item.remaining_amount))}
                    </p>
                  </div>

                  <span
                    className={
                      "w-fit rounded-full px-3 py-1 text-xs font-semibold " +
                      className
                    }
                  >
                    {label}
                  </span>
                </div>
              );
            })}

          {items.filter((item) => {
            if (Number(item.remaining_amount) <= 0 || !item.due_date) return false;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const due = new Date(item.due_date + "T00:00:00");
            due.setHours(0, 0, 0, 0);

            const diffDays = Math.round(
              (due.getTime() - today.getTime()) / 86400000
            );

            return diffDays <= 7;
          }).length === 0 && (
            <div className="rounded-xl border border-dashed p-5 text-center text-sm text-slate-500">
              Tidak ada utang/piutang yang jatuh tempo dalam 7 hari ke depan.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-bold">Filter Data</h2>
            <p className="text-sm text-slate-500">
              Tampilkan utang dan piutang sesuai kebutuhan.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <input
              type="text"
              value={debtSearch}
              onChange={(e) => setDebtSearch(e.target.value)}
              placeholder="Cari nama, catatan, atau nominal..."
              className="w-full rounded-xl border bg-white p-3 sm:w-72"
            />

            <select
              value={debtFilter}
              onChange={(e) =>
                setDebtFilter(
                  e.target.value as
                    | "all"
                    | "debt"
                    | "receivable"
                    | "active"
                    | "paid"
                    | "overdue"
                )
              }
              className="w-full rounded-xl border bg-white p-3 sm:w-auto"
            >
              <option value="all">Semua</option>
              <option value="debt">Utang</option>
              <option value="receivable">Piutang</option>
              <option value="active">Belum Lunas</option>
              <option value="paid">Lunas</option>
              <option value="overdue">Terlambat</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="font-bold">Tambah Utang / Piutang</h2>
          <form onSubmit={add} className="mt-4 space-y-3">
            <select value={type} onChange={(e) => setType(e.target.value as "debt" | "receivable")} className="w-full rounded-xl border p-3">
              <option value="debt">Utang</option>
              <option value="receivable">Piutang</option>
            </select>
            <input value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder={type === "debt" ? "Nama pemberi pinjaman" : "Nama orang yang meminjam"} className="w-full rounded-xl border p-3" />
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Jumlah Rp" className="w-full rounded-xl border p-3" />
            <div><label className="mb-1 block text-sm text-slate-600">Tanggal</label><input type="date" value={debtDate} onChange={(e) => setDebtDate(e.target.value)} className="w-full rounded-xl border p-3" /></div>
            <div><label className="mb-1 block text-sm text-slate-600">Jatuh Tempo (Opsional)</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-xl border p-3" /></div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan (opsional)" rows={3} className="w-full rounded-xl border p-3" />
            <button disabled={loading} className="w-full rounded-xl bg-blue-600 p-3 font-semibold text-white disabled:opacity-50">{loading ? "Menyimpan..." : "Simpan"}</button>
          </form>
        </div>

        <div className="space-y-4 lg:col-span-2">
          {items.length === 0 ? (
            <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">
              Belum ada data utang atau piutang.
            </div>
          ) : filteredDebtItems.length === 0 ? (
            <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">
              Tidak ada data yang sesuai dengan filter.
            </div>
          ) : (
            filteredDebtItems.map((item) => {
              const isDebt = item.type === "debt";
              const isPaid = Number(item.remaining_amount) <= 0;
              const dueDateInfo = (() => {
                if (isPaid || !item.due_date) return null;

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const due = new Date(item.due_date + "T00:00:00");
                due.setHours(0, 0, 0, 0);

                const diffDays = Math.round(
                  (due.getTime() - today.getTime()) / 86400000
                );

                if (diffDays < 0) {
                  return {
                    label: "Terlambat " + Math.abs(diffDays) + " hari",
                    className: "bg-red-50 text-red-600",
                  };
                }

                if (diffDays === 0) {
                  return {
                    label: "Jatuh Tempo Hari Ini",
                    className: "bg-red-50 text-red-600",
                  };
                }

                if (diffDays <= 7) {
                  return {
                    label: "Jatuh Tempo " + diffDays + " hari lagi",
                    className: "bg-amber-50 text-amber-600",
                  };
                }

                return {
                  label: "Jatuh Tempo " + diffDays + " hari lagi",
                  className: "bg-blue-50 text-blue-600",
                };
              })();
              const history = paymentHistory
                .filter((payment) => payment.debt_id === item.id)
                .sort((a, b) => {
                  const dateDiff =
                    new Date(b.payment_date).getTime() -
                    new Date(a.payment_date).getTime();

                  return dateDiff !== 0
                    ? dateDiff
                    : new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime();
                });
              return (
                <div key={item.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={"rounded-full px-3 py-1 text-xs font-semibold " + (isDebt ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>{isDebt ? "Utang" : "Piutang"}</span>
                      <h2 className="mt-3 text-lg font-bold">{item.person_name}</h2>
                    </div>
                    <button onClick={() => remove(item.id)}><Trash2 className="text-red-500" size={18} /></button>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div><p className="text-sm text-slate-500">Jumlah Awal</p><p className="font-semibold">{formatRupiah(Number(item.initial_amount))}</p></div>
                    <div><p className="text-sm text-slate-500">Sisa</p><p className={isPaid ? "font-semibold text-green-600" : "font-semibold text-blue-600"}>{formatRupiah(Number(item.remaining_amount))}</p></div>
                    <div><p className="text-sm text-slate-500">Tanggal</p><p className="font-medium">{formatTanggalIndonesia(item.debt_date)}</p></div>
                    {item.due_date && <div><p className="text-sm text-slate-500">Jatuh Tempo</p><p className="font-medium">{formatTanggalIndonesia(item.due_date)}</p></div>}
                  </div>

                  {(() => {
                    const initialAmount = Number(item.initial_amount);
                    const paidAmount = Number(item.paid_amount);
                    const remainingAmount = Number(item.remaining_amount);
                    const progress =
                      initialAmount > 0
                        ? Math.min(100, Math.max(0, (paidAmount / initialAmount) * 100))
                        : 0;

                    return (
                      <div className="mt-4 rounded-xl border bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-700">
                            Progress Pelunasan
                          </p>
                          <span className="text-sm font-bold text-blue-600">
                            {progress.toFixed(0)}%
                          </span>
                        </div>

                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all"
                            style={{ width: progress + "%" }}
                          />
                        </div>

                        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                          <p className="text-slate-600">
                            {isDebt ? "Sudah dibayar" : "Sudah diterima"}:{" "}
                            <span className="font-semibold text-green-600">
                              {formatRupiah(paidAmount)}
                            </span>
                          </p>
                          <p className="text-slate-600 sm:text-right">
                            Sisa:{" "}
                            <span className="font-semibold text-blue-600">
                              {formatRupiah(remainingAmount)}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {item.notes && <p className="mt-4 text-sm text-slate-600">{item.notes}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className={"rounded-full px-3 py-1 text-xs font-semibold " + (isPaid ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600")}>
                      {isPaid ? "Lunas" : "Belum Lunas"}
                    </span>

                    {dueDateInfo && (
                      <span className={"rounded-full px-3 py-1 text-xs font-semibold " + dueDateInfo.className}>
                        {dueDateInfo.label}
                      </span>
                    )}

                    {!isPaid && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentId(item.id);
                          setPaymentAmount("");
                          setPaymentAccountId("");
                        }}
                        className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Bayar / Cicil
                      </button>
                    )}
                  </div>

                  {history.length > 0 && (
                    <div className="mt-4 rounded-xl border bg-slate-50 p-4">
                      <p className="font-semibold">Riwayat Cicilan</p>

                      <div className="mt-3 space-y-2">
                        {history.map((payment, index) => {
                          const account = accounts.find(
                            (account) => account.id === payment.account_id
                          );

                          return (
                            <div
                              key={payment.id}
                              className="flex items-center justify-between gap-3 rounded-lg bg-white p-3"
                            >
                              <div>
                                <p className="text-sm font-semibold">
                                  Cicilan #{history.length - index}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {formatTanggalIndonesia(payment.payment_date)}
                                  {account ? " • " + account.name : ""}
                                </p>
                              </div>

                              <p
                                className={
                                  isDebt
                                    ? "font-semibold text-red-600"
                                    : "font-semibold text-green-600"
                                }
                              >
                                {formatRupiah(Number(payment.amount))}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {paymentId === item.id && !isPaid && (
                    <div className="mt-4 rounded-xl border bg-slate-50 p-4">
                      <p className="mb-3 text-sm font-semibold">Pembayaran / Cicilan</p>

                      <select
                        value={paymentAccountId}
                        onChange={(e) => setPaymentAccountId(e.target.value)}
                        className="mb-3 w-full rounded-xl border bg-white p-3"
                      >
                        <option value="">Pilih sumber pembayaran</option>
                        <option value="saldo">Saldo Utama</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name} ({account.type})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        max={Number(item.remaining_amount)}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder={"Maksimal " + formatRupiah(Number(item.remaining_amount))}
                        className="w-full rounded-xl border bg-white p-3"
                      />

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => pay(item)}
                          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          {loading ? "Menyimpan..." : "Simpan Pembayaran"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPaymentId(null);
                            setPaymentAmount("");
                            setPaymentAccountId("");
                          }}
                          className="rounded-xl border px-4 py-2 text-sm font-semibold"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}

function Pengaturan({ user }: { user: User }) {
  const [nama, setNama] = useState(
    user.user_metadata?.nama || ""
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmedName = nama.trim();

    if (!trimmedName) {
      setMessage("Nama tidak boleh kosong.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      data: {
        nama: trimmedName,
      },
    });

    setSaving(false);

    setMessage(
      error
        ? error.message
        : "Pengaturan berhasil disimpan."
    );
  }

  return (
    <Layout user={user}>
      <h1 className="text-2xl font-bold">Pengaturan</h1>
      <p className="mt-1 text-slate-500">
        Kelola informasi akun Anda.
      </p>

      <div className="mt-6 max-w-2xl rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="font-bold">Profil</h2>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Nama
            </label>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              value={user.email || ""}
              disabled
              className="w-full rounded-xl border bg-slate-50 p-3"
            />
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>

          {message && (
            <p
              className={
                "text-sm " +
                (message === "Pengaturan berhasil disimpan."
                  ? "text-green-600"
                  : "text-red-600")
              }
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}

function Protected({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes({ user }: { user: User | null }) {
  return (
    <Routes>
      <Route path="/" element={<Beranda />} />

      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <HalamanAutentikasi mode="login" />
          )
        }
      />

      <Route
        path="/daftar"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <HalamanAutentikasi mode="daftar" />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          <Protected user={user}>
            <Dashboard user={user as User} />
          </Protected>
        }
      />

      <Route
        path="/transaksi"
        element={
          <Protected user={user}>
            <Transaksi user={user as User} />
          </Protected>
        }
      />

      <Route
        path="/tabungan"
        element={
          <Protected user={user}>
            <Tabungan user={user as User} />
          </Protected>
        }
      />

      <Route
        path="/laporan"
        element={
          <Protected user={user}>
            <Laporan user={user as User} />
          </Protected>
        }
      />

      <Route
        path="/anggaran"
        element={
          <Protected user={user}>
            <Anggaran user={user as User} />
          </Protected>
        }
      />

      <Route
        path="/dompet"
        element={
          <Protected user={user}>
            <Dompet user={user as User} />
          </Protected>
        }
      />

      <Route
        path="/utang-piutang"
        element={
          <Protected user={user}>
            <UtangPiutang user={user as User} />
          </Protected>
        }
      />

      <Route
        path="/pengaturan"
        element={
          <Protected user={user}>
            <Pengaturan user={user as User} />
          </Protected>
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();

      if (mounted) {
        setUser(data.session?.user ?? null);
        setLoading(false);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="mt-4 text-sm text-slate-500">
            Memuat FINANSAPP...
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes user={user} />
    </BrowserRouter>
  );
}
